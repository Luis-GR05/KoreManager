import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { User, Mail, Phone, Trophy, AlertCircle, Save } from 'lucide-react';

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [profile, setProfile] = useState(null);

  // Cargar perfil real desde Supabase
  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Hacemos la consulta a la tabla NUEVA 'profiles'
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (data) setProfile(data);
      }
      setLoading(false);
    };

    getProfile();
  }, []);

  // Función para guardar cambios (Teléfono o Nombre)
  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profile.full_name,
        telefono: profile.telefono
      })
      .eq('id', profile.id);

    if (error) alert('Error actualizando: ' + error.message);
    else alert('¡Perfil actualizado correctamente!');

    setUpdating(false);
  };

  if (loading) return <div className="p-8 text-brand-lime animate-pulse">Cargando ficha de jugador...</div>;

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
      <h1 className="text-3xl font-bold text-white mb-2">Mi Perfil</h1>
      <p className="text-gray-400 mb-8">Gestiona tus datos personales y estadísticas.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* COLUMNA IZQUIERDA: Tarjeta de Identidad */}
        <div className="md:col-span-1">
          <div className="bg-[#1F1F2E] p-6 rounded-3xl border border-white/5 text-center relative overflow-hidden">
            <div className="w-24 h-24 bg-gradient-to-br from-brand-lime to-green-600 rounded-full mx-auto flex items-center justify-center text-3xl font-bold text-black mb-4 shadow-[0_0_20px_rgba(204,255,0,0.3)]">
              {profile?.email?.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-xl font-bold text-white">{profile?.full_name || "Usuario Sin Nombre"}</h2>
            <span className="inline-block mt-2 px-3 py-1 bg-brand-lime/20 text-brand-lime text-xs font-bold rounded-full uppercase tracking-wider">
              {profile?.rol || "DEPORTISTA"}
            </span>
          </div>
        </div>

        {/* COLUMNA DERECHA: Formulario Editable */}
        <div className="md:col-span-2">
          <form onSubmit={handleUpdate} className="bg-[#1A1A2E] p-8 rounded-3xl border border-white/5 space-y-6">

            {/* Email (Solo lectura) */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-2 block">Correo Electrónico</label>
              <div className="flex items-center gap-3 bg-[#0F0F1A] p-4 rounded-xl border border-white/5 opacity-70">
                <Mail className="text-gray-400" size={20} />
                <span className="text-gray-300">{profile?.email}</span>
              </div>
            </div>

            {/* Nombre Completo */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-2 block">Nombre Completo</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-lime" size={20} />
                <input
                  type="text"
                  value={profile?.full_name || ''}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  className="w-full bg-[#0F0F1A] border border-white/10 rounded-xl p-4 pl-12 text-white focus:border-brand-lime focus:outline-none transition-all"
                  placeholder="Tu nombre real"
                />
              </div>
            </div>

            {/* Teléfono */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-2 block">Teléfono</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-lime" size={20} />
                <input
                  type="tel"
                  value={profile?.telefono || ''}
                  onChange={(e) => setProfile({ ...profile, telefono: e.target.value })}
                  className="w-full bg-[#0F0F1A] border border-white/10 rounded-xl p-4 pl-12 text-white focus:border-brand-lime focus:outline-none transition-all"
                  placeholder="+34 600 000 000"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={updating}
              className="w-full py-4 bg-brand-lime text-black font-bold rounded-xl hover:shadow-[0_0_20px_rgba(204,255,0,0.4)] transition-all flex items-center justify-center gap-2"
            >
              {updating ? 'Guardando...' : <><Save size={20} /> Guardar Cambios</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}