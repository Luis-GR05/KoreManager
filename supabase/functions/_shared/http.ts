/// <reference lib="deno.ns" />
/**
 * Utilidades compartidas por las edge functions de KoreManager:
 * CORS con lista blanca, respuestas JSON, IP del cliente y rate limiting.
 *
 * Variables de entorno:
 *   ALLOWED_ORIGINS  Orígenes permitidos separados por comas.
 *                    Por defecto: producción + localhost de Vite.
 */
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.90.1";

// deno-lint-ignore no-explicit-any
type AnyClient = SupabaseClient<any, any, any>;

const DEFAULT_ORIGINS = [
  "https://kore-manager.vercel.app",
  "http://localhost:5173",
  "http://localhost:4173",
];

export const ALLOWED_ORIGINS: string[] = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
if (ALLOWED_ORIGINS.length === 0) ALLOWED_ORIGINS.push(...DEFAULT_ORIGINS);

/** ¿El origen de la petición está en la lista blanca? */
export function isAllowedOrigin(origin: string | null): boolean {
  return !!origin && ALLOWED_ORIGINS.includes(origin);
}

/** Cabeceras CORS: solo reflejan el origen si está permitido. */
export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin");
  return {
    "access-control-allow-origin": isAllowedOrigin(origin) ? origin! : ALLOWED_ORIGINS[0],
    "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-max-age": "86400",
    vary: "Origin",
  };
}

/** Respuesta JSON con CORS y sin caché. */
export function json(req: Request, data: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders(req),
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      ...extra,
    },
  });
}

/** Respuesta al preflight CORS. */
export function preflight(req: Request): Response {
  return new Response(null, { status: 204, headers: corsHeaders(req) });
}

/** IP del cliente (primer salto de X-Forwarded-For). */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for") ?? "";
  return fwd.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

export type RateResult = { allowed: boolean; remaining: number; resetAt: string | null };

/**
 * Suma una petición al contador `bucket` (función SQL `hit_rate_limit`).
 * @param failOpen  si la BD falla: true deja pasar, false bloquea.
 */
export async function rateLimit(
  admin: AnyClient,
  bucket: string,
  max: number,
  windowSeconds: number,
  failOpen = false,
): Promise<RateResult> {
  const { data, error } = await admin.rpc("hit_rate_limit", {
    p_bucket: bucket,
    p_max: max,
    p_window_seconds: windowSeconds,
  });
  if (error || !data?.[0]) {
    console.error("[rateLimit]", bucket.split(":")[0], error?.message);
    return { allowed: failOpen, remaining: 0, resetAt: null };
  }
  const row = data[0] as { allowed: boolean; remaining: number; reset_at: string };
  return { allowed: row.allowed, remaining: row.remaining, resetAt: row.reset_at };
}

/** Segundos hasta `resetAt` (para la cabecera Retry-After). */
export function retryAfter(resetAt: string | null): string {
  if (!resetAt) return "60";
  return String(Math.max(1, Math.ceil((new Date(resetAt).getTime() - Date.now()) / 1000)));
}

/**
 * Importe real de una reserva calculado en servidor (nunca confiar en el
 * precio que envía el navegador): precio por franja × nº de franjas
 * (la principal + las enlazadas con currency = 'linked_<id>').
 */
export async function computeAmountCents(
  admin: AnyClient,
  reserva: { id: number; user_id: string },
): Promise<number> {
  const slotPrice = Number(Deno.env.get("SLOT_PRICE_CENTS") ?? "500");
  const { count } = await admin
    .from("reservas")
    .select("id", { count: "exact", head: true })
    .eq("user_id", reserva.user_id)
    .eq("currency", `linked_${reserva.id}`)
    .neq("payment_status", "cancelled");
  return slotPrice * (1 + (count ?? 0));
}
