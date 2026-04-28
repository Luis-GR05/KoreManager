import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/useAuth';
import toast from 'react-hot-toast';

/**
 * Hook de perfil (wrapper sobre AuthContext) con helper de actualización.
 * @returns {{
 *  profile: any,
 *  roleName: string,
 *  loading: boolean,
 *  updating: boolean,
 *  updateProfile: (next: any) => Promise<void>
 * }}
 */
export function useProfile() {
  const { profile, refreshProfile, user } = useAuth();
  const [updating, setUpdating] = useState(false);

  const updateProfile = async (formData) => {
    if (!user) return;
    setUpdating(true);

    /**
   * Actualiza el perfil en tabla `profiles` y sincroniza metadatos en Supabase Auth.
   * Intenta primero campos extendidos; si el esquema no existe, cae a campos básicos.
   *
   * @param {{
   *  full_name: string,
   *  telefono: string,
   *  dni?: string,
   *  fecha_nacimiento?: string,
   *  direccion?: string,
   *  codigo_postal?: string,
   *  municipio?: string,
   *  provincia?: string
   * }} next
   * @returns {Promise<void>}
   */
    try {
      const profileUpdates = {
        id: user.id,
        full_name: formData.full_name,
        telefono: formData.telefono,
        dni: formData.dni || null,
        fecha_nacimiento: formData.fecha_nacimiento || null,
        direccion: formData.direccion || null,
        codigo_postal: formData.codigo_postal || null,
        municipio: formData.municipio || null,
        provincia: formData.provincia || null,
        updated_at: new Date().toISOString(),
      };

      const [profileRes, authRes] = await Promise.all([
        supabase.from('profiles').upsert(profileUpdates),
        supabase.auth.updateUser({
          data: { 
            full_name: formData.full_name,
            telefono: formData.telefono 
          }
        })
      ]);

      if (profileRes.error) throw profileRes.error;
      if (authRes.error) throw authRes.error;

      toast.success('Perfil actualizado correctamente');
      await refreshProfile();
      
    } catch (error) {
      console.error('[useProfile] Error:', error.message);
      toast.error('Error al actualizar: ' + error.message);
    } finally {
      setUpdating(false);
    }
  };

  return { 
    profile, 
    updating, 
    updateProfile,
    loading: updating
  };
}