/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.25.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.1";

type Body = { reservaId: number };

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
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
 * Función principal (Edge Function) que genera el PaymentIntent de Stripe.
 *
 * Se ejecuta al iniciar el componente CheckoutElements para generar
 * una intención de pago vinculada de forma segura a una reserva real.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader.toLowerCase().startsWith("bearer ")) return json({ error: "Unauthorized" }, 401);

    const { reservaId } = (await req.json()) as Body;
    if (!reservaId) return json({ error: "Missing reservaId" }, 400);

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Validar usuario actual a partir del JWT del cliente
    const jwt = authHeader.slice("bearer ".length);
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(jwt);
    if (userErr || !userData?.user) return json({ error: "Unauthorized" }, 401);
    const user = userData.user;

    // Cargar reserva y validar ownership + estado
    const { data: reserva, error: rErr } = await supabaseAdmin
      .from("reservas")
      .select("id, user_id, precio_cents, currency, payment_status, instalaciones(nombre)")
      .eq("id", reservaId)
      .single();

    if (rErr || !reserva) return json({ error: "Reserva no encontrada" }, 404);
    if (reserva.user_id !== user.id) return json({ error: "Forbidden" }, 403);
    if (reserva.payment_status === "paid") return json({ error: "Ya está pagada" }, 409);

    const amount = Number(reserva.precio_cents ?? 0);
    if (!Number.isFinite(amount) || amount < 0) return json({ error: "Invalid amount" }, 400);

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
        currency: (reserva.currency ?? "eur").toLowerCase(),
        receipt_email: user.email ?? undefined,
        metadata: {
          reserva_id: String(reserva.id),
          user_id: user.id,
        },
        description: `Reserva — ${reserva.instalaciones?.nombre ?? "Instalación"}`,
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
      currency: (reserva.currency ?? "eur").toLowerCase(),
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
    return json({ error: "Internal error", details: err.message, stack: err.stack }, 200);
  }
});
