/// <reference lib="deno.ns" />
/**
 * Edge Function · confirm-payment
 *
 * El navegador la llama justo después de que Stripe confirme el pago.
 * Comprueba el PaymentIntent directamente con Stripe (nunca se fía del
 * cliente) y marca la reserva y sus franjas como pagadas. Así la reserva
 * queda confirmada al instante aunque el webhook tarde o no esté configurado.
 * Si la reserva ya había caducado, devuelve el dinero automáticamente.
 */
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.25.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.1";
import { json as jsonRes, preflight, rateLimit, retryAfter } from "../_shared/http.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-06-20" });
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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

    const rl = await rateLimit(admin, `confirm:${user.id}`, 20, 600, true);
    if (!rl.allowed) return json({ error: "rate_limited" }, 429, { "retry-after": retryAfter(rl.resetAt) });

    const { reservaId, paymentIntentId } = await req.json();
    const id = Number(reservaId);
    if (!Number.isInteger(id) || id <= 0) return json({ error: "bad_request" }, 400);

    const { data: reserva } = await admin
      .from("reservas")
      .select("id, user_id, payment_status, stripe_payment_intent_id")
      .eq("id", id)
      .maybeSingle();
    if (!reserva || reserva.user_id !== user.id) return json({ error: "not_found" }, 404);
    if (reserva.payment_status === "paid") return json({ status: "paid" });
    // El navegador indica qué PaymentIntent acaba de confirmar; si no, el último guardado
    const intentId = typeof paymentIntentId === "string" && paymentIntentId.startsWith("pi_")
      ? paymentIntentId
      : reserva.stripe_payment_intent_id;
    if (!intentId) return json({ status: reserva.payment_status });

    const pi = await stripe.paymentIntents.retrieve(intentId);
    if (pi.metadata?.reserva_id !== String(id)) return json({ error: "mismatch" }, 409);
    if (pi.status !== "succeeded") return json({ status: "pending", stripe: pi.status });

    const { data: ok, error } = await admin.rpc("mark_booking_paid", { p_id: id, p_intent: pi.id, p_session: null });
    if (error) throw error;

    if (!ok) {
      // La reserva caducó o se canceló mientras se pagaba: devolvemos el dinero
      await stripe.refunds.create({ payment_intent: pi.id }, { idempotencyKey: `refund_expired_${id}_${pi.id}` });
      await admin.from("payments").update({ status: "refunded", updated_at: new Date().toISOString() }).eq("payment_intent_id", pi.id);
      return json({ status: "refunded" });
    }
    return json({ status: "paid" });
  } catch (err) {
    console.error("[confirm-payment]", (err as Error)?.message);
    return json({ error: "internal" }, 500);
  }
});
