// src/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Clock, AlertTriangle, MapPin, PlusCircle, Trash2 } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [instalaciones, setInstalaciones] = useState([]);
  const [misReservas, setMisReservas] = useState([]); // <--- Nuevo estado
  const [avisos, setAvisos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // 1. Obtener Usuario
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/login'); return; }
      setUser(session.user);

      // 2. Obtener Instalaciones
      const { data: dataInst } = await supabase.from('instalaciones').select('*').order('id');
      if (dataInst) setInstalaciones(dataInst);

      // 3. Obtener Mis Reservas
      const { data: dataReservas } = await supabase
        .from('reservas')
        .select(`
          id, 
          fecha, 
          hora, 
          instalaciones ( nombre )
        `)
        .eq('user_id', session.user.id)
        .gte('fecha', new Date().toISOString().split('T')[0]) // Solo futuras
        .order('fecha', { ascending: true });

      if (dataReservas) setMisReservas(dataReservas);

      // 4. Obtener Avisos
      const { data: dataAvisos } = await supabase.from('avisos').select('*').eq('activo', true);
      if (dataAvisos) setAvisos(dataAvisos);

      setLoading(false);
    };

    fetchData();
  }, [navigate]);

  // Función para cancelar reserva
  const cancelarReserva = async (id) => {
    if (!confirm("¿Seguro que quieres cancelar este partido?")) return;
    const { error } = await supabase.from('reservas').delete().eq('id', id);

    if (!error) {
      setMisReservas(misReservas.filter(r => r.id !== id)); // Actualizar UI
    }
  };

  if (loading) return <div className="p-8 text-brand-lime animate-pulse">Cargando KORE MANAGER...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">

      {/* HEADER DASHBOARD */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Hola, <span className="text-brand-lime">{user?.email?.split('@')[0]}</span></h1>
          <p className="text-gray-400 text-sm mt-1">Bienvenido a tu panel de control.</p>
        </div>
        <Link
          to="/reservar"
          className="px-6 py-3 bg-brand-lime text-black rounded-full font-bold hover:scale-105 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(204,255,0,0.3)]"
        >
          <PlusCircle size={20} />
          Nueva Reserva
        </Link>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* COLUMNA IZQUIERDA (2/3): Reservas e Instalaciones */}
        <div className="lg:col-span-2 space-y-8">

          {/* SECCIÓN 1: MIS PRÓXIMOS PARTIDOS */}
          <section>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Calendar className="text-brand-purple" /> Mis Próximos Partidos
            </h3>

            {misReservas.length === 0 ? (
              <div className="bg-[#1A1A2E] p-8 rounded-3xl border border-white/5 text-center">
                <p className="text-gray-500 mb-4">No tienes partidos programados.</p>
                <Link to="/reservar" className="text-brand-lime underline hover:text-white">¡Reserva uno ahora!</Link>
              </div>
            ) : (
              <div className="grid gap-4">
                {misReservas.map(reserva => (
                  <div key={reserva.id} className="bg-[#1F1F2E] p-4 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-brand-lime/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-brand-lime/10 rounded-xl flex items-center justify-center text-brand-lime font-bold text-lg">
                        {reserva.hora.split(':')[0]}h
                      </div>
                      <div>
                        <h4 className="font-bold text-white">{reserva.instalaciones?.nombre || "Pista Deportiva"}</h4>
                        <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                          <span className="flex items-center gap-1"><Calendar size={12} /> {reserva.fecha}</span>
                          <span className="flex items-center gap-1"><Clock size={12} /> {reserva.hora}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => cancelarReserva(reserva.id)}
                      className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Cancelar Reserva"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* SECCIÓN 2: ESTADO INSTALACIONES */}
          <section>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <MapPin className="text-brand-lime" /> Estado de Pistas
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {instalaciones.map((item) => (
                <div key={item.id} className="bg-[#1A1A2E] p-4 rounded-2xl border border-white/5 flex items-center gap-4">
                  <div className={`w-3 h-full rounded-full ${item.estado === 'disponible' ? 'bg-brand-lime' : 'bg-red-500'}`}></div>
                  <div>
                    <h4 className="font-bold text-white">{item.nombre}</h4>
                    <p className="text-xs text-gray-500 uppercase font-bold mt-1">{item.estado}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* COLUMNA DERECHA (1/3): Avisos */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <AlertTriangle className="text-brand-red" /> Avisos
          </h3>
          {avisos.length === 0 ? (
            <p className="text-gray-500 text-sm">No hay avisos activos.</p>
          ) : (
            avisos.map((aviso) => (
              <div key={aviso.id} className="bg-brand-purple/5 border border-brand-purple/20 p-5 rounded-2xl">
                <h5 className="font-bold text-brand-purple mb-1">{aviso.titulo}</h5>
                <p className="text-xs text-gray-400 leading-relaxed">{aviso.mensaje}</p>
              </div>
            ))
          )}

          {/* Widget Promocional (Relleno visual) */}
          <div className="bg-gradient-to-br from-brand-lime/20 to-transparent p-6 rounded-3xl border border-brand-lime/20 text-center mt-8">
            <h4 className="font-bold text-brand-lime text-lg mb-2">¡Sube de Nivel!</h4>
            <p className="text-xs text-gray-300 mb-4">Completa 5 partidos este mes para entrar en el ranking municipal.</p>
            <div className="w-full bg-black/30 h-2 rounded-full overflow-hidden">
              <div className="bg-brand-lime w-1/5 h-full"></div>
            </div>
            <p className="text-[10px] text-gray-500 mt-2 text-right">1/5 Completados</p>
          </div>
        </div>

      </div>
    </div>
  );
}