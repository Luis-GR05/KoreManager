import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/useAuth';
import { normalizeDni, normalizePhone, normalizeSpaces } from '../lib/validation';

/**
 * Perfil del usuario + guardado de datos personales.
 * - Usa UPDATE (la fila la crea el registro), nunca upsert: así no se puede
 *   pisar el email ni el rol desde el navegador.
 * - Los datos se normalizan igual que en el registro y la base de datos los
 *   vuelve a validar (trigger); si los rechaza, se muestra su mensaje.
 */
export function useProfile() {
  const { profile, refreshProfile, user, profileLoading } = useAuth();
  const { t } = useTranslation();
  const [updating, setUpdating] = useState(false);

  const updateProfile = async (formData) => {
    if (!user) return false;
    setUpdating(true);
    try {
      const updates = {
        full_name: normalizeSpaces(formData.full_name),
        telefono: normalizePhone(formData.telefono),
        dni: normalizeDni(formData.dni),
        fecha_nacimiento: formData.fecha_nacimiento || null,
        direccion: normalizeSpaces(formData.direccion),
        codigo_postal: String(formData.codigo_postal ?? '').trim(),
        municipio: normalizeSpaces(formData.municipio),
        provincia: formData.provincia,
      };

      const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
      if (error) {
        if (error.code === '23505') throw new Error(t('profile.dniTaken'));
        throw error;
      }

      // Copia en los metadatos de Auth (no crítica)
      await supabase.auth.updateUser({ data: { full_name: updates.full_name, telefono: updates.telefono } })
        .catch(() => {});

      toast.success(t('profile.saved'));
      await refreshProfile();
      return true;
    } catch (error) {
      toast.error(t('profile.saveError', { msg: error.message }));
      return false;
    } finally {
      setUpdating(false);
    }
  };

  return {
    profile,
    updating,
    updateProfile,
    loading: !profile && profileLoading,
  };
}
