import { createContext, useContext } from 'react';

/**
 * Contexto de autenticación (inyectado por `AuthProvider`).
 * @type {import('react').Context<any>}
 */
export const AuthContext = createContext(null);

/**
 * Hook para consumir `AuthContext`.
 * @returns {any}
 * @throws {Error} Si se usa fuera de `<AuthProvider>`.
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}

