import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const CACHE_KEY = 'kore_sports_summary_v1';
const TTL = 5 * 60 * 1000; // 5 minutos

let inflight = null;

function readCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { at, rows } = JSON.parse(raw);
    return Date.now() - at < TTL && Array.isArray(rows) ? rows : null;
  } catch {
    return null;
  }
}

/**
 * Resumen público de deportes y pistas (RPC `public_sports_summary`).
 * Devuelve `rows` = [{ tipo, pistas, disponibles }] tal y como estén en la BD,
 * de modo que si el administrador añade o quita pistas/deportes la landing
 * se actualiza sola. Se cachea 5 min por pestaña y se comparte la petición.
 *
 * @returns {{ rows: Array<{tipo:string,pistas:number,disponibles:number}>, total: number|null, loading: boolean, error: boolean }}
 */
export default function useSportsSummary() {
  const [state, setState] = useState(() => {
    const cached = readCache();
    return { rows: cached ?? [], loading: !cached, error: false };
  });

  useEffect(() => {
    if (!state.loading) return undefined;
    let alive = true;
    inflight = inflight ?? supabase.rpc('public_sports_summary').then(({ data, error }) => {
      inflight = null;
      if (error) throw error;
      try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), rows: data ?? [] })); } catch { /* ignorar */ }
      return data ?? [];
    });
    inflight
      .then((rows) => { if (alive) setState({ rows, loading: false, error: false }); })
      .catch(() => { if (alive) setState({ rows: [], loading: false, error: true }); });
    return () => { alive = false; };
  }, [state.loading]);

  const total = state.rows.length ? state.rows.reduce((n, r) => n + (Number(r.pistas) || 0), 0) : null;
  return { ...state, total };
}
