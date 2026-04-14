import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/useAuth';
import toast from 'react-hot-toast';

export function useProfile() {
  const { profile, roleName, loading, refreshProfile, user } = useAuth();
  const [updating, setUpdating] = useState(false);

  const updateProfile = async (next) => {
    if (!profile) return;
    setUpdating(true);

    const baseUpdate = {
      full_name: next.full_name,
      telefono: next.telefono,
    };

    const extendedUpdate = {
      ...baseUpdate,
      dni: next.dni || null,
      fecha_nacimiento: next.fecha_nacimiento || null,
      direccion: next.direccion || null,
      codigo_postal: next.codigo_postal || null,
      municipio: next.municipio || null,
      provincia: next.provincia || null,
    };

    let error = null;
    const attempt1 = await supabase.from('profiles').update(extendedUpdate).eq('id', profile.id);
    if (attempt1.error) {
      const attempt2 = await supabase.from('profiles').update(baseUpdate).eq('id', profile.id);
      error = attempt2.error || attempt1.error;
    }

    if (user) {
      await supabase.auth.updateUser({
        data: {
          full_name: next.full_name,
          phone: next.telefono,
          dni: next.dni,
          fecha_nacimiento: next.fecha_nacimiento,
          direccion: next.direccion,
          codigo_postal: next.codigo_postal,
          municipio: next.municipio,
          provincia: next.provincia,
        },
      });
    }

    if (error) {
      toast.error('Error al guardar: ' + error.message);
    } else {
      toast.success('¡Perfil actualizado correctamente!');
      await refreshProfile();
    }

    setUpdating(false);
  };

  return { profile, roleName, loading, updating, updateProfile };
}
