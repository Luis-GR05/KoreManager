// src/context/AuthContext.jsx
// ─────────────────────────────────────────────────────────────
// REGLA Fast Refresh de Vite: este archivo SOLO exporta
// componentes React y un hook. Las funciones puras están en
// src/lib/authHelpers.js para evitar invalidaciones de HMR.
// ─────────────────────────────────────────────────────────────
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';
import { fetchProfile, loadProfileCache, clearProfileCache } from '../lib/authHelpers';

const AuthContext = createContext(null);

// ─────────────────────────────────────────────────────────────
// Hook de consumo — solo puede usarse dentro de AuthProvider
// ─────────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}

// ─────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  // Intentamos leer la caché de perfil para pre-poblar el estado
  // de forma síncrona antes del primer render.
  // NOTA: NO leemos la sesión de Supabase de localStorage manualmente
  // porque el formato interno puede cambiar entre versiones del SDK.
  // En su lugar dejamos que getSession() lo haga (tarda ~0ms ya que
  // también lee localStorage, pero de forma segura y versionada).
  const cached = loadProfileCache();

  const [user,     setUser]     = useState(null);
  const [profile,  setProfile]  = useState(cached?.profile  ?? null);
  const [roleName, setRoleName] = useState(cached?.roleName ?? 'ciudadano');
  // loading arranca en true; se pondrá a false en cuanto getSession resuelva
  const [loading,  setLoading]  = useState(true);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    // ── PASO 1: Leer sesión actual desde localStorage (vía SDK, ~0ms) ──
    // getSession() NO hace ninguna petición de red si el token es válido.
    // Solo va a red si el token ha expirado y necesita refresh.
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (!mountedRef.current) return;

      if (error) {
        console.error('[Auth] getSession error:', error.message);
        setLoading(false);
        return;
      }

      const authUser = session?.user ?? null;
      setUser(authUser);

      if (authUser) {
        // Si ya tenemos perfil en caché para este usuario, lo usamos
        // directamente y ponemos loading=false inmediatamente.
        // El refresco desde red ocurre en background (paso 2).
        if (cached?.profile?.id === authUser.id) {
          setLoading(false);
          // Actualizamos perfil en background para mantener datos frescos
          fetchProfile(authUser.id).then(({ profile: p, roleName: r }) => {
            if (mountedRef.current) {
              setProfile(p);
              setRoleName(r);
            }
          });
        } else {
          // Sin caché válida: ir a red y esperar
          const { profile: p, roleName: r } = await fetchProfile(authUser.id);
          if (mountedRef.current) {
            setProfile(p);
            setRoleName(r);
            setLoading(false);
          }
        }
      } else {
        // No hay sesión → limpiar y desbloquear
        clearProfileCache();
        setProfile(null);
        setRoleName('ciudadano');
        setLoading(false);
      }
    });

    // ── PASO 2: Listener para cambios en tiempo real ──────────────────
    // Gestiona: login, logout, token refresh, cambio de pestaña, etc.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mountedRef.current) return;

        // INITIAL_SESSION ya lo tratamos en getSession arriba; ignorarlo
        // aquí evita un fetch doble de perfil al arrancar.
        if (event === 'INITIAL_SESSION') return;

        const authUser = session?.user ?? null;
        setUser(authUser);

        if (authUser) {
          const { profile: p, roleName: r } = await fetchProfile(authUser.id);
          if (mountedRef.current) {
            setProfile(p);
            setRoleName(r);
            setLoading(false);
          }
        } else {
          clearProfileCache();
          if (mountedRef.current) {
            setProfile(null);
            setRoleName('ciudadano');
            setLoading(false);
          }
        }
      }
    );

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─────────────────────────────────────────────────────────────
  // Actions expuestas al árbol de componentes
  // ─────────────────────────────────────────────────────────────
  async function signOut() {
    clearProfileCache();
    await supabase.auth.signOut();
    // onAuthStateChange → SIGNED_OUT → resetea estado automáticamente
  }

  async function refreshProfile() {
    const currentUser = user;
    if (!currentUser) return;
    const { profile: p, roleName: r } = await fetchProfile(currentUser.id);
    if (mountedRef.current) {
      setProfile(p);
      setRoleName(r);
    }
  }

  return (
    <AuthContext.Provider value={{ user, profile, roleName, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
