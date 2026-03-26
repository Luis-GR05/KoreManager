// src/hooks/useProfile.js
import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export function useProfile() {
  const { profile, roleName, loading, refreshProfile } = useAuth();
  const [updating, setUpdating] = useState(false);

  const updateProfile = async (newFullName, newPhone) => {
    if (!profile) return;
    setUpdating(true);

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: newFullName, telefono: newPhone })
      .eq('id', profile.id);

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