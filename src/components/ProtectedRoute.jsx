// src/components/ProtectedRoute.jsx
// ─────────────────────────────────────────────────────────────
// Guarda de ruta. Reglas:
//   • loading=true   → spinner (nunca redirige en falso)
//   • !user          → redirige a /login (guarda la ruta original)
//   • rol insuficiente → redirige a /dashboard
// ─────────────────────────────────────────────────────────────
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, roleName, authLoading, profileLoading } = useAuth();
  const location = useLocation();

  // 1) Hasta que sepamos si hay sesión o no, nunca redirigimos.
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0F0F1A] flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-lime" size={48} />
      </div>
    );
  }

  if (!user) {
    // Guardamos la ruta actual para redirigir de vuelta tras el login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2) Si la ruta exige roles, esperamos a tener el rol resuelto.
  // Esto evita expulsiones o estados raros al recargar / usar "atrás".
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
