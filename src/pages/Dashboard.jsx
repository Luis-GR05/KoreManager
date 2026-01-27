// src/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, AlertTriangle, MapPin, Activity } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [instalaciones, setInstalaciones] = useState([]);
  const [avisos, setAvisos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // 1. Obtener Usuario
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/login'); return; }
      setUser(session.user);

      // 2. Obtener Instalaciones (Ordenadas por ID)
      const { data: dataInstalaciones, error: errorInst } = await supabase
        .from('instalaciones')
        .select('*')
        .order('id');
      
      if (errorInst) console.error('Error cargando instalaciones:', errorInst);
      else setInstalaciones(dataInstalaciones);

      // 3. Obtener Avisos Activos
      const { data: dataAvisos, error: errorAvisos } = await supabase
        .from('avisos')
        .select('*')
        .eq('activo', true)
        .order('fecha_publicacion', { ascending: false });

      if (errorAvisos) console.error('Error cargando avisos:', errorAvisos);
      else setAvisos(dataAvisos);

      setLoading(false);
    };

    fetchData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-brand-lime animate-pulse">
        Cargando datos del club...
      </div>
    );
  }

  // Formatear nombre usuario
  const userName = user?.user_metadata?.nombre || user?.email?.split('@')[0] || 'Deportista';
  const formattedName = userName.charAt(0).toUpperCase() + userName.slice(1);

  // Función auxiliar para obtener colores según estado
  const getStatusColor = (estado) => {
    switch (estado) {
      case 'disponible': return 'text-brand-lime';
      case 'ocupado': return 'text-brand-red';
      case 'mantenimiento': return 'text-orange-500';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in zoom-in duration-500 pb-10">
      
      {/* 1. HEADER */}
      <div>
        <h1 className="text-4xl font-bold text-white tracking-tight">
          Hola, <span className="text-brand-lime">{formattedName}</span>
        </h1>
        <p className="text-gray-400 mt-2 text-lg">¿Qué deporte quieres practicar hoy en Montijo?</p>
      </div>

      {/* 2. PRÓXIMA SESIÓN (Estática por ahora - Placeholder) */}
      <section>
        <h3 className="text-brand-lime text-xs font-bold uppercase tracking-wider mb-4">TU PRÓXIMA SESIÓN</h3>
        <div className="relative overflow-hidden bg-gradient-to-r from-[#24243E] to-[#1E1E2E] border border-white/10 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl group">
           <div className="absolute inset-0 bg-brand-purple/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
           <div className="flex items-center gap-6 z-10">
             <div className="w-20 h-20 rounded-2xl bg-brand-purple flex items-center justify-center text-white font-bold text-3xl shadow-[0_0_25px_rgba(123,44,191,0.5)]">
               P
             </div>
             <div>
               <h2 className="text-2xl font-bold text-white mb-2">Pista Pádel 01 - Pabellón A</h2>
               <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
                 <span className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full"><Calendar size={16} className="text-brand-lime"/> 15 Oct 2025</span>
               </div>
             </div>
           </div>
           <button className="z-10 px-8 py-3 border border-brand-lime text-brand-lime rounded-full text-sm font-bold tracking-wide hover:bg-brand-lime hover:text-black transition-all">
             VER QR
           </button>
        </div>
      </section>

      {/* 3. RESERVAR INSTALACIÓN (Dinámico desde Supabase) */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-6">Reservar Instalación</h2>
        
        {instalaciones.length === 0 ? (
          <p className="text-gray-500">No hay instalaciones disponibles.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {instalaciones.map((item) => (
              <div 
                key={item.id}
                className={`bg-[#1A1A2E] rounded-2xl p-5 border border-white/5 transition-all cursor-pointer group hover:-translate-y-1 hover:shadow-xl ${
                  item.estado !== 'disponible' ? 'opacity-75 grayscale-[0.5]' : 'hover:border-brand-lime/50'
                }`}
              >
                {/* Imagen / Placeholder visual */}
                <div className="h-40 bg-[#252535] rounded-xl mb-4 flex items-center justify-center relative overflow-hidden group-hover:bg-[#2A2A40] transition-colors">
                   <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                   <Activity className="text-gray-600 group-hover:text-brand-lime transition-colors z-10" size={40} />
                </div>

                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-lg text-white group-hover:text-brand-lime transition-colors">
                      {item.nombre}
                    </h4>
                    <p className={`text-xs mt-2 font-bold flex items-center gap-2 uppercase tracking-wide ${getStatusColor(item.estado)}`}>
                      <span className={`w-2 h-2 rounded-full ${item.estado === 'disponible' ? 'bg-brand-lime animate-pulse' : 'bg-current'}`}></span>
                      {item.estado}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. AVISOS MUNICIPALES (Dinámico desde Supabase) */}
      <section className="space-y-4">
        {avisos.map((aviso) => (
          <div key={aviso.id} className="border border-dashed border-brand-purple/40 bg-brand-purple/5 rounded-xl p-5 flex items-start gap-4 hover:bg-brand-purple/10 transition-colors">
            <div className="bg-brand-purple/20 p-2 rounded-lg shrink-0">
                <AlertTriangle className="text-brand-purple" size={24} />
            </div>
            <div>
              <span className="text-brand-purple font-bold text-sm block mb-1 uppercase">{aviso.titulo}</span>
              <span className="text-gray-300 text-sm leading-relaxed">
                {aviso.contenido}
              </span>
            </div>
          </div>
        ))}
      </section>

    </div>
  );
}