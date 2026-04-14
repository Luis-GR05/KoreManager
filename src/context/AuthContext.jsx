import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';
import { fetchProfile, loadProfileCache, clearProfileCache } from '../lib/authHelpers';
import { AuthContext } from './useAuth';

/**
 * Ejecuta una promesa con timeout y devuelve un fallback si se supera el tiempo.
 *
 * @template T
 * @param {Promise<T>} promise
 * @param {number} ms
 * @param {T} fallback
 * @returns {Promise<T>}
 */
function withTimeout(promise, ms, fallback) {
  const timer = new Promise(resolve => setTimeout(() => resolve(fallback), ms));
  return Promise.race([promise, timer]);
}

/**
 * Provider de autenticación:
 * - hidrata sesión desde Supabase
 * - gestiona perfil y rol (con caché local)
 * - expone helpers: signIn/signOut/refreshProfile, etc.
 *
 * @param {{children: import('react').ReactNode}} props
 * @returns {import('react').JSX.Element}
 */
export function AuthProvider({ children }) {
  const mountedRef = useRef(false);
  const profileReqIdRef = useRef(0);
  const sessionReqIdRef = useRef(0);

  const cached = useMemo(() => loadProfileCache(), []);

  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);

  const [profile, setProfile] = useState(cached?.profile ?? null);
  const [roleName, setRoleName] = useState(cached?.roleName ?? 'ciudadano');

  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  /**
   * Limpia el estado local (incluyendo caché) sin llamadas a red.
   * @returns {void}
   */
  const clearLocalAuthState = useCallback(() => {
    clearProfileCache();
    setSession(null);
    setUser(null);
    setProfile(null);
    setRoleName('ciudadano');
  }, []);

  /**
   * Carga el perfil/rol asociado a un usuario. Puede pintar primero desde caché y refrescar en background.
   *
   * @param {string} userId
   * @param {{preferCache?: boolean}} [options]
   * @returns {Promise<void>}
   */
  const loadProfileForUser = useCallback(async (userId, { preferCache } = { preferCache: true }) => {
    if (!userId) return;

    if (preferCache) {
      const cacheNow = loadProfileCache();
      if (cacheNow?.profile?.id === userId) {
        setProfile(cacheNow.profile);
        setRoleName(cacheNow.roleName ?? 'ciudadano');
        const reqId = ++profileReqIdRef.current;
        withTimeout(fetchProfile(userId), 10000, null).then(res => {
          if (!res) return;
          if (!mountedRef.current) return;
          if (profileReqIdRef.current !== reqId) return;
          setProfile(res.profile);
          setRoleName(res.roleName);
        });
        return;
      }
    }

    const reqId = ++profileReqIdRef.current;
    setProfileLoading(true);
    try {
      const res = await withTimeout(
        fetchProfile(userId),
        10000,
        null
      );
      if (!res) return;
      if (!mountedRef.current) return;
      if (profileReqIdRef.current !== reqId) return;
      setProfile(res.profile);
      setRoleName(res.roleName);
    } catch (err) {
      console.error('[Auth] Error cargando perfil:', err);
    } finally {
      if (mountedRef.current && profileReqIdRef.current === reqId) {
        setProfileLoading(false);
      }
    }
  }, []);

  const resolveSession = useCallback(async (nextSession, { preferCacheForProfile } = { preferCacheForProfile: true }) => {
    const reqId = ++sessionReqIdRef.current;
    const nextUser = nextSession?.user ?? null;

    setSession(nextSession ?? null);
    setUser(nextUser);

    if (!nextUser) {
      clearLocalAuthState();
      setAuthLoading(false);
      setProfileLoading(false);
      return;
    }

    // Desbloqueamos la app en cuanto sabemos que hay sesión.
    // El perfil/rol se carga en background (y sólo bloquea rutas con allowedRoles).
    if (mountedRef.current && sessionReqIdRef.current === reqId) {
      setAuthLoading(false);
    }

    // Cargar rol/perfil sin bloquear el render inicial.
    // Nota: loadProfileForUser gestiona profileLoading internamente.
    void loadProfileForUser(nextUser.id, { preferCache: preferCacheForProfile });
  }, [clearLocalAuthState, loadProfileForUser]);

  useEffect(() => {
    mountedRef.current = true;

    setAuthLoading(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      if (!mountedRef.current) return;

      // Usamos INITIAL_SESSION como fuente principal (lee storage sin bloquearse por red).
      if (event === 'INITIAL_SESSION') {
        await resolveSession(nextSession, { preferCacheForProfile: true });
        return;
      }

      // SIGNED_IN / TOKEN_REFRESHED / USER_UPDATED
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        await resolveSession(nextSession, { preferCacheForProfile: false });
        return;
      }

      // SIGNED_OUT u otros: limpiar
      if (!nextSession?.user) {
        await resolveSession(null, { preferCacheForProfile: false });
      }
    });

    // Backup: si por algún motivo INITIAL_SESSION no llega, intentamos getSession con timeout,
    // pero NUNCA hacemos logout local por timeout.
    (async () => {
      const result = await withTimeout(supabase.auth.getSession(), 4000, null);
      if (!mountedRef.current) return;
      if (!result) {
        setAuthLoading(false);
        return;
      }
      if (result?.error) {
        console.error('[Auth] getSession() error:', result.error);
        setAuthLoading(false);
        return;
      }
      await resolveSession(result?.data?.session ?? null, { preferCacheForProfile: true });
    })();

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [resolveSession]);

  const signOut = useCallback(async () => {
    // UX: limpiar estado local inmediatamente evita pantallas "colgadas" al volver atrás.
    clearLocalAuthState();
    setAuthLoading(false);
    setProfileLoading(false);
    await supabase.auth.signOut();
  }, [clearLocalAuthState]);

  const refreshProfile = useCallback(async () => {
    const currentUser = user;
    if (!currentUser) return;
    await loadProfileForUser(currentUser.id, { preferCache: false });
  }, [loadProfileForUser, user]);

  // Compatibilidad: `loading` sigue existiendo para componentes antiguos.
  // Importante: NO bloqueamos toda la app por el perfil; solo el auth inicial.
  const loading = authLoading;

  const value = useMemo(() => ({
    session,
    user,
    profile,
    roleName,
    loading,
    authLoading,
    profileLoading,
    signOut,
    refreshProfile,
  }), [session, user, profile, roleName, loading, authLoading, profileLoading, signOut, refreshProfile]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
