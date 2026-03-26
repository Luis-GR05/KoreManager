// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(null);
  const [profile, setProfile]   = useState(null);
  const [roleName, setRoleName] = useState('ciudadano');
  const [loading, setLoading]   = useState(true);

  const loadProfile = async (authUser) => {
    if (!authUser) {
      setProfile(null);
      setRoleName('ciudadano');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`*, roles ( nombre )`)
        .eq('id', authUser.id)
        .single();

      if (data) {
        setProfile(data);
        const rawRole = data.roles?.nombre || 'ciudadano';
        setRoleName(rawRole.toLowerCase().trim());
      } else {
        // Tabla inexistente o perfil no creado todavía → seguir con defaults
        console.warn('Perfil no encontrado:', error?.message);
        setProfile(null);
        setRoleName('ciudadano');
      }
    } catch (err) {
      // Error inesperado: no bloquear la app
      console.error('Error inesperado cargando perfil:', err);
      setProfile(null);
      setRoleName('ciudadano');
    }
  };

  useEffect(() => {
    let mounted = true;

    // 1. Verificar sesión existente al arrancar
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      const authUser = session?.user ?? null;
      setUser(authUser);
      await loadProfile(authUser);
      setLoading(false);  // garantizado: siempre llega aquí
    }).catch((err) => {
      console.error('Error en getSession:', err);
      if (mounted) setLoading(false);
    });

    // 2. Escuchar cambios de sesión (login, logout, refresh de token)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
        const authUser = session?.user ?? null;
        setUser(authUser);
        await loadProfile(authUser);
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setRoleName('ciudadano');
  };

  const refreshProfile = async () => {
    if (user) await loadProfile(user);
  };

  return (
    <AuthContext.Provider value={{ user, profile, roleName, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
