import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/useAuth';
import { Link } from 'react-router-dom';
import { Calendar, Clock, AlertTriangle, MapPin, PlusCircle, Trash2, BarChart2, Star, Image as ImageIcon, ArrowUpRight } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Determina el nivel del jugador a partir de partidos completados.
 * @param {number} total
 * @returns {{nombre: string, emoji: string, color: string, next: (number|null), threshold: number}}
 */
function getNivel(total) {
  if (total >= 50) return { nombre: 'Leyenda',   emoji: '🏆', color: 'text-brand-lime',   next: null,  threshold: 50 };
  if (total >= 25) return { nombre: 'Veterano',   emoji: '⭐', color: 'text-yellow-400',   next: 50,   threshold: 25 };
  if (total >= 10) return { nombre: 'Habitual',   emoji: '🔥', color: 'text-orange-400',   next: 25,   threshold: 10 };
  if (total >= 5)  return { nombre: 'En Forma',   emoji: '💪', color: 'text-blue-400',     next: 10,   threshold: 5  };
  if (total >= 1)  return { nombre: 'Novato',     emoji: '🎾', color: 'text-gray-300',     next: 5,    threshold: 1  };
  return                  { nombre: 'Nuevo',      emoji: '👤', color: 'text-gray-500',     next: 1,    threshold: 0  };
}

/**
 * Dashboard del usuario:
 * - estado de instalaciones
 * - próximas reservas
 * - avisos
 * - métricas de actividad
 *
 * @returns {import('react').JSX.Element}
 */
export default function Dashboard() {
  const { user, profile } = useAuth();

  const [instalaciones, setInstalaciones] = useState([]);
  const [misReservas, setMisReservas]     = useState([]);
  const [avisos, setAvisos]               = useState([]);
  const [loading, setLoading]             = useState(true);
  const [partidosMes, setPartidosMes]     = useState(0);
  const [totalJugados, setTotalJugados]   = useState(0); // partidos completados (pasados)
  const [avatarDisplayUrl, setAvatarDisplayUrl] = useState(null);

  const META_PARTIDOS = 5;
  useEffect(() => {
    // Usamos user.id (disponible desde el primer render del contexto)
    // en lugar de profile.id (que requiere un fetch adicional a la BD).
    // Así el panel carga inmediatamente sin depender del perfil.
    if (!user?.id) return;
    const hoy = new Date().toISOString().split('T')[0];

    const fetchData = async () => {
      const userId = user.id;

      // Instalaciones
      const { data: dataInst } = await supabase
        .from('instalaciones')
        .select('*')
        .order('id');
      if (dataInst) setInstalaciones(dataInst);

      // Mis próximas reservas (solo futuras)
      const { data: dataReservas } = await supabase
        .from('reservas')
        .select(`id, fecha, hora, instalaciones ( nombre )`)
        .eq('user_id', userId)
        .gte('fecha', hoy)
        .order('fecha', { ascending: true });
      if (dataReservas) setMisReservas(dataReservas);

      // Partidos del mes actual
      const primerDiaMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString().split('T')[0];
      const { count: countMes } = await supabase
        .from('reservas')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('fecha', primerDiaMes);
      setPartidosMes(countMes || 0);

      // Total de partidos completados (fecha pasada)
      const { count: countTotal } = await supabase
        .from('reservas')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .lt('fecha', hoy);
      setTotalJugados(countTotal || 0);

      // Avisos activos
      const { data: dataAvisos } = await supabase
        .from('avisos')
        .select('*')
        .eq('activo', true)
        .order('created_at', { ascending: false });
      if (dataAvisos) setAvisos(dataAvisos);

      setLoading(false);
    };

    fetchData();
  }, [user?.id]);

  const resolveAvatarUrl = useCallback(async () => {
    const value = profile?.avatar_url;
    if (!value) return null;
    if (String(value).startsWith('http')) return value;

    const { data, error } = await supabase.storage
      .from('avatars')
      .createSignedUrl(String(value), 60 * 60);

    if (error) {
      console.warn('[Avatar] signed url error:', error.message);
      return null;
    }
    return data?.signedUrl ?? null;
  }, [profile?.avatar_url]);

  useEffect(() => {
    let alive = true;
    const safeRefresh = async () => {
      const nextUrl = await resolveAvatarUrl();
      if (!alive) return;
      setAvatarDisplayUrl(nextUrl);
    };

    void safeRefresh();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') void safeRefresh();
    };

    window.addEventListener('focus', handleVisibilityChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      alive = false;
      window.removeEventListener('focus', handleVisibilityChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [resolveAvatarUrl]);

  const cancelarReserva = async (id) => {
    const { error } = await supabase.from('reservas').delete().eq('id', id);
    if (error) {
      toast.error('No se pudo cancelar la reserva.');
    } else {
      setMisReservas(prev => prev.filter(r => r.id !== id));
      setPartidosMes(prev => Math.max(0, prev - 1));
      toast.success('Reserva cancelada.');
    }
  };

  if (loading) return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#1A1A2E] border border-white/5 rounded-3xl p-6">
          <div className="h-6 w-56 bg-white/5 rounded-xl mb-4" />
          <div className="h-10 w-80 bg-white/5 rounded-2xl mb-6" />
          <div className="flex gap-3">
            <div className="h-11 w-36 bg-white/5 rounded-2xl" />
            <div className="h-11 w-44 bg-white/5 rounded-2xl" />
          </div>
        </div>
        <div className="bg-[#1A1A2E] border border-white/5 rounded-3xl p-6">
          <div className="h-6 w-40 bg-white/5 rounded-xl mb-4" />
          <div className="h-24 w-full bg-white/5 rounded-3xl" />
        </div>
      </div>
      <p className="text-brand-lime/80 text-sm font-bold animate-pulse">Cargando tu panel…</p>
    </div>
  );

  const progreso   = Math.min(Math.round((partidosMes / META_PARTIDOS) * 100), 100);
  const nivel      = getNivel(totalJugados);
  const sigNivel   = nivel.next;
  const progrNivel = sigNivel
    ? Math.min(Math.round((totalJugados / sigNivel) * 100), 100)
    : 100;

  const firstName = profile?.full_name?.trim()?.split(' ')?.[0] || profile?.email?.split('@')?.[0] || 'jugador';

  const instalacionesUnique = (() => {
    const map = new Map();
    for (const inst of instalaciones) {
      const key = String(inst?.nombre ?? inst?.id ?? '');
      if (!map.has(key)) map.set(key, inst);
    }
    return Array.from(map.values());
  })();

  return (
    <div className="max-w-6xl mx-auto space-y-8">

      {/* HERO */}
      <header className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-brand-lime/12 via-white/0 to-brand-purple/10 p-6 md:p-8 anim-shine">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-brand-lime/10 rounded-full blur-3xl anim-floaty pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-brand-purple/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row gap-6 lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            {/* Slot de imagen/escudo */}
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 shrink-0 overflow-hidden">
              {avatarDisplayUrl ? (
                <img src={avatarDisplayUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon size={22} />
              )}
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                Panel principal
              </p>
              <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">
                Hola, <span className="text-brand-lime">{firstName}</span>
              </h1>
              <p className="text-gray-400 text-sm mt-1 max-w-2xl">
                Gestiona reservas, consulta avisos y controla el estado de las instalaciones en tiempo real.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  to="/reservar"
                  className="px-5 py-3 bg-brand-lime text-black rounded-2xl font-black hover:scale-[1.02] active:scale-[0.99] transition-all flex items-center gap-2 shadow-[0_0_18px_rgba(204,255,0,0.28)]"
                >
                  <PlusCircle size={18} />
                  Nueva reserva
                  <ArrowUpRight size={18} />
                </Link>
                <Link
                  to="/historial"
                  className="px-5 py-3 bg-white/5 border border-white/10 text-gray-200 rounded-2xl font-bold hover:bg-white/10 transition-all flex items-center gap-2"
                >
                  <Clock size={18} />
                  Ver historial
                </Link>
              </div>
            </div>
          </div>

          {/* KPI mini */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-3 w-full lg:w-[360px]">
            {[
              { label: 'Este mes', value: partidosMes, icon: Calendar, color: 'text-brand-lime', bg: 'bg-brand-lime/10' },
              { label: 'Completados', value: totalJugados, icon: Star, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
              { label: 'Próximos', value: misReservas.length, icon: Clock, color: 'text-brand-purple', bg: 'bg-brand-purple/10' },
              { label: 'Avisos', value: avisos.length, icon: AlertTriangle, color: 'text-brand-red', bg: 'bg-brand-red/10' },
            ].map(({ label, value, icon, color, bg }) => {
              const Icon = icon;
              return (
                <div key={label} className="rounded-3xl border border-white/5 bg-[#0F0F1A]/55 p-4">
                  <div className={`w-10 h-10 rounded-2xl ${bg} ${color} flex items-center justify-center mb-3`}>
                    <Icon size={18} />
                  </div>
                  <p className="text-2xl font-black text-white leading-none">{value}</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">{label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* COLUMNA IZQUIERDA */}
        <div className="lg:col-span-2 space-y-8">

          {/* PRÓXIMOS PARTIDOS */}
          <section>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Calendar className="text-brand-purple" /> Mis Próximos Partidos
            </h3>
            {misReservas.length === 0 ? (
              <div className="bg-[#1A1A2E] p-8 rounded-3xl border border-white/5 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-lime/10 to-transparent opacity-60 pointer-events-none" />
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 mx-auto mb-4">
                    <Calendar size={20} />
                  </div>
                  <p className="text-gray-300 font-bold mb-1">No tienes reservas próximas</p>
                  <p className="text-gray-500 text-sm mb-5">Elige pista y horario en menos de 30 segundos.</p>
                  <Link
                    to="/reservar"
                    className="inline-flex items-center gap-2 px-5 py-3 bg-brand-lime text-black rounded-2xl font-black hover:scale-[1.02] transition-all"
                  >
                    <PlusCircle size={16} /> Reservar ahora
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid gap-4">
                {misReservas.map(reserva => (
                  <div
                    key={reserva.id}
                    className="bg-[#1F1F2E] p-4 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-brand-lime/30 hover:shadow-[0_0_18px_rgba(204,255,0,0.10)] transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-brand-lime/10 rounded-xl flex items-center justify-center text-brand-lime font-bold text-lg">
                        {String(reserva.hora).split(':')[0]}h
                      </div>
                      <div>
                        <h4 className="font-bold text-white">
                          {reserva.instalaciones?.nombre || 'Pista Deportiva'}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                          <span className="flex items-center gap-1"><Calendar size={12} /> {reserva.fecha}</span>
                          <span className="flex items-center gap-1"><Clock size={12} /> {reserva.hora}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => cancelarReserva(reserva.id)}
                      className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                      title="Cancelar Reserva"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ESTADO DE PISTAS */}
          <section>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <MapPin className="text-brand-lime" /> Estado de Pistas
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {instalacionesUnique.map((item) => (
                <div key={item.id} className="bg-[#1A1A2E] p-4 rounded-2xl border border-white/5 flex items-center gap-4 hover:border-white/10 transition-colors">
                  <div className={`w-3 h-10 rounded-full shrink-0 ${
                    item.estado === 'disponible'    ? 'bg-brand-lime' :
                    item.estado === 'mantenimiento' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <div>
                    <h4 className="font-bold text-white">{item.nombre}</h4>
                    <p className={`text-xs uppercase font-bold mt-1 ${
                      item.estado === 'disponible'    ? 'text-brand-lime' :
                      item.estado === 'mantenimiento' ? 'text-yellow-500' : 'text-red-500'
                    }`}>
                      {item.estado}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* COLUMNA DERECHA */}
        <div className="space-y-6">

          {/* AVISOS */}
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
              <AlertTriangle className="text-brand-red" /> Avisos
            </h3>
            {avisos.length === 0 ? (
              <div className="bg-[#1A1A2E] border border-white/5 rounded-3xl p-6 text-sm text-gray-500">
                No hay avisos activos.
              </div>
            ) : (
              avisos.map((aviso) => (
                <div key={aviso.id} className="bg-brand-purple/5 border border-brand-purple/20 p-5 rounded-2xl mb-3 hover:border-brand-purple/35 transition-colors">
                  <h5 className="font-bold text-brand-purple mb-1">{aviso.titulo}</h5>
                  <p className="text-xs text-gray-400 leading-relaxed">{aviso.mensaje}</p>
                </div>
              ))
            )}
          </div>

          {/* NIVEL DEL JUGADOR (mejorado) */}
          <div className="bg-[#1A1A2E] p-6 rounded-3xl border border-white/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-brand-lime/10 rounded-xl flex items-center justify-center text-xl">
                {nivel.emoji}
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Tu nivel</p>
                <p className={`text-lg font-black ${nivel.color}`}>{nivel.nombre}</p>
              </div>
              <Link to="/estadisticas" className="ml-auto text-gray-500 hover:text-brand-lime transition-colors" title="Ver estadísticas completas">
                <BarChart2 size={18} />
              </Link>
            </div>

            <p className="text-xs text-gray-500 mb-3">
              {sigNivel
                ? `${totalJugados} / ${sigNivel} partidos para subir de nivel`
                : '¡Has alcanzado el nivel máximo!'}
            </p>
            <div className="w-full bg-black/40 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-brand-lime h-full rounded-full transition-all duration-700 shadow-[0_0_6px_rgba(204,255,0,0.4)]"
                style={{ width: `${progrNivel}%` }}
              />
            </div>
          </div>

          {/* META MENSUAL */}
          <div className="bg-gradient-to-br from-brand-lime/20 to-transparent p-6 rounded-3xl border border-brand-lime/20 text-center">
            <h4 className="font-bold text-brand-lime text-lg mb-1">Meta del Mes</h4>
            <p className="text-xs text-gray-300 mb-4">
              {partidosMes} de {META_PARTIDOS} partidos reservados
            </p>
            <div className="w-full bg-black/30 h-2 rounded-full overflow-hidden mb-2">
              <div
                className="bg-brand-lime h-full rounded-full transition-all duration-700"
                style={{ width: `${progreso}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-gray-500">
              <span>0</span>
              <span className="text-brand-lime font-bold">{progreso}%</span>
              <span>{META_PARTIDOS}</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}