// src/hooks/useProfile.js
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';

export function useProfile() {
  const [profile, setProfile] = useState(null);
  const [roleName, setRoleName] = useState('...');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select(`*, roles ( nombre )`)
          .eq('id', user.id)
          .single();

        if (data) {
          setProfile(data);
          setRoleName(data.roles?.nombre?.toUpperCase() || 'CIUDADANO');
        } else if (error) {
          console.error("Error cargando perfil:", error);
          toast.error("Error de conexión con la base de datos.");
        }
      }
      setLoading(false);
    };

    fetchProfile();
  }, []);

  const updateProfile = async (newFullName, newPhone) => {
    setUpdating(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: newFullName,
        telefono: newPhone
      })
      .eq('id', profile.id);

    if (error) {
      toast.error('Error actualizando: ' + error.message);
    } else {
      toast.success('¡Perfil actualizado correctamente!');
      // Actualizamos el estado local para que la UI reaccione al instante
      setProfile({ ...profile, full_name: newFullName, telefono: newPhone });
    }
    
    setUpdating(false);
  };

  return { profile, roleName, loading, updating, updateProfile };
}