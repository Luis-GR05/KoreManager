import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, AlertTriangle } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Obtener usuario actual de Supabase Auth
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login');
        return;
      }

      setUser(session.user);
      setLoading(false);
    };

    getUser();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-brand-lime animate-pulse">
        Cargando tu perfil deportivo...
      </div>
    );
  }

  const userName = user?.email?.split('@')[0] || 'Deportista';
  const formattedName = userName.charAt(0).toUpperCase() + userName.slice(1);

  return (
    <div className="space-y-10 animate-in fade-in zoom-in duration-500">
      
      {/* 1. HEADER DINÁMICO */}
      <div>
        <h1 className="text-4xl font-bold text-white tracking-tight">
          Hola, <span className="text-brand-lime">{formattedName}</span>
        </h1>
        <p className="text-gray-400 mt-2 text-lg">¿Qué deporte quieres practicar hoy en Montijo?</p>
      </div>

      {/* 2. TU PRÓXIMA SESIÓN (Estática por ahora) */}
      <section>
        <h3 className="text-brand-lime text-xs font-bold uppercase tracking-wider mb-4">TU PRÓXIMA SESIÓN</h3>
        
        <div className="relative overflow-hidden bg-gradient-to-r from-[#24243E] to-[#1E1E2E] border border-white/10 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl group">
          <div className="absolute inset-0 bg-brand-purple/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="flex items-center gap-6 z-10">
            <div className="w-20 h-20 rounded-2xl bg-brand-purple flex items-center justify-center text-white font-bold text-3xl shadow-[0_0_25px_rgba(123,44,191,0.5)] transform group-hover:scale-110 transition-transform duration-300">
              P
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Pista Pádel 01 - Pabellón A</h2>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
                <span className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full"><Calendar size={16} className="text-brand-lime"/> 15 Oct 2025</span>
                <span className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full"><Clock size={16} className="text-brand-lime"/> 18:00 - 19:30</span>
              </div>
            </div>
          </div>
          <button className="z-10 px-8 py-3 border border-brand-lime text-brand-lime rounded-full text-sm font-bold tracking-wide hover:bg-brand-lime hover:text-black transition-all shadow-[0_0_10px_transparent] hover:shadow-[0_0_15px_#CCFF00]">
            VER CÓDIGO QR
          </button>
        </div>
      </section>

      {/* 3. RESERVAR INSTALACIÓN */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-6">Reservar Instalación</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tarjeta Fútbol */}
          <div className="bg-[#1A1A2E] rounded-2xl p-5 border border-white/5 hover:border-brand-lime/50 transition-all cursor-pointer group hover:-translate-y-1 hover:shadow-xl">
            <div className="h-40 bg-[#252535] rounded-xl mb-4 flex items-center justify-center relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
               <span className="text-gray-500 z-10 font-medium">Fútbol Base</span>
            </div>
            <h4 className="font-bold text-lg text-white group-hover:text-brand-lime transition-colors">Campo de Fútbol</h4>
            <p className="text-brand-lime text-xs mt-1 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-brand-lime animate-pulse"></span>
              4 Disponibles hoy
            </p>
          </div>

          {/* Tarjeta Basket */}
          <div className="bg-[#1A1A2E] rounded-2xl p-5 border border-white/5 opacity-75">
            <div className="h-40 bg-[#252535] rounded-xl mb-4 flex items-center justify-center">
               <span className="text-gray-500 font-medium">Basket Indoor</span>
            </div>
            <h4 className="font-bold text-lg text-white">Pabellón Basket</h4>
            <p className="text-brand-red text-xs mt-1 font-bold">Completo</p>
          </div>

          {/* Tarjeta Piscina */}
          <div className="bg-[#1A1A2E] rounded-2xl p-5 border border-white/5 hover:border-brand-lime/50 transition-all cursor-pointer group hover:-translate-y-1 hover:shadow-xl">
            <div className="h-40 bg-[#252535] rounded-xl mb-4 flex items-center justify-center relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
               <span className="text-gray-500 z-10 font-medium">Piscina Climatizada</span>
            </div>
            <h4 className="font-bold text-lg text-white group-hover:text-brand-lime transition-colors">Piscina Climatizada</h4>
            <p className="text-brand-lime text-xs mt-1 font-semibold flex items-center gap-1">
               <span className="w-2 h-2 rounded-full bg-brand-lime animate-pulse"></span>
               12 Calles libres
            </p>
          </div>
        </div>
      </section>

      {/* 4. AVISO MUNICIPAL */}
      <div className="border border-dashed border-brand-purple/40 bg-brand-purple/5 rounded-xl p-5 flex items-start gap-4">
        <div className="bg-brand-purple/20 p-2 rounded-lg">
            <AlertTriangle className="text-brand-purple" size={24} />
        </div>
        <div>
          <span className="text-brand-purple font-bold text-sm block mb-1">AVISO MUNICIPAL</span>
          <span className="text-gray-300 text-sm leading-relaxed">
            Mantenimiento en pistas de atletismo el día 20/10. Rogamos disculpen las molestias.
          </span>
        </div>
      </div>
    </div>
  );
}