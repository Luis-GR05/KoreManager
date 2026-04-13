// src/lib/authHelpers.js
// ─────────────────────────────────────────────────────────────
// IMPORTANTE: Este archivo NO exporta componentes React.
// Esta separación es obligatoria para que Vite Fast Refresh
// (HMR) funcione correctamente. Si mezclamos funciones puras
// y componentes en el mismo archivo, Vite invalida el módulo
// entero y la sesión se pierde en cada hot-reload.
// ─────────────────────────────────────────────────────────────

import { supabase } from '../supabaseClient';

const PROFILE_CACHE_KEY = 'kore_profile_v1';

// ── Fetch de perfil desde Supabase ────────────────────────────
export async function fetchProfile(userId) {
  if (!userId) return { profile: null, roleName: 'ciudadano' };

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, roles(nombre)')
      .eq('id', userId)
      .single();

    if (error || !data) {
      console.warn('[Auth] Perfil no encontrado:', error?.message);
      return { profile: null, roleName: 'ciudadano' };
    }

    const roleName = (data.roles?.nombre ?? 'ciudadano').toLowerCase().trim();

    // Persistimos en cache para el próximo F5
    saveProfileCache(data, roleName);

    return { profile: data, roleName };
  } catch (err) {
    console.error('[Auth] Error cargando perfil:', err);
    return { profile: null, roleName: 'ciudadano' };
  }
}

// ── Cache de perfil en localStorage ──────────────────────────
export function saveProfileCache(profile, roleName) {
  try {
    localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify({ profile, roleName, ts: Date.now() }));
  } catch { /* storage lleno o incógnito: ignorar */ }
}

export function loadProfileCache() {
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    // Invalidamos la cache tras 24h para que no quede obsoleta
    const MAX_AGE_MS = 24 * 60 * 60 * 1000;
    if (Date.now() - (data.ts ?? 0) > MAX_AGE_MS) {
      localStorage.removeItem(PROFILE_CACHE_KEY);
      return null;
    }
    return data; // { profile, roleName }
  } catch {
    return null;
  }
}

export function clearProfileCache() {
  try {
    localStorage.removeItem(PROFILE_CACHE_KEY);
  } catch { /* nada */ }
}
