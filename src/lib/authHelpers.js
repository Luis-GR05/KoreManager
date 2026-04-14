import { supabase } from '../supabaseClient';

const PROFILE_CACHE_KEY = 'kore_profile_v1';

/**
 * Carga el perfil del usuario desde Supabase y persiste una caché local.
 *
 * @param {string} userId
 * @returns {Promise<{profile: any, roleName: string}>}
 */
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

    saveProfileCache(data, roleName);

    return { profile: data, roleName };
  } catch (err) {
    console.error('[Auth] Error cargando perfil:', err);
    return { profile: null, roleName: 'ciudadano' };
  }
}

/**
 * Guarda en `localStorage` el perfil y rol para mejorar la UX en recargas.
 *
 * @param {any} profile
 * @param {string} roleName
 * @returns {void}
 */
export function saveProfileCache(profile, roleName) {
  try {
    localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify({ profile, roleName, ts: Date.now() }));
  } catch { /* storage lleno o incógnito: ignorar */ }
}

/**
 * Lee la caché de perfil (si no ha expirado).
 * @returns {{profile: any, roleName: string, ts: number} | null}
 */
export function loadProfileCache() {
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
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

/**
 * Borra la caché local de perfil.
 * @returns {void}
 */
export function clearProfileCache() {
  try {
    localStorage.removeItem(PROFILE_CACHE_KEY);
  } catch { /* nada */ }
}
