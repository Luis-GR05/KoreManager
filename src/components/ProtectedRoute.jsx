import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

/**
 * Componente de Orden Superior (HOC) para la protección de rutas.
 * * Este componente centraliza la lógica de autorización del sistema:
 * 1. Verifica la existencia de una sesión activa (Autenticación).
 * 2. Valida si el rol del usuario está incluido en los permisos de la ruta (Autorización).
 * 3. Gestiona los estados de carga para evitar redirecciones falsas durante la hidratación.
 * * @param {Object} props - Propiedades del componente.
 * @param {React.ReactNode} props.children - Componentes a renderizar si la validación es exitosa.
 * @param {string[]} [props.allowedRoles] - Lista opcional de nombres de roles permitidos (ej. ['admin', 'conserje']).
 * @returns {React.JSX.Element} El componente autorizado o un componente de redirección.
 * * @author Senior Web Architect
 * @version 2.0.0
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, roleName, authLoading, profileLoading } = useAuth();
  const location = useLocation();

  /**
   * ESTADO DE CARGA CRÍTICO:
   * Mientras Supabase está recuperando la sesión (authLoading) o el perfil/rol (profileLoading),
   * no debemos tomar ninguna decisión de redirección.
   * * @coste_oportunidad Evita que un usuario logueado sea expulsado al /login por un retraso de red de 100ms.
   */
  if (authLoading || (allowedRoles && profileLoading)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0F0F1A]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#CCFF00] border-t-transparent"></div>
      </div>
    );
  }

  /**
   * VALIDACIÓN DE AUTENTICACIÓN:
   * Si tras la carga no hay usuario, redirigimos a login preservando la ubicación original
   * para mejorar la UX mediante un "deep link" post-login.
   */
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  /**
   * VALIDACIÓN DE AUTORIZACIÓN (RBAC - Role Based Access Control):
   * Si la ruta requiere roles específicos, verificamos que el rol del perfil coincida.
   * Se aplica normalización de strings para evitar errores por mayúsculas o espacios.
   * * @riesgo Un fallo aquí permitiría a un 'ciudadano' acceder al 'admin-panel' manipulando la URL.
   */
  if (allowedRoles && !allowedRoles.map(r => r.toLowerCase()).includes(roleName?.toLowerCase())) {
    console.error(`[Acl] Acceso denegado. Rol actual: ${roleName}. Requeridos: ${allowedRoles}`);
    return <Navigate to="/dashboard" replace />;
  }

  // Si todas las defensas pasan, se otorga acceso al recurso.
  return children;
};

export default ProtectedRoute;