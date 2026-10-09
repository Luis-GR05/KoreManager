import { supabase } from '../supabaseClient';

const PROFILE_CACHE_KEY = 'kore_profile_v1';

/**
 * Carga el perfil del usuario desde Supabase y persiste una caché local.
 *
 * @param {string} userId
 * @returns {Promise<{profile: any, roleName: string}>}
 */
export async function fetchProfile(userId) {
  if (!userId) return { profile: null, roleName: 'ciudadano', verified: false };

  try {
    // El rol se pide a la función SQL user_role() (SECURITY DEFINER): no
    // depende de que la tabla `roles` sea legible con RLS. El join queda
    // como respaldo para bases de datos sin la función.
    const [profileRes, roleRes] = await Promise.all([
      supabase.from('profiles').select('*, roles(nombre)').eq('id', userId).maybeSingle(),
      supabase.rpc('user_role'),
    ]);

    const data = profileRes.data;
    if (profileRes.error) console.warn('[Auth] Perfil:', profileRes.error.message);

    const fromRpc = typeof roleRes.data === 'string' ? roleRes.data : null;
    const fromJoin = data?.roles?.nombre ?? null;
    const roleName = String(fromRpc ?? fromJoin ?? 'ciudadano').toLowerCase().trim();

    if (data) saveProfileCache(data, roleName);
    return { profile: data ?? null, roleName, verified: !roleRes.error || !!data };
  } catch (err) {
    console.error('[Auth] Error cargando perfil:', err);
    return { profile: null, roleName: 'ciudadano', verified: false };
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
