/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.25.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.1";

type Body = { reservaId: number };

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE_URL = Deno.env.get("SITE_URL") ?? "";

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
      },
    });
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

    const origin = req.headers.get("origin") ?? SITE_URL;
    if (!origin) return json({ error: "Missing SITE_URL/origin" }, 500);

    const amount = Number(reserva.precio_cents ?? 0);
    if (!Number.isFinite(amount) || amount < 0) return json({ error: "Invalid amount" }, 400);

    // Crear Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email ?? undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: (reserva.currency ?? "eur").toLowerCase(),
            unit_amount: amount,
            product_data: {
              name: `Reserva — ${reserva.instalaciones?.nombre ?? "Instalación"}`,
              metadata: { reserva_id: String(reserva.id) },
            },
          },
        },
      ],
      success_url: `${origin}/pago/exito?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pago/cancelado?reserva_id=${reserva.id}`,
      metadata: {
        reserva_id: String(reserva.id),
        user_id: user.id,
      },
    });

    // Registrar payment (idempotente simple por checkout_session_id si se reintenta)
    await supabaseAdmin.from("payments").insert({
      reserva_id: reserva.id,
      user_id: user.id,
      provider: "stripe",
      amount_cents: amount,
      currency: (reserva.currency ?? "eur").toLowerCase(),
      status: "pending",
      checkout_session_id: session.id,
    });

    // Guardar en reserva (para trazabilidad)
    await supabaseAdmin
      .from("reservas")
      .update({ stripe_checkout_session_id: session.id, payment_status: "pending" })
      .eq("id", reserva.id);

    return json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error(err);
    return json({ error: "Internal error" }, 500);
  }
});

