/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.25.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.1";
import { computeAmountCents, json as jsonRes, preflight, rateLimit, retryAfter } from "../_shared/http.ts";

type Body = { reservaId: number };

/** Nombre de la instalación (PostgREST puede devolver objeto o array). */
function installationName(rel: unknown): string {
  const r = Array.isArray(rel) ? rel[0] : rel;
  return (r as { nombre?: string } | null)?.nombre ?? "Instalación";
}

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

/**
 * Función principal (Edge Function) que genera el PaymentIntent de Stripe.
 *
 * Se ejecuta al iniciar el componente CheckoutElements para generar
 * una intención de pago vinculada de forma segura a una reserva real.
 */
serve(async (req) => {
  const json = (data: unknown, status = 200, extra: Record<string, string> = {}) => jsonRes(req, data, status, extra);
  if (req.method === "OPTIONS") return preflight(req);

  try {
    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader.toLowerCase().startsWith("bearer ")) return json({ error: "Unauthorized" }, 401);

    const { reservaId } = (await req.json()) as Body;
    if (!Number.isInteger(Number(reservaId)) || Number(reservaId) <= 0) return json({ error: "Missing reservaId" }, 400);

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Validar usuario actual a partir del JWT del cliente
    const jwt = authHeader.slice("bearer ".length);
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(jwt);
    if (userErr || !userData?.user) return json({ error: "Unauthorized" }, 401);
    const user = userData.user;

    // Máx. 10 intentos de pago cada 10 minutos por usuario
    const rl = await rateLimit(supabaseAdmin, `pay:${user.id}`, 10, 600, true);
    if (!rl.allowed) return json({ error: "rate_limited" }, 429, { "retry-after": retryAfter(rl.resetAt) });

    // Cargar reserva y validar ownership + estado
    const { data: reserva, error: rErr } = await supabaseAdmin
      .from("reservas")
      .select("id, user_id, installation_id, precio_cents, currency, payment_status, instalaciones(nombre)")
      .eq("id", reservaId)
      .single();

    if (rErr || !reserva) return json({ error: "Reserva no encontrada" }, 404);
    if (reserva.user_id !== user.id) return json({ error: "Forbidden" }, 403);
    if (reserva.payment_status === "paid") return json({ error: "Ya está pagada" }, 409);
    if (reserva.payment_status !== "pending") return json({ error: "expired" }, 409);

    // El importe se calcula en servidor: nunca se usa el precio enviado por el navegador
    if (String(reserva.currency ?? "").startsWith("linked_")) return json({ error: "Pay the main booking" }, 400);
    const amount = await computeAmountCents(supabaseAdmin, reserva);
    if (!Number.isFinite(amount) || amount < 50) return json({ error: "Invalid amount" }, 400);
    if (amount !== Number(reserva.precio_cents)) {
      await supabaseAdmin.from("reservas").update({ precio_cents: amount }).eq("id", reserva.id);
    }

    // Buscar si ya existe un PaymentIntent pendiente para esta reserva
    const existingPayment = await supabaseAdmin
      .from("payments")
      .select("payment_intent_id, status")
      .eq("reserva_id", reserva.id)
      .in("status", ["created", "pending"])
      .not("payment_intent_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingPayment.data?.payment_intent_id) {
      const existingIntent = await stripe.paymentIntents.retrieve(existingPayment.data.payment_intent_id);
      if (existingIntent.status === "requires_payment_method") {
        return json({ clientSecret: existingIntent.client_secret });
      }
    }

    // Crear un nuevo PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount,
        currency: "eur",
        receipt_email: user.email ?? undefined,
        metadata: {
          reserva_id: String(reserva.id),
          user_id: user.id,
        },
        description: `Reserva — ${installationName(reserva.instalaciones)}`,
      },
      {
        idempotencyKey: `payment_intent_reserva_${reserva.id}_${Date.now()}`,
      }
    );

    // Registrar el payment pendiente en la BD
    await supabaseAdmin.from("payments").insert({
      reserva_id: reserva.id,
      user_id: user.id,
      provider: "stripe",
      amount_cents: amount,
      currency: "eur",
      status: "pending",
      payment_intent_id: paymentIntent.id,
    });

    // Vincularlo a la reserva
    await supabaseAdmin
      .from("reservas")
      .update({ stripe_payment_intent_id: paymentIntent.id, payment_status: "pending" })
      .eq("id", reserva.id);

    return json({ clientSecret: paymentIntent.client_secret });
  } catch (err: any) {
    console.error("[create-payment-intent]", err?.message);
    return json({ error: "Internal error" }, 500);
  }
});
