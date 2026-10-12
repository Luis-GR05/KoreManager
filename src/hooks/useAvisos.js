import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/useAuth';

/*
 * Avisos activos + estado "leído" por usuario.
 * Lo leído se guarda en el navegador (por usuario), así no hace falta
 * otra tabla. La campana del topbar y el Dashboard comparten el mismo
 * almacén, por eso al leer los avisos el contador se pone a 0 al momento.
 */

const listeners = new Set();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l) => {
  listeners.add(l);
  const onStorage = (e) => { if (e.key?.startsWith('kore_avisos_leidos:')) l(); };
  window.addEventListener('storage', onStorage);
  return () => { listeners.delete(l); window.removeEventListener('storage', onStorage); };
};

const keyFor = (uid) => `kore_avisos_leidos:${uid}`;
const readRaw = (uid) => {
  try { return localStorage.getItem(keyFor(uid)) || '[]'; } catch { return '[]'; }
};
const parse = (raw) => {
  try { const v = JSON.parse(raw); return Array.isArray(v) ? v.map(String) : []; } catch { return []; }
};

/** Cada cuánto se vuelve a consultar si hay avisos nuevos. */
const REFRESH_MS = 2 * 60 * 1000;

export function useAvisos() {
  const { user } = useAuth();
  const uid = user?.id ?? 'anon';
  const [avisos, setAvisos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Guardamos el string crudo: useSyncExternalStore necesita un snapshot estable
  const raw = useSyncExternalStore(subscribe, () => readRaw(uid), () => '[]');
  const seen = new Set(parse(raw));

  const load = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from('avisos')
      .select('id, titulo, mensaje, created_at')
      .eq('activo', true)
      .order('created_at', { ascending: false });
    setAvisos(data ?? []);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza con el servidor
    load();
    const id = setInterval(load, REFRESH_MS);
    const onFocus = () => { if (document.visibilityState === 'visible') load(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [load]);

  const unread = avisos.filter((a) => !seen.has(String(a.id)));

  const markAllRead = useCallback(() => {
    if (!avisos.length) return;
    const current = new Set(parse(readRaw(uid)));
    let changed = false;
    avisos.forEach((a) => { if (!current.has(String(a.id))) { current.add(String(a.id)); changed = true; } });
    if (!changed) return;
    // Solo guardamos ids de avisos que siguen activos (el almacén no crece sin límite)
    const active = new Set(avisos.map((a) => String(a.id)));
    try { localStorage.setItem(keyFor(uid), JSON.stringify([...current].filter((id) => active.has(id)))); } catch { /* sin almacenamiento */ }
    emit();
  }, [avisos, uid]);

  return { avisos, unread, unreadCount: unread.length, isUnread: (id) => !seen.has(String(id)), markAllRead, loading };
}
