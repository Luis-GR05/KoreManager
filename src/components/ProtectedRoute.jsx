import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/useAuth';
import BrandLoader from './feedback/BrandLoader';
import Forbidden from '../pages/errors/Forbidden';

/**
 * Protección de rutas:
 * 1. Sin sesión → login (recordando a dónde iba).
 * 2. Con roles requeridos → espera a que el rol se confirme con el servidor
 *    (la caché local podría estar desactualizada, p. ej. si un admin acaba de
 *    ser ascendido) y, si no tiene permiso, muestra la página 403.
 *
 * @param {{ children: import('react').ReactNode, allowedRoles?: string[] }} props
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { t } = useTranslation();
  const { user, roleName, authLoading, profileLoading, roleVerified } = useAuth();
  const location = useLocation();

  if (authLoading) return <BrandLoader label={t('loading.app')} />;

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  if (allowedRoles) {
    const allowed = allowedRoles.map((r) => r.toLowerCase());
    const current = String(roleName ?? '').toLowerCase();
    if (!allowed.includes(current)) {
      // Aún no sabemos el rol real: esperamos antes de negar el acceso
      if (profileLoading || !roleVerified) return <BrandLoader label={t('loading.checking')} />;
      return <Forbidden />;
    }
  }

  return children;
}
