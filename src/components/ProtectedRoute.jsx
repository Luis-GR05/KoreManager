// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * Guarda de ruta que:
 * - Si no hay sesión → redirige a /login
 * - Si allowedRoles no incluye el rol del usuario → redirige a /dashboard
 * - Mientras carga → muestra spinner
 * 
 * @param {string[]} allowedRoles - roles que pueden acceder (ej: ['admin', 'conserje'])
 */
export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, roleName, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F1A] flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-lime" size={48} />
      </div>
    );
  }

  // No autenticado → login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Rol insuficiente → dashboard
  if (allowedRoles.length > 0 && !allowedRoles.includes(roleName)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
