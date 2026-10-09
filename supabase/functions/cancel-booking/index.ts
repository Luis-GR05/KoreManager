/// <reference lib="deno.ns" />
/**
 * Edge Function · cancel-booking
 *
 * Cancela una reserva y, si estaba pagada, devuelve el importe con Stripe.
 * - Usuario: puede cancelar sus reservas pagadas hasta CANCEL_MIN_HOURS
 *   (por defecto 24 h) antes del inicio, con reembolso completo.
 * - Personal (admin/conserje): puede cancelar cualquier reserva futura.
 * Las reservas pendientes se cancelan sin cobro.
 */
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.25.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.1";
import { json as jsonRes, preflight, rateLimit, retryAfter } from "../_shared/http.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-06-20" });
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CANCEL_MIN_HOURS = Number(Deno.env.get("CANCEL_MIN_HOURS") ?? "24");

/** Fecha y hora de inicio en horario peninsular → epoch ms. */
function startMs(fecha: string, hora: string): number {
  const local = new Date(`${fecha}T${hora.slice(0, 5)}:00Z`);
  const tz = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Madrid", timeZoneName: "shortOffset" })
    .formatToParts(local).find((p) => p.type === "timeZoneName")?.value ?? "GMT+1";
  const m = tz.match(/GMT([+-]\d+)(?::(\d+))?/);
  const offsetMin = m ? Number(m[1]) * 60 + Math.sign(Number(m[1])) * Number(m[2] ?? 0) : 60;
  return local.getTime() - offsetMin * 60_000;
}

serve(async (req) => {
  const json = (d: unknown, s = 200, e: Record<string, string> = {}) => jsonRes(req, d, s, e);
  if (req.method === "OPTIONS") return preflight(req);
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    const auth = req.headers.get("authorization") ?? "";
    if (!auth.toLowerCase().startsWith("bearer ")) return json({ error: "unauthorized" }, 401);
    const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
    const { data: u } = await admin.auth.getUser(auth.slice(7).trim());
    const user = u?.user;
    if (!user) return json({ error: "unauthorized" }, 401);

    const rl = await rateLimit(admin, `cancel:${user.id}`, 10, 600, true);
    if (!rl.allowed) return json({ error: "rate_limited" }, 429, { "retry-after": retryAfter(rl.resetAt) });

    const { reservaId } = await req.json();
    let id = Number(reservaId);
    if (!Number.isInteger(id) || id <= 0) return json({ error: "bad_request" }, 400);

    const { data: prof } = await admin.from("profiles").select("roles(nombre)").eq("id", user.id).maybeSingle();
    // deno-lint-ignore no-explicit-any
    const role = String((prof as any)?.roles?.nombre ?? "").toLowerCase();
    const staff = role === "admin" || role === "conserje";

    let { data: r } = await admin
      .from("reservas")
      .select("id, user_id, fecha, hora, currency, payment_status, stripe_payment_intent_id")
      .eq("id", id).maybeSingle();
    if (r?.currency?.startsWith("linked_")) {
      id = Number(r.currency.slice(7));
      ({ data: r } = await admin
        .from("reservas")
        .select("id, user_id, fecha, hora, currency, payment_status, stripe_payment_intent_id")
        .eq("id", id).maybeSingle());
    }
    if (!r || (r.user_id !== user.id && !staff)) return json({ error: "not_found" }, 404);

    const start = startMs(r.fecha, String(r.hora));
    if (start <= Date.now()) return json({ error: "past" }, 409);

    if (r.payment_status === "pending") {
      await admin.from("reservas").update({ payment_status: "cancelled" }).or(`id.eq.${id},currency.eq.linked_${id}`).eq("payment_status", "pending");
      await admin.from("payments").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("reserva_id", id).in("status", ["created", "pending"]);
      return json({ status: "cancelled" });
    }

    if (r.payment_status !== "paid") return json({ status: r.payment_status });

    if (!staff && start - Date.now() < CANCEL_MIN_HOURS * 3_600_000) {
      return json({ error: "too_late", hours: CANCEL_MIN_HOURS }, 409);
    }
    if (!r.stripe_payment_intent_id) return json({ error: "no_payment" }, 409);

    await stripe.refunds.create(
      { payment_intent: r.stripe_payment_intent_id, metadata: { reserva_id: String(id), by: staff ? "staff" : "user" } },
      { idempotencyKey: `refund_${id}_${r.stripe_payment_intent_id}` },
    );
    const { error } = await admin.rpc("mark_booking_refunded", { p_id: id });
    if (error) throw error;
    return json({ status: "refunded" });
  } catch (err) {
    console.error("[cancel-booking]", (err as Error)?.message);
    return json({ error: "internal" }, 500);
  }
});
