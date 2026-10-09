/// <reference lib="deno.ns" />
/**
 * Edge Function · stripe-webhook
 *
 * Procesa los eventos de Stripe (firma verificada). Toda la lógica de estado
 * vive en SQL (mark_booking_paid / mark_booking_refunded) para que la reserva
 * principal y sus franjas enlazadas cambien siempre juntas.
 *
 * - Pago correcto → reserva pagada. Si la reserva ya había caducado o se había
 *   cancelado, se devuelve el dinero automáticamente.
 * - Pago fallido → solo se marca el registro de pago; la reserva sigue
 *   pendiente para que el usuario pueda reintentar antes de que caduque.
 * - Reembolso hecho desde el panel de Stripe → reserva reembolsada.
 */
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.25.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.1";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-06-20" });
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8" } });

const now = () => new Date().toISOString();

/** Marca pagada; si ya no se puede (caducada/cancelada) devuelve el dinero. */
async function settle(reservaId: number, intentId: string | null, sessionId: string | null) {
  if (!reservaId) return;
  const { data: ok, error } = await admin.rpc("mark_booking_paid", { p_id: reservaId, p_intent: intentId, p_session: sessionId });
  if (error) throw error;
  if (!ok && intentId) {
    await stripe.refunds.create({ payment_intent: intentId }, { idempotencyKey: `refund_expired_${reservaId}_${intentId}` });
    await admin.from("payments").update({ status: "refunded", updated_at: now() }).eq("payment_intent_id", intentId);
  }
}

serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let event: Stripe.Event;
  try {
    const sig = req.headers.get("stripe-signature");
    if (!sig) return json({ error: "Missing signature" }, 400);
    event = await stripe.webhooks.constructEventAsync(await req.text(), sig, STRIPE_WEBHOOK_SECRET);
  } catch {
    return json({ error: "Invalid signature" }, 400);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        if (s.payment_status !== "paid") break;
        const pi = typeof s.payment_intent === "string" ? s.payment_intent : s.payment_intent?.id ?? null;
        await settle(Number(s.metadata?.reserva_id), pi, s.id);
        break;
      }
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        await settle(Number(pi.metadata?.reserva_id), pi.id, null);
        break;
      }
      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        await admin.from("payments").update({ status: "failed", updated_at: now() }).eq("payment_intent_id", pi.id);
        break;
      }
      case "checkout.session.expired": {
        const s = event.data.object as Stripe.Checkout.Session;
        await admin.from("payments").update({ status: "cancelled", updated_at: now() }).eq("checkout_session_id", s.id);
        break;
      }
      case "charge.refunded": {
        const ch = event.data.object as Stripe.Charge;
        const pi = typeof ch.payment_intent === "string" ? ch.payment_intent : ch.payment_intent?.id;
        if (ch.refunded && pi) {
          const { data: r } = await admin.from("reservas").select("id").eq("stripe_payment_intent_id", pi).maybeSingle();
          if (r?.id) await admin.rpc("mark_booking_refunded", { p_id: r.id });
        }
        break;
      }
      default:
        break;
    }
    return json({ received: true });
  } catch (err) {
    console.error("[stripe-webhook]", event.type, (err as Error)?.message);
    // 500 → Stripe reintentará el evento
    return json({ error: "processing_error" }, 500);
  }
});
