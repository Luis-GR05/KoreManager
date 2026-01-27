// src/pages/Profile.jsx
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { User, Mail, Phone, Trophy, AlertCircle, Clock } from 'lucide-react';

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const getProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Obtenemos datos combinados (Auth + Tabla pública si existiera lógica extra)
        // Por ahora usamos la sesión directa que es rapidísima
        setProfile({
            email: session.user.email,
            id: session.user.id,
            lastLogin: new Date(session.user.last_sign_in_at).toLocaleDateString(),
            role: 'Deportista' // Esto vendría de la tabla roles en el futuro
        });
      }
      setLoading(false);
    };

    getProfile();
  }, []);

  if (loading) {
    return <div className="text-brand-lime animate-pulse p-8">Cargando ficha técnica...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <h1 className="text-3xl font-bold text-white mb-8 border-b border-white/10 pb-4">
        Mi Perfil Deportivo
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 h-fit">
        
        {/* COLUMNA IZQUIERDA: Tarjeta de Identidad */}
        <div className="bg-[#1A1A2E] p-6 rounded-3xl border border-white/5 shadow-2xl h-full">
          <div className="flex flex-col items-center text-center">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-brand-lime to-emerald-600 p-1 mb-4 shadow-[0_0_20px_rgba(204,255,0,0.3)]">
              <div className="w-full h-full rounded-full bg-[#151525] flex items-center justify-center overflow-hidden">
                <User size={64} className="text-gray-400" />
              </div>
            </div>
            
            <h2 className="text-xl font-bold text-white mb-1">
                {profile?.email?.split('@')[0]}
            </h2>
            <span className="px-3 py-1 rounded-full bg-brand-purple/20 text-brand-purple text-xs font-bold uppercase tracking-wider mb-6">
              {profile?.role}
            </span>

            <div className="w-full space-y-4 text-left">
              <div className="flex items-center gap-3 text-gray-400 text-sm p-3 bg-white/5 rounded-xl">
                <Mail size={18} className="text-brand-lime"/>
                <span className="truncate">{profile?.email}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400 text-sm p-3 bg-white/5 rounded-xl">
                <Clock size={18} className="text-brand-lime"/>
                <span>Acceso: {profile?.lastLogin}</span>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: Estadísticas y Datos (Placeholder Visual) */}
        <div className="md:col-span-2 space-y-6">

          {/* Formulario de Datos Personales (Solo lectura por ahora) */}
          <div className="bg-[#1A1A2E] p-8 rounded-3xl border border-white/5">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <span className="w-1 h-5 bg-brand-lime rounded-full"></span>
              Datos Personales
            </h3>
            
            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Nombre</label>
                  <input type="text" disabled value={profile?.email?.split('@')[0]} className="w-full bg-[#0F0F1A] border border-white/10 rounded-xl p-3 text-gray-400 focus:outline-none cursor-not-allowed" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Apellidos</label>
                  <input type="text" disabled placeholder="No registrado" className="w-full bg-[#0F0F1A] border border-white/10 rounded-xl p-3 text-gray-400 focus:outline-none cursor-not-allowed" />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Teléfono de Contacto</label>
                <div className="relative">
                    <Phone className="absolute left-3 top-3.5 text-gray-600" size={18} />
                    <input type="text" disabled placeholder="+34 600 000 000" className="w-full bg-[#0F0F1A] border border-white/10 rounded-xl p-3 pl-10 text-gray-400 focus:outline-none cursor-not-allowed" />
                </div>
              </div>
            </form>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#1F1F2E] p-5 rounded-2xl border border-white/5 hover:border-brand-lime/30 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <span className="text-gray-400 text-sm">Reservas Totales</span>
                <Trophy size={20} className="text-brand-lime" />
              </div>
              <div className="text-3xl font-bold text-white">0</div>
              <div className="text-xs text-gray-500 mt-1">Nivel Principiante</div>
            </div>

            <div className="bg-[#1F1F2E] p-5 rounded-2xl border border-white/5 hover:border-brand-red/30 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <span className="text-gray-400 text-sm">Cancelaciones</span>
                <AlertCircle size={20} className="text-brand-red" />
              </div>
              <div className="text-3xl font-bold text-white">0</div>
              <div className="text-xs text-gray-500 mt-1">¡Buen compromiso!</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}