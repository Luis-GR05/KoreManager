import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/useAuth';
import { Link } from 'react-router-dom';
import { BarChart2, Trophy, Calendar, Clock, MapPin, Zap, Star, Target, TrendingUp, Award, PlusCircle } from 'lucide-react';
import { getReservaStatus } from '../lib/reservaStatus';
import { useTranslation } from 'react-i18next';

const LOGROS = [
  { id: 'primer_partido',       icon: '🎾', threshold: 1,  color: 'text-brand-purple dark:text-brand-lime',   bg: 'bg-brand-purple/10 dark:bg-brand-lime/10',   border: 'border-brand-purple/30 dark:border-brand-lime/30'   },
  { id: 'cinco_partidos',       icon: '💪', threshold: 5,  color: 'text-blue-500 dark:text-blue-400',     bg: 'bg-blue-500/10 dark:bg-blue-400/10',     border: 'border-blue-500/30 dark:border-blue-400/30'     },
  { id: 'diez_partidos',        icon: '🔥', threshold: 10, color: 'text-orange-500 dark:text-orange-400',   bg: 'bg-orange-500/10 dark:bg-orange-400/10',   border: 'border-orange-500/30 dark:border-orange-400/30'   },
  { id: 'veinticinco_partidos', icon: '⭐', threshold: 25, color: 'text-yellow-600 dark:text-yellow-400',   bg: 'bg-yellow-600/10 dark:bg-yellow-400/10',   border: 'border-yellow-600/30 dark:border-yellow-400/30'   },
  { id: 'cincuenta_partidos',   icon: '🏆', threshold: 50, color: 'text-brand-purple dark:text-brand-lime',   bg: 'bg-brand-purple/10 dark:bg-brand-lime/10',   border: 'border-brand-purple/30 dark:border-brand-lime/30'   },
];

const DIAS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DIAS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HORAS_LABEL = ['09', '10', '11', '12', '13', '16', '17', '18', '19', '20', '21'];

function getNivel(total) {
  if (total >= 50) return { nombre: 'Leyenda', color: 'text-brand-purple dark:text-brand-lime', bg: 'bg-brand-purple/20 dark:bg-brand-lime/20', next: null };
  if (total >= 25) return { nombre: 'Veterano', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-600/20 dark:bg-yellow-400/20', next: 50 };
  if (total >= 10) return { nombre: 'Habitual', color: 'text-orange-500 dark:text-orange-400', bg: 'bg-orange-500/20 dark:bg-orange-400/20', next: 25 };
  if (total >= 5)  return { nombre: 'En Forma', color: 'text-blue-500 dark:text-blue-400',   bg: 'bg-blue-500/20 dark:bg-blue-400/20',   next: 10 };
  if (total >= 1)  return { nombre: 'Novato',   color: 'theme-text',   bg: 'theme-elevated',      next: 5  };
  return                  { nombre: 'Sin nivel', color: 'theme-faint',  bg: 'theme-bg',       next: 1  };
}

function StatCard({ icon, label, value, color, bg, isText = false }) {
  const Icon = icon;
  return (
    <div className="theme-card p-5 border theme-border flex items-center gap-4">
      <div className={`p-3 rounded-xl ${bg} ${color} shrink-0`}>
        <Icon size={22} />
      </div>
      <div>
        <p className={`font-bold ${isText ? 'text-base' : 'text-3xl'} theme-text`}>{value}</p>
        <p className="text-xs theme-faint font-bold uppercase tracking-wider mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function BarChartSimple({ data, label }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="theme-card p-6 border theme-border">
      <h3 className="text-base font-bold theme-text mb-6 flex items-center gap-2">
        <BarChart2 size={18} className="text-brand-purple dark:text-brand-lime" /> {label}
      </h3>
      <div className="flex items-end gap-2 h-32">
        {data.map(({ name, value }) => {
          const pct = max > 0 ? Math.round((value / max) * 100) : 0;
          return (
            <div key={name} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] theme-faint font-bold">{value > 0 ? value : ''}</span>
              <div className="w-full flex items-end" style={{ height: '88px' }}>
                <div className="w-full flex items-end" style={{ height: '88px' }}>
                  <div className="w-full rounded-t-lg bg-brand-purple/20 dark:bg-brand-lime/30 hover:bg-brand-purple dark:hover:bg-brand-lime transition-colors duration-300 relative group" style={{ height: `${Math.max(pct, value > 0 ? 4 : 0)}%` }}>
                    <div className="absolute bottom-0 left-0 right-0 rounded-t-lg bg-brand-purple dark:bg-brand-lime transition-all duration-500" style={{ height: `${pct}%`, minHeight: value > 0 ? '4px' : '0' }} />
                  </div>
                </div>
              </div>
              <span className="text-[10px] theme-faint font-medium">{name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LogroCard({ logro, unlocked, unlockedLabel }) {
  const { t } = useTranslation();
  const titulo = t(`stats.logros.${logro.id}.title`, { defaultValue: logro.id });
  const desc   = t(`stats.logros.${logro.id}.desc`,  { defaultValue: '' });
  return (
    <div className={`rounded-2xl p-4 border transition-all ${unlocked ? `${logro.bg} ${logro.border}` : 'theme-bg theme-border opacity-40 grayscale'}`}>
      <div className="text-3xl mb-2">{logro.icon}</div>
      <h4 className={`font-bold text-sm ${unlocked ? logro.color : 'theme-faint'}`}>{titulo}</h4>
      <p className="text-[11px] theme-faint mt-0.5">{desc}</p>
      {unlocked && (
        <span className={`inline-block mt-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${logro.bg} ${logro.color}`}>
          {unlockedLabel}
        </span>
      )}
    </div>
  );
}

export default function Estadisticas() {
  const { user, profile, roleName } = useAuth();
  const { t, i18n } = useTranslation();

  const [loading, setLoading]   = useState(true);
  const [reservas, setReservas] = useState([]);

  const DIAS = i18n.language === 'en' ? DIAS_EN : DIAS_ES;

  useEffect(() => {
    if (!user?.id || !roleName) return;

    const isAdmin = roleName === 'admin';
    const cacheKey = isAdmin ? 'kore_estadisticas_reservas_admin_v1' : `kore_estadisticas_reservas_v1:${user.id}`;
    const cached = (() => {
      try { return JSON.parse(sessionStorage.getItem(cacheKey) || 'null'); } catch { return null; }
    })();

    if (cached?.data && Array.isArray(cached.data)) {
      setReservas(cached.data);
      setLoading(false);
    }

    let alive = true;
    (async () => {
      let query = supabase
        .from('reservas')
        .select('id, fecha, hora, instalaciones ( nombre, tipo )')
        .order('fecha', { ascending: false });

      if (!isAdmin) query = query.eq('user_id', user.id);

      const { data } = await query;

      if (!alive) return;
      const next = data || [];
      setReservas(next);
      setLoading(false);
      try { sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: next })); } catch { /* ignore */ }
    })();

    return () => { alive = false; };
  }, [user?.id]);

  const now = new Date();
  const pasadas = reservas.filter(r => getReservaStatus(r.fecha, r.hora, 60, now) === 'completed');
  const proximas = reservas.filter(r => {
    const s = getReservaStatus(r.fecha, r.hora, 60, now);
    return s === 'upcoming' || s === 'in_progress';
  });

  const porTipo = {};
  pasadas.forEach(r => {
    const tipo = r.instalaciones?.tipo || 'otro';
    porTipo[tipo] = (porTipo[tipo] || 0) + 1;
  });
  const tipoData = Object.entries(porTipo).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));

  const porDia = Array(7).fill(0);
  reservas.forEach(r => {
    const d = new Date(r.fecha + 'T00:00:00').getDay();
    porDia[d]++;
  });
  const diaData = DIAS.map((name, i) => ({ name, value: porDia[i] }));

  const porHora = {};
  reservas.forEach(r => {
    const h = r.hora?.slice(0, 2);
    if (h) porHora[h] = (porHora[h] || 0) + 1;
  });
  const horaData = HORAS_LABEL.map(h => ({ name: `${h}h`, value: porHora[h] || 0 }));

  const porInst = {};
  reservas.forEach(r => {
    const n = r.instalaciones?.nombre;
    if (n) porInst[n] = (porInst[n] || 0) + 1;
  });
  const instFavorita = Object.entries(porInst).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

  const nivel = getNivel(pasadas.length);
  const sigNivel = nivel.next;
  const progresoNivel = sigNivel ? Math.round((pasadas.length / sigNivel) * 100) : 100;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-brand-lime animate-pulse text-lg font-medium">{t('stats.loading')}</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">

      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b theme-border pb-6">
        <div>
          <h1 className="text-3xl font-bold theme-text flex items-center gap-3">
            <BarChart2 className="text-brand-purple dark:text-brand-lime" size={32} />
            {roleName === 'admin' ? t('stats.titleAdmin') : t('stats.titleUser')}
          </h1>
          <p className="theme-faint text-sm mt-1">
            {roleName === 'admin'
              ? t('stats.subtitleAdmin')
              : `${t('stats.kpi.played')}: ${profile?.full_name?.split(' ')[0] || 'jugador'}`}
          </p>
        </div>
        <Link to="/reservar" className="px-6 py-3 bg-brand-purple dark:bg-brand-lime text-white dark:text-black rounded-full font-bold hover:scale-105 transition-all flex items-center gap-2 shadow-lg">
          <PlusCircle size={18} /> {t('stats.newBooking')}
        </Link>
      </header>

      {/* NIVEL */}
      <div className="bg-gradient-to-r from-brand-purple/10 dark:from-[#1A1A2E] to-transparent dark:to-[#1F1F2E] rounded-3xl p-6 border theme-border flex flex-col md:flex-row items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-brand-purple/10 dark:bg-brand-lime/10 rounded-2xl flex items-center justify-center">
            <Star className="text-brand-purple dark:text-brand-lime" size={32} />
          </div>
          <div>
            <p className="text-xs theme-faint font-bold uppercase tracking-wider mb-1">
              {roleName === 'admin' ? t('stats.level.center') : t('stats.level.current')}
            </p>
            <span className={`text-2xl font-black ${nivel.color}`}>{nivel.nombre}</span>
          </div>
        </div>
        <div className="flex-1 w-full">
          <div className="flex justify-between text-xs theme-faint mb-2">
            <span>{pasadas.length} {t('stats.level.completed')}</span>
            {sigNivel && <span>{t('stats.level.nextLevel', { count: sigNivel })}</span>}
            {!sigNivel && <span className="text-brand-purple dark:text-brand-lime font-bold">{t('stats.level.maxLevel')}</span>}
          </div>
          <div className="w-full theme-bg h-3 rounded-full overflow-hidden">
            <div className="bg-brand-purple dark:bg-brand-lime h-full rounded-full transition-all duration-1000 shadow-sm" style={{ width: `${progresoNivel}%` }} />
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Trophy}   label={t('stats.kpi.played')}   value={pasadas.length}    color="text-brand-purple dark:text-brand-lime"   bg="bg-brand-purple/10 dark:bg-brand-lime/10" />
        <StatCard icon={Calendar} label={t('stats.kpi.upcoming')} value={proximas.length}   color="text-blue-500 dark:text-blue-400" bg="bg-blue-500/10 dark:bg-blue-400/10" />
        <StatCard icon={MapPin}   label={t('stats.kpi.favorite')} value={instFavorita}      color="text-orange-500 dark:text-orange-400"     bg="bg-orange-500/10 dark:bg-orange-400/10"  isText />
        <StatCard icon={Target}   label={t('stats.kpi.total')}    value={reservas.length}   color="theme-text"        bg="theme-elevated" />
      </div>

      {/* GRÁFICOS */}
      {reservas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <BarChartSimple data={diaData}  label={t('stats.charts.byDay')} />
          <BarChartSimple data={horaData} label={t('stats.charts.byHour')} />
          <div className="theme-card p-6 border theme-border">
            <h3 className="text-base font-bold theme-text mb-6 flex items-center gap-2">
              <TrendingUp size={18} className="text-brand-purple" /> {t('stats.charts.byType')}
            </h3>
            {tipoData.length > 0 ? (
              <div className="space-y-3">
                {tipoData.map(({ name, value }) => {
                  const pct = pasadas.length > 0 ? Math.round((value / pasadas.length) * 100) : 0;
                  return (
                    <div key={name}>
                      <div className="flex justify-between text-xs theme-faint mb-1.5">
                        <span className="font-medium theme-text capitalize">{name}</span>
                        <span>{value} ({pct}%)</span>
                      </div>
                      <div className="h-2 theme-bg rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-brand-purple transition-all duration-700" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">{t('stats.empty.noData')}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="theme-card p-12 border theme-border text-center">
          <BarChart2 size={48} className="mx-auto theme-faint mb-4" />
          <h3 className="text-xl font-bold theme-text mb-2">{t('stats.empty.title')}</h3>
          <p className="theme-faint text-sm mb-6">{t('stats.empty.desc')}</p>
          <Link to="/reservar" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-purple dark:bg-brand-lime text-white dark:text-black rounded-full font-bold text-sm hover:scale-105 transition-all shadow-lg">
            <PlusCircle size={16} /> {t('stats.empty.firstBooking')}
          </Link>
        </div>
      )}

      {/* LOGROS */}
      <div>
        <h2 className="text-xl font-bold theme-text mb-4 flex items-center gap-2">
          <Award className="text-brand-purple dark:text-brand-lime" size={22} /> {t('stats.achievements')}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {LOGROS.map(logro => (
            <LogroCard
              key={logro.id}
              logro={logro}
              unlocked={pasadas.length >= logro.threshold}
              unlockedLabel={t('stats.unlocked')}
            />
          ))}
        </div>
      </div>

    </div>
  );
}
