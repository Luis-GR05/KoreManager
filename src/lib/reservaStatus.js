/**
 * Calcula el estado temporal de una reserva según fecha/hora de inicio y duración.
 *
 * @param {string} fecha Fecha en formato `YYYY-MM-DD`.
 * @param {string} hora Hora en formato `HH:MM` o `HH:MM:SS`.
 * @param {number} [durationMinutes=60] Duración de la reserva en minutos.
 * @param {Date} [now=new Date()] Momento de referencia para el cálculo (útil en tests).
 * @returns {'upcoming'|'in_progress'|'completed'|'unknown'}
 */
export function getReservaStatus(fecha, hora, durationMinutes = 60, now = new Date()) {
  const start = new Date(`${fecha}T${String(hora).slice(0, 8)}`);
  if (Number.isNaN(start.getTime())) return 'unknown';

  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  if (now < start) return 'upcoming';
  if (now >= start && now < end) return 'in_progress';
  return 'completed';
}

