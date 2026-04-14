import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { Loader2 } from 'lucide-react';

/**
 * Guarda de ruta:
 * - mientras `authLoading` es true, muestra spinner y NO redirige
 * - si no hay usuario autenticado, redirige a /login guardando `from`
 * - si la ruta exige roles, espera a resolver perfil/rol y valida permiso
 *
 * @param {{children: import('react').ReactNode, allowedRoles?: string[]}} props
 * @returns {import('react').JSX.Element}
 */
export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, roleName, authLoading, profileLoading } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0F0F1A] flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-lime" size={48} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && profileLoading) {
    return (
      <div className="min-h-screen bg-[#0F0F1A] flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-lime" size={48} />
      </div>
    );
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(roleName)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
