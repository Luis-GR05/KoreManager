export function getReservaStatus(fecha, hora, durationMinutes = 60, now = new Date()) {
  // `fecha`: 'YYYY-MM-DD', `hora`: 'HH:MM:SS' o 'HH:MM'
  const start = new Date(`${fecha}T${String(hora).slice(0, 8)}`);
  if (Number.isNaN(start.getTime())) return 'unknown';

  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  if (now < start) return 'upcoming';
  if (now >= start && now < end) return 'in_progress';
  return 'completed';
}

