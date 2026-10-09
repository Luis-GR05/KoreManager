import { supabase } from '../supabaseClient';

/** Franjas reservables (deben coincidir con `create_booking` en SQL). */
export const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00', '13:00',
  '16:00', '17:00', '18:00', '19:00', '20:00', '21:00',
];

/** Máximo de franjas por reserva y días de antelación (igual que en SQL). */
export const MAX_SLOTS = 6;
export const MAX_DAYS_AHEAD = 60;
/** Margen mínimo para reservar una franja (las pendientes caducan antes). */
export const MIN_LEAD_HOURS = 3;
/** Precio por defecto si la pista aún no tiene `precio_hora_cents`. */
export const DEFAULT_PRICE_CENTS = 500;

const pad = (n) => String(n).padStart(2, '0');

/** Fecha local en formato YYYY-MM-DD (sin el desfase de `toISOString`). */
export function localIsoDate(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Suma días a una fecha YYYY-MM-DD. */
export function addDaysIso(iso, days) {
  const [y, m, d] = iso.split('-').map(Number);
  return localIsoDate(new Date(y, m - 1, d + days));
}

/** Inicio de la franja (hora local del navegador) en milisegundos. */
export function slotStartMs(fecha, hora) {
  return new Date(`${fecha}T${String(hora).slice(0, 5)}:00`).getTime();
}

/** Formatea céntimos como euros según el idioma. */
export function formatEuros(cents, lang = 'es') {
  return new Intl.NumberFormat(lang.startsWith('en') ? 'en-IE' : 'es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format((Number(cents) || 0) / 100);
}

/** Precio por hora de una instalación, con valor por defecto. */
export function pricePerSlot(inst) {
  const v = Number(inst?.precio_hora_cents);
  return Number.isFinite(v) && v >= 0 ? v : DEFAULT_PRICE_CENTS;
}

/** Id de la reserva principal (las franjas extra guardan `linked_<id>`). */
export function parentIdOf(r) {
  return r?.currency?.startsWith('linked_') ? Number(r.currency.slice(7)) : r?.id;
}

/**
 * Agrupa las filas de `reservas` (principal + franjas enlazadas) en una sola
 * reserva con la lista de horas.
 * @param {any[]} rows
 */
export function groupReservas(rows) {
  const map = new Map();
  for (const r of rows) {
    const pid = parentIdOf(r);
    if (!map.has(pid)) map.set(pid, { parent: null, slots: [] });
    const g = map.get(pid);
    g.slots.push(String(r.hora).slice(0, 5));
    if (r.id === pid) g.parent = r;
  }
  const out = [];
  for (const g of map.values()) {
    if (!g.parent) continue; // la principal no es visible (no debería pasar)
    out.push({ ...g.parent, franjas: [...new Set(g.slots)].sort() });
  }
  return out;
}

/**
 * Llama a una Edge Function y devuelve `data`, o lanza un Error con
 * `code` (el campo `error` que devuelve la función) y `status`.
 */
export async function invokeFunction(name, body) {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (!error) return data;
  let payload = null;
  try {
    payload = await error.context?.json?.();
  } catch {
    /* sin cuerpo JSON */
  }
  const err = new Error(payload?.error || error.message || 'request_failed');
  err.code = payload?.error || 'request_failed';
  err.status = error.context?.status;
  err.payload = payload;
  throw err;
}

/**
 * Cancela una reserva:
 * - pendiente → RPC `cancel_booking` (sin cobro)
 * - pagada → Edge Function `cancel-booking` (reembolso con Stripe)
 * @param {{ id: number, payment_status: string, currency?: string }} reserva
 * @returns {Promise<'cancelled'|'refunded'>}
 */
export async function cancelReserva(reserva) {
  const id = parentIdOf(reserva);
  if (reserva.payment_status === 'pending') {
    const { error } = await supabase.rpc('cancel_booking', { p_id: id });
    if (!error) return 'cancelled';
    if (!String(error.message).includes('requires_refund')) {
      const err = new Error(error.message);
      err.code = error.code;
      throw err;
    }
  }
  const data = await invokeFunction('cancel-booking', { reservaId: id });
  return data?.status === 'refunded' ? 'refunded' : 'cancelled';
}

/** Mensaje traducido para los errores de cancelación. */
export function cancelErrorMessage(err, t) {
  if (err?.code === 'too_late') return t('history.errors.tooLate', { hours: err.payload?.hours ?? 24 });
  if (err?.code === 'past') return t('history.errors.past');
  if (err?.code === 'rate_limited') return t('history.errors.rateLimited');
  if (err?.code === 'not_found') return t('history.errors.notFound');
  return t('history.errorCancel');
}
