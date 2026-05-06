/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.25.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.1";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "stripe-signature, content-type",
  "access-control-allow-methods": "POST, OPTIONS",
};

/**
 * Genera una respuesta JSON con cabeceras CORS.
 * 
 * @param {unknown} data - Objeto o mensaje de respuesta.
 * @param {number} [status=200] - Código de estado HTTP.
 * @returns {Response} - Objeto Response formateado.
 */
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "content-type": "application/json; charset=utf-8",
    },
  });
}

/**
 * Manejador principal de Webhooks de Stripe.
 *
 * Se encarga de procesar de forma segura los eventos enviados por Stripe
 * mediante la verificación de firmas y actualizar la base de datos en consecuencia.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const sig = req.headers.get("stripe-signature");
    if (!sig) return json({ error: "Missing signature" }, 400);

    const rawBody = await req.text();
    const event = await stripe.webhooks.constructEventAsync(rawBody, sig, STRIPE_WEBHOOK_SECRET);

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const reservaId = Number(session.metadata?.reserva_id);
      const paymentIntent = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;

      if (!reservaId) return json({ ok: true });

      // 1) Marcar reserva pagada
      await supabaseAdmin
        .from("reservas")
        .update({
          payment_status: "paid",
          paid_at: new Date().toISOString(),
          stripe_payment_intent_id: paymentIntent ?? null,
          stripe_checkout_session_id: session.id,
        })
        .eq("id", reservaId);

      // 2) Marcar payment pagado
      await supabaseAdmin
        .from("payments")
        .update({
          status: "paid",
          payment_intent_id: paymentIntent ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("checkout_session_id", session.id);
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      const reservaId = Number(session.metadata?.reserva_id);

      if (reservaId) {
        await supabaseAdmin
          .from("reservas")
          .update({
            payment_status: "cancelled",
            stripe_checkout_session_id: session.id,
          })
          .eq("id", reservaId)
          .neq("payment_status", "paid");
      }

      await supabaseAdmin
        .from("payments")
        .update({
          status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("checkout_session_id", session.id);
    }

    if (event.type === "checkout.session.async_payment_failed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const reservaId = Number(session.metadata?.reserva_id);

      if (reservaId) {
        await supabaseAdmin
          .from("reservas")
          .update({
            payment_status: "failed",
            stripe_checkout_session_id: session.id,
          })
          .eq("id", reservaId)
          .neq("payment_status", "paid");
      }

      await supabaseAdmin
        .from("payments")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("checkout_session_id", session.id);
    }

    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const reservaId = Number(paymentIntent.metadata?.reserva_id);

      if (reservaId) {
        await supabaseAdmin
          .from("reservas")
          .update({
            payment_status: "failed",
            stripe_payment_intent_id: paymentIntent.id,
          })
          .eq("id", reservaId)
          .neq("payment_status", "paid");
      }

      await supabaseAdmin
        .from("payments")
        .update({
          status: "failed",
          payment_intent_id: paymentIntent.id,
          updated_at: new Date().toISOString(),
        })
        .eq("payment_intent_id", paymentIntent.id);

      if (reservaId) {
        await supabaseAdmin
          .from("payments")
          .update({
            status: "failed",
            payment_intent_id: paymentIntent.id,
            updated_at: new Date().toISOString(),
          })
          .eq("reserva_id", reservaId)
          .in("status", ["created", "pending"]);
      }
    }

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const reservaId = Number(paymentIntent.metadata?.reserva_id);

      if (reservaId) {
        // 1) Marcar reserva pagada
        await supabaseAdmin
          .from("reservas")
          .update({
            payment_status: "paid",
            paid_at: new Date().toISOString(),
            stripe_payment_intent_id: paymentIntent.id,
          })
          .eq("id", reservaId);

        // 2) Marcar payment pagado
        await supabaseAdmin
          .from("payments")
          .update({
            status: "paid",
            payment_intent_id: paymentIntent.id,
            updated_at: new Date().toISOString(),
          })
          .eq("reserva_id", reservaId)
          .eq("payment_intent_id", paymentIntent.id);
      }
    }

    return json({ received: true });
  } catch (err: any) {
    return json({ error: "Webhook error", details: err.message }, 400);
  }
});

