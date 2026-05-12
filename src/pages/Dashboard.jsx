import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/useAuth';
import { Link } from 'react-router-dom';
import { Calendar, Clock, AlertTriangle, MapPin, PlusCircle, Trash2, BarChart2, Star, Image as ImageIcon, ArrowUpRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

/**
 * Determina el nivel del jugador a partir de partidos completados.
 * @param {number} total
 * @returns {{nombre: string, emoji: string, color: string, next: (number|null), threshold: number}}
 */
function getNivel(total) {
  if (total >= 50) return { nombre: 'Leyenda',   emoji: '🏆', color: 'text-brand-purple dark:text-brand-lime',   next: null,  threshold: 50 };
  if (total >= 25) return { nombre: 'Veterano',   emoji: '⭐', color: 'text-yellow-600 dark:text-yellow-400',   next: 50,   threshold: 25 };
  if (total >= 10) return { nombre: 'Habitual',   emoji: '🔥', color: 'text-orange-500 dark:text-orange-400',   next: 25,   threshold: 10 };
  if (total >= 5)  return { nombre: 'En Forma',   emoji: '💪', color: 'text-blue-500 dark:text-blue-400',     next: 10,   threshold: 5  };
  if (total >= 1)  return { nombre: 'Novato',     emoji: '🎾', color: 'theme-text',     next: 5,    threshold: 1  };
  return                  { nombre: 'Nuevo',      emoji: '👤', color: 'theme-faint',     next: 1,    threshold: 0  };
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
  const { t } = useTranslation();

  const [instalaciones, setInstalaciones] = useState([]);
  const [misReservas, setMisReservas]     = useState([]);
  const [avisos, setAvisos]               = useState([]);
  const [loading, setLoading]             = useState(true);
  const [partidosMes, setPartidosMes]     = useState(0);
  const [totalJugados, setTotalJugados]   = useState(0);
  const [avatarDisplayUrl, setAvatarDisplayUrl] = useState(null);

  const META_PARTIDOS = 5;
  useEffect(() => {
    if (!user?.id) return;
    const hoy = new Date().toISOString().split('T')[0];

    const fetchData = async () => {
      const userId = user.id;

      const { data: dataInst } = await supabase
        .from('instalaciones')
        .select('*')
        .order('id');
      if (dataInst) setInstalaciones(dataInst);

      const { data: dataReservas } = await supabase
        .from('reservas')
        .select(`id, fecha, hora, instalaciones ( nombre )`)
        .eq('user_id', userId)
        .gte('fecha', hoy)
        .order('fecha', { ascending: true });
      if (dataReservas) setMisReservas(dataReservas);

      const primerDiaMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString().split('T')[0];
      const { count: countMes } = await supabase
        .from('reservas')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('fecha', primerDiaMes);
      setPartidosMes(countMes || 0);

      const { count: countTotal } = await supabase
        .from('reservas')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .lt('fecha', hoy);
      setTotalJugados(countTotal || 0);

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
      toast.error(t('dashboard.cancelError'));
    } else {
      setMisReservas(prev => prev.filter(r => r.id !== id));
      setPartidosMes(prev => Math.max(0, prev - 1));
      toast.success(t('dashboard.cancelSuccess'));
    }
  };

  if (loading) return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 theme-card p-6">
          <div className="h-6 w-56 theme-elevated rounded-xl mb-4" />
          <div className="h-10 w-80 theme-elevated rounded-2xl mb-6" />
          <div className="flex gap-3">
            <div className="h-11 w-36 bg-white/5 rounded-2xl" />
            <div className="h-11 w-44 bg-white/5 rounded-2xl" />
          </div>
        </div>
        <div className="theme-card p-6">
          <div className="h-6 w-40 theme-elevated rounded-xl mb-4" />
          <div className="h-24 w-full theme-elevated rounded-3xl" />
        </div>
      </div>
      <p className="text-brand-lime/80 text-sm font-bold animate-pulse">{t('dashboard.loading')}</p>
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
    <div className="max-w-6xl mx-auto space-y-8 bg-cueva-gradient min-h-screen -m-6 p-6 md:-m-8 md:p-8 rounded-[3rem]">

      {/* HERO */}
      <header className="relative overflow-hidden theme-card p-6 md:p-8 anim-shine border-none bg-gradient-to-br from-brand-lime/25 via-transparent to-brand-purple/25 shadow-2xl">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-brand-lime/15 rounded-full blur-3xl anim-floaty pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-brand-purple/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row gap-6 lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl theme-bg border theme-border flex items-center justify-center theme-faint shrink-0 overflow-hidden">
              {avatarDisplayUrl ? (
                <img src={avatarDisplayUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon size={22} />
              )}
            </div>
            <div>
              <p className="text-[11px] font-bold theme-faint uppercase tracking-widest">
                {t('dashboard.panelLabel')}
              </p>
              <h1 className="text-3xl md:text-4xl font-black theme-text leading-tight">
                {t('dashboard.greeting')} <span className="text-brand-purple dark:text-brand-lime">{firstName}</span>
              </h1>
              <p className="theme-faint text-sm mt-1 max-w-2xl">
                {t('dashboard.subtitle')}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  to="/reservar"
                  className="px-5 py-3 bg-brand-purple dark:bg-brand-lime text-white dark:text-black rounded-2xl font-black hover:scale-[1.02] active:scale-[0.99] transition-all flex items-center gap-2 shadow-lg"
                >
                  <PlusCircle size={18} />
                  {t('dashboard.newBooking')}
                  <ArrowUpRight size={18} />
                </Link>
                <Link
                  to="/historial"
                  className="px-5 py-3 theme-elevated border theme-border theme-text rounded-2xl font-bold hover:bg-brand-purple/10 dark:hover:bg-white/10 transition-all flex items-center gap-2 shadow-sm"
                >
                  <Clock size={18} />
                  {t('dashboard.viewHistory')}
                </Link>
              </div>
            </div>
          </div>

          {/* KPI mini */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-3 w-full lg:w-[360px]">
            {[
              { label: t('dashboard.kpi.thisMonth'), value: partidosMes, icon: Calendar, color: 'text-brand-purple dark:text-brand-lime', bg: 'bg-brand-purple/25 dark:bg-brand-lime/25' },
              { label: t('dashboard.kpi.completed'), value: totalJugados, icon: Star, color: 'text-yellow-700 dark:text-yellow-400', bg: 'bg-yellow-600/25 dark:bg-yellow-400/25' },
              { label: t('dashboard.kpi.upcoming'), value: misReservas.length, icon: Clock, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/25 dark:bg-blue-400/25' },
              { label: t('dashboard.kpi.alerts'), value: avisos.length, icon: AlertTriangle, color: 'text-red-600 dark:text-red-500', bg: 'bg-red-500/20' },
            ].map(({ label, value, icon, color, bg }) => {
              const Icon = icon;
              return (
                <div key={label} className="theme-card border theme-border p-4 shadow-xl hover:scale-[1.03] transition-all duration-300 glow-purple">
                  <div className={`w-10 h-10 rounded-2xl ${bg} ${color} flex items-center justify-center mb-3`}>
                    <Icon size={18} />
                  </div>
                  <p className="text-2xl font-black theme-text leading-none">{value}</p>
                  <p className="text-[10px] theme-muted font-bold uppercase tracking-widest mt-1">{label}</p>
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
            <h3 className="text-xl font-bold theme-text mb-4 flex items-center gap-2">
              <Calendar className="text-brand-purple" /> {t('dashboard.nextMatches')}
            </h3>
            {misReservas.length === 0 ? (
              <div className="theme-card p-8 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/25 dark:from-brand-lime/25 to-transparent opacity-90 pointer-events-none" />
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-2xl theme-bg border theme-border flex items-center justify-center theme-faint mx-auto mb-4">
                    <Calendar size={20} />
                  </div>
                  <p className="theme-text font-bold mb-1">{t('dashboard.noBookings')}</p>
                  <p className="theme-faint text-sm mb-5">{t('dashboard.noBookingsDesc')}</p>
                  <Link
                    to="/reservar"
                    className="inline-flex items-center gap-2 px-5 py-3 bg-brand-purple dark:bg-brand-lime text-white dark:text-black rounded-2xl font-black hover:scale-[1.02] transition-all shadow-lg"
                  >
                    <PlusCircle size={16} /> {t('dashboard.bookNow')}
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid gap-4">
                {misReservas.map(reserva => (
                  <div
                    key={reserva.id}
                    className="theme-card p-4 flex items-center justify-between group hover:border-brand-purple dark:hover:border-brand-lime transition-all glow-purple"
                  >
                    <Link to="/historial" className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-brand-purple/25 dark:bg-brand-lime/25 rounded-xl flex items-center justify-center text-brand-purple dark:text-brand-lime font-black text-lg">
                        {String(reserva.hora).split(':')[0]}h
                      </div>
                      <div>
                        <h4 className="font-bold theme-text group-hover:text-brand-purple dark:group-hover:text-brand-lime transition-colors">
                          {reserva.instalaciones?.nombre || t('dashboard.courtSport')}
                        </h4>
                        <div className="flex items-center gap-3 text-xs theme-faint mt-1">
                          <span className="flex items-center gap-1"><Calendar size={12} /> {reserva.fecha}</span>
                          <span className="flex items-center gap-1"><Clock size={12} /> {reserva.hora}</span>
                        </div>
                      </div>
                    </Link>
                    <button
                      onClick={() => cancelarReserva(reserva.id)}
                      className="p-2 theme-faint hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors shrink-0 ml-4"
                      title={t('dashboard.cancelBooking')}
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
            <h3 className="text-xl font-bold theme-text mb-4 flex items-center gap-2">
              <MapPin className="text-brand-purple dark:text-brand-lime" /> {t('dashboard.courtStatus')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {instalacionesUnique.map((item) => (
                <div key={item.id} className="theme-card p-4 flex items-center gap-4 hover:border-brand-purple dark:hover:border-brand-lime transition-colors glow-lime">
                  <div className={`w-3 h-10 rounded-full shrink-0 ${
                    item.estado === 'disponible'    ? 'bg-brand-purple dark:bg-brand-lime' :
                    item.estado === 'mantenimiento' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <div>
                    <h4 className="font-bold theme-text">{item.nombre}</h4>
                    <p className={`text-xs uppercase font-bold mt-1 ${
                      item.estado === 'disponible'    ? 'text-brand-purple dark:text-brand-lime' :
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
            <h3 className="text-xl font-bold theme-text flex items-center gap-2 mb-4">
              <AlertTriangle className="text-brand-red" /> {t('dashboard.alerts')}
            </h3>
            {avisos.length === 0 ? (
              <div className="theme-card p-6 text-sm theme-faint">
                {t('dashboard.noAlerts')}
              </div>
            ) : (
              avisos.map((aviso) => (
                <div key={aviso.id} className="bg-brand-purple/15 border border-brand-purple/30 p-5 rounded-2xl mb-3 hover:border-brand-purple/50 transition-colors">
                  <h5 className="font-bold text-brand-purple mb-1">{aviso.titulo}</h5>
                  <p className="text-xs theme-text leading-relaxed">{aviso.mensaje}</p>
                </div>
              ))
            )}
          </div>

          {/* NIVEL DEL JUGADOR */}
          <div className="theme-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-brand-purple/10 dark:bg-brand-lime/10 rounded-xl flex items-center justify-center text-xl">
                {nivel.emoji}
              </div>
              <div>
                <p className="text-[10px] theme-faint font-bold uppercase tracking-wider">{t('dashboard.yourLevel')}</p>
                <p className={`text-lg font-black ${nivel.color}`}>{nivel.nombre}</p>
              </div>
              <Link to="/estadisticas" className="ml-auto theme-faint hover:text-brand-purple dark:hover:text-brand-lime transition-colors" title="Ver estadísticas completas">
                <BarChart2 size={18} />
              </Link>
            </div>

            <p className="text-xs theme-faint mb-3">
              {sigNivel
                ? `${totalJugados} / ${sigNivel} ${t('dashboard.progressLabel')}`
                : t('dashboard.maxLevel')}
            </p>
            <div className="w-full theme-bg h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-brand-purple dark:bg-brand-lime h-full rounded-full transition-all duration-700 shadow-sm"
                style={{ width: `${progrNivel}%` }}
              />
            </div>
          </div>

          {/* META MENSUAL */}
          <div className="bg-gradient-to-br from-brand-purple/30 dark:from-brand-lime/30 to-transparent p-6 rounded-3xl border border-brand-purple/35 dark:border-brand-lime/35 text-center">
            <h4 className="font-bold text-brand-purple dark:text-brand-lime text-lg mb-1">{t('dashboard.monthlyGoal')}</h4>
            <p className="text-xs theme-text mb-4">
              {partidosMes} {t('dashboard.monthlyGoalDesc', { meta: META_PARTIDOS })}
            </p>
            <div className="w-full theme-bg h-2 rounded-full overflow-hidden mb-2">
              <div
                className="bg-brand-purple dark:bg-brand-lime h-full rounded-full transition-all duration-700"
                style={{ width: `${progreso}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] theme-faint">
              <span>0</span>
              <span className="text-brand-purple dark:text-brand-lime font-bold">{progreso}%</span>
              <span>{META_PARTIDOS}</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}