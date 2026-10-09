/**
 * Niveles del jugador según las horas de pista jugadas (reservas pagadas
 * ya disputadas). Los logros usan los mismos umbrales, así que cada logro
 * desbloquea el emblema del nivel correspondiente.
 */
export const LEVELS = [
  { key: 'new', tier: 0, threshold: 0, color: 'text-zinc-400 dark:text-zinc-500', bg: 'bg-zinc-500/10', border: 'border-zinc-500/25' },
  { key: 'rookie', tier: 1, threshold: 1, color: 'text-brand-purple dark:text-brand-lime', bg: 'bg-brand-purple/10 dark:bg-brand-lime/10', border: 'border-brand-purple/30 dark:border-brand-lime/30' },
  { key: 'fit', tier: 2, threshold: 5, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/30' },
  { key: 'regular', tier: 3, threshold: 10, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  { key: 'veteran', tier: 4, threshold: 25, color: 'text-amber-600 dark:text-amber-300', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  { key: 'legend', tier: 5, threshold: 50, color: 'text-brand-purple dark:text-brand-lime', bg: 'bg-gradient-to-br from-brand-purple/15 to-brand-lime/15', border: 'border-brand-purple/40 dark:border-brand-lime/40' },
];

/**
 * @param {number} total partidos jugados
 * @returns {typeof LEVELS[number] & { next: number|null, progress: number }}
 */
export function getLevel(total) {
  const n = Number(total) || 0;
  let idx = 0;
  LEVELS.forEach((l, i) => { if (n >= l.threshold) idx = i; });
  const level = LEVELS[idx];
  const next = LEVELS[idx + 1]?.threshold ?? null;
  const progress = next == null ? 100 : Math.min(100, Math.round(((n - level.threshold) / (next - level.threshold)) * 100));
  return { ...level, next, progress };
}
