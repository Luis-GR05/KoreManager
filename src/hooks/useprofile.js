// src/hooks/useProfile.js
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

    // 1) Intentar guardar en tabla profiles (si el esquema tiene esas columnas).
    let error = null;
    const attempt1 = await supabase.from('profiles').update(extendedUpdate).eq('id', profile.id);
    if (attempt1.error) {
      // Si el esquema no tiene columnas extra, reintentamos con lo básico.
      const attempt2 = await supabase.from('profiles').update(baseUpdate).eq('id', profile.id);
      error = attempt2.error || attempt1.error;
    }

    // 2) Guardar también en metadata del usuario (siempre disponible).
    // Esto permite persistir más datos sin romper si falta migración en profiles.
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
      await refreshProfile(); // Sincroniza el contexto global
    }

    setUpdating(false);
  };

  return { profile, roleName, loading, updating, updateProfile };
}