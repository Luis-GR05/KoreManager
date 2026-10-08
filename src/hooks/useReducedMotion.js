import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(callback) {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const mql = window.matchMedia(QUERY);
  mql.addEventListener('change', callback);
  return () => mql.removeEventListener('change', callback);
}

function getSnapshot() {
  return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(QUERY).matches;
}

/**
 * Devuelve `true` si el usuario ha pedido reducir el movimiento en su sistema.
 * @returns {boolean}
 */
export default function useReducedMotion() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
