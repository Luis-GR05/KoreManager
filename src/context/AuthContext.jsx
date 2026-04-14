// src/context/AuthContext.jsx
// ─────────────────────────────────────────────────────────────
// Solo exporta componentes React y un hook.
// Funciones puras → src/lib/authHelpers.js  (regla Vite Fast Refresh)
// ─────────────────────────────────────────────────────────────
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';
import { fetchProfile, loadProfileCache, clearProfileCache } from '../lib/authHelpers';
import { AuthContext } from './useAuth';

// ── Timeout helper ────────────────────────────────────────────
function withTimeout(promise, ms, fallback) {
  const timer = new Promise(resolve => setTimeout(() => resolve(fallback), ms));
  return Promise.race([promise, timer]);
}

// ─────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const mountedRef = useRef(false);
  const profileReqIdRef = useRef(0);
  const sessionReqIdRef = useRef(0);

  // Nota: el cache se invalida en `loadProfileCache()` por antigüedad (24h).
  const cached = useMemo(() => loadProfileCache(), []);

  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);

  // Perfil/rol: pueden hidratarse desde caché para evitar parpadeos tras F5.
  const [profile, setProfile] = useState(cached?.profile ?? null);
  const [roleName, setRoleName] = useState(cached?.roleName ?? 'ciudadano');

  // Cargas separadas: auth (sesión) y perfil (rol).
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const clearLocalAuthState = useCallback(() => {
    clearProfileCache();
    setSession(null);
    setUser(null);
    setProfile(null);
    setRoleName('ciudadano');
  }, []);

  const loadProfileForUser = useCallback(async (userId, { preferCache } = { preferCache: true }) => {
    if (!userId) return;

    // Si hay caché válido para este user, lo usamos para pintar rápido (y refrescamos en background).
    if (preferCache) {
      const cacheNow = loadProfileCache();
      if (cacheNow?.profile?.id === userId) {
        setProfile(cacheNow.profile);
        setRoleName(cacheNow.roleName ?? 'ciudadano');
        // refresco silencioso (sin bloquear) con control de concurrencia
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

    // Carga real de perfil (bloquea solo rutas con roles, no toda la app).
    const reqId = ++profileReqIdRef.current;
    setProfileLoading(true);
    try {
      const res = await withTimeout(
        fetchProfile(userId),
        10000,
        null
      );
      // Si hay timeout/fallo silencioso, NO degradamos el estado a "anónimo".
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
