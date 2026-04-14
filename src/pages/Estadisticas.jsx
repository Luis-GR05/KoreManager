// src/pages/Estadisticas.jsx
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/useAuth';
import { Link } from 'react-router-dom';
import {
  BarChart2, Trophy, Calendar, Clock, MapPin,
  Zap, Star, Target, TrendingUp, Award, PlusCircle
} from 'lucide-react';
import { getReservaStatus } from '../lib/reservaStatus';

// ─── Definición de Logros ─────────────────────────────────────────────────────
const LOGROS = [
  {
    id: 'primer_partido',
    titulo: '¡Primer Saque!',
    desc: 'Completa tu primera reserva',
    icon: '🎾',
    threshold: 1,
    color: 'text-brand-lime',
    bg: 'bg-brand-lime/10',
    border: 'border-brand-lime/30',
  },
  {
    id: 'cinco_partidos',
    titulo: 'En Forma',
    desc: 'Completa 5 reservas',
    icon: '💪',
    threshold: 5,
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    border: 'border-blue-400/30',
  },
  {
    id: 'diez_partidos',
    titulo: 'Habitual',
    desc: 'Completa 10 reservas',
    icon: '🔥',
    threshold: 10,
    color: 'text-orange-400',
    bg: 'bg-orange-400/10',
    border: 'border-orange-400/30',
  },
  {
    id: 'veinticinco_partidos',
    titulo: 'Veterano',
    desc: 'Completa 25 reservas',
    icon: '⭐',
    threshold: 25,
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
    border: 'border-yellow-400/30',
  },
  {
    id: 'cincuenta_partidos',
    titulo: 'Leyenda',
    desc: 'Completa 50 reservas',
    icon: '🏆',
    threshold: 50,
    color: 'text-brand-lime',
    bg: 'bg-brand-lime/10',
    border: 'border-brand-lime/30',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const HORAS_LABEL = ['09', '10', '11', '12', '13', '16', '17', '18', '19', '20', '21'];

function getNivel(total) {
  if (total >= 50) return { nombre: 'Leyenda', color: 'text-brand-lime', bg: 'bg-brand-lime/20', next: null };
  if (total >= 25) return { nombre: 'Veterano', color: 'text-yellow-400', bg: 'bg-yellow-400/20', next: 50 };
  if (total >= 10) return { nombre: 'Habitual', color: 'text-orange-400', bg: 'bg-orange-400/20', next: 25 };
  if (total >= 5)  return { nombre: 'En Forma', color: 'text-blue-400',   bg: 'bg-blue-400/20',   next: 10 };
  if (total >= 1)  return { nombre: 'Novato',   color: 'text-gray-300',   bg: 'bg-white/10',      next: 5  };
  return                  { nombre: 'Sin nivel', color: 'text-gray-500',   bg: 'bg-white/5',       next: 1  };
}

// ─── Componentes internos ─────────────────────────────────────────────────────
function StatCard({ icon, label, value, color, bg, isText = false }) {
  const Icon = icon;
  return (
    <div className="bg-[#1A1A2E] rounded-2xl p-5 border border-white/5 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${bg} ${color} shrink-0`}>
        <Icon size={22} />
      </div>
      <div>
        <p className={`font-bold ${isText ? 'text-base' : 'text-3xl'} text-white`}>{value}</p>
        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function BarChartSimple({ data, label }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="bg-[#1A1A2E] rounded-3xl p-6 border border-white/5">
      <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
        <BarChart2 size={18} className="text-brand-lime" /> {label}
      </h3>
      <div className="flex items-end gap-2 h-32">
        {data.map(({ name, value }) => {
          const pct = max > 0 ? Math.round((value / max) * 100) : 0;
          return (
            <div key={name} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] text-gray-500 font-bold">{value > 0 ? value : ''}</span>
              <div className="w-full flex items-end" style={{ height: '88px' }}>
                <div
                  className="w-full rounded-t-lg bg-brand-lime/30 hover:bg-brand-lime transition-colors duration-300 relative group"
                  style={{ height: `${Math.max(pct, value > 0 ? 4 : 0)}%` }}
                >
                  <div
                    className="absolute bottom-0 left-0 right-0 rounded-t-lg bg-brand-lime transition-all duration-500"
                    style={{ height: `${pct}%`, minHeight: value > 0 ? '4px' : '0' }}
                  />
                </div>
              </div>
              <span className="text-[10px] text-gray-600 font-medium">{name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LogroCard({ logro, unlocked }) {
  return (
    <div
      className={`rounded-2xl p-4 border transition-all ${
        unlocked
          ? `${logro.bg} ${logro.border}`
          : 'bg-white/3 border-white/5 opacity-40 grayscale'
      }`}
    >
      <div className="text-3xl mb-2">{logro.icon}</div>
      <h4 className={`font-bold text-sm ${unlocked ? logro.color : 'text-gray-500'}`}>
        {logro.titulo}
      </h4>
      <p className="text-[11px] text-gray-500 mt-0.5">{logro.desc}</p>
      {unlocked && (
        <span className={`inline-block mt-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${logro.bg} ${logro.color}`}>
          ✓ Desbloqueado
        </span>
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Estadisticas() {
  const { user, profile } = useAuth();

  const [loading, setLoading]     = useState(true);
  const [reservas, setReservas]   = useState([]);

  useEffect(() => {
    if (!user?.id) return;

    const cacheKey = `kore_estadisticas_reservas_v1:${user.id}`;
    const cached = (() => {
      try { return JSON.parse(sessionStorage.getItem(cacheKey) || 'null'); } catch { return null; }
    })();

    // Pintar instantáneo si hay caché (y refrescar en background)
    if (cached?.data && Array.isArray(cached.data)) {
      setReservas(cached.data);
      setLoading(false);
    }

    let alive = true;
    (async () => {
      const { data } = await supabase
        .from('reservas')
        .select('id, fecha, hora, instalaciones ( nombre, tipo )')
        .eq('user_id', user.id)
        .order('fecha', { ascending: false });

      if (!alive) return;
      const next = data || [];
      setReservas(next);
      setLoading(false);
      try { sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: next })); } catch { /* ignore */ }
    })();

    return () => { alive = false; };
  }, [user?.id]);

  // ── Cálculos derivados ────────────────────────────────────────────────────
  const now = new Date();
  const pasadas = reservas.filter(r => getReservaStatus(r.fecha, r.hora, 60, now) === 'completed');
  const proximas = reservas.filter(r => {
    const s = getReservaStatus(r.fecha, r.hora, 60, now);
    return s === 'upcoming' || s === 'in_progress';
  });

  // Desglose por tipo de instalación (completadas)
  const porTipo = {};
  pasadas.forEach(r => {
    const tipo = r.instalaciones?.tipo || 'otro';
    porTipo[tipo] = (porTipo[tipo] || 0) + 1;
  });
  const tipoData = Object.entries(porTipo)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));

  // Por día de la semana
  const porDia = Array(7).fill(0);
  reservas.forEach(r => {
    const d = new Date(r.fecha + 'T00:00:00').getDay();
    porDia[d]++;
  });
  const diaData = DIAS.map((name, i) => ({ name, value: porDia[i] }));

  // Por hora
  const porHora = {};
  reservas.forEach(r => {
    const h = r.hora?.slice(0, 2);
    if (h) porHora[h] = (porHora[h] || 0) + 1;
  });
  const horaData = HORAS_LABEL.map(h => ({ name: `${h}h`, value: porHora[h] || 0 }));

  // Instalación favorita
  const porInst = {};
  reservas.forEach(r => {
    const n = r.instalaciones?.nombre;
    if (n) porInst[n] = (porInst[n] || 0) + 1;
  });
  const instFavorita = Object.entries(porInst).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

  // Nivel (por partidos completados)
  const nivel = getNivel(pasadas.length);
  const sigNivel = nivel.next;
  const progresoNivel = sigNivel
    ? Math.round((pasadas.length / sigNivel) * 100)
    : 100;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-brand-lime animate-pulse text-lg font-medium">Cargando estadísticas...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">

      {/* CABECERA */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <BarChart2 className="text-brand-lime" size={32} />
            Mis Estadísticas
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Historial completo y análisis de tus partidos,{' '}
            <span className="text-white font-medium">
              {profile?.full_name?.split(' ')[0] || 'jugador'}
            </span>.
          </p>
        </div>
        <Link
          to="/reservar"
          className="px-6 py-3 bg-brand-lime text-black rounded-full font-bold hover:scale-105 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(204,255,0,0.25)]"
        >
          <PlusCircle size={18} /> Nueva Reserva
        </Link>
      </header>

      {/* NIVEL DEL JUGADOR */}
      <div className="bg-gradient-to-r from-[#1A1A2E] to-[#1F1F2E] rounded-3xl p-6 border border-white/5 flex flex-col md:flex-row items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-brand-lime/10 rounded-2xl flex items-center justify-center">
            <Star className="text-brand-lime" size={32} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Tu nivel actual</p>
            <span className={`text-2xl font-black ${nivel.color}`}>{nivel.nombre}</span>
          </div>
        </div>
        <div className="flex-1 w-full">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>{pasadas.length} partidos completados</span>
            {sigNivel && <span>Siguiente nivel: {sigNivel} partidos</span>}
            {!sigNivel && <span className="text-brand-lime font-bold">¡Nivel máximo!</span>}
          </div>
          <div className="w-full bg-black/30 h-3 rounded-full overflow-hidden">
            <div
              className="bg-brand-lime h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(204,255,0,0.5)]"
              style={{ width: `${progresoNivel}%` }}
            />
          </div>
        </div>
      </div>

      {/* STATS RÁPIDAS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Trophy}     label="Partidos jugados"  value={pasadas.length}       color="text-brand-lime"   bg="bg-brand-lime/10" />
        <StatCard icon={Calendar}   label="Próximas reservas" value={proximas.length}      color="text-brand-purple" bg="bg-brand-purple/10" />
        <StatCard icon={MapPin}     label="Pista favorita"    value={instFavorita}         color="text-blue-400"     bg="bg-blue-400/10"  isText />
        <StatCard icon={Target}     label="Total reservas"    value={reservas.length}      color="text-white"        bg="bg-white/10" />
      </div>

      {/* GRÁFICOS */}
      {reservas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <BarChartSimple data={diaData}  label="Reservas por día de la semana" />
          <BarChartSimple data={horaData} label="Reservas por franja horaria" />
          <div className="bg-[#1A1A2E] rounded-3xl p-6 border border-white/5">
            <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
              <TrendingUp size={18} className="text-brand-purple" /> Por tipo de pista
            </h3>
            {tipoData.length > 0 ? (
              <div className="space-y-3">
                {tipoData.map(({ name, value }) => {
                  const pct = pasadas.length > 0 ? Math.round((value / pasadas.length) * 100) : 0;
                  return (
                    <div key={name}>
                      <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                        <span className="font-medium text-white capitalize">{name}</span>
                        <span>{value} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-brand-purple transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Aún no hay datos.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-[#1A1A2E] rounded-3xl p-12 border border-white/5 text-center">
          <BarChart2 size={48} className="mx-auto text-gray-700 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Sin estadísticas aún</h3>
          <p className="text-gray-400 text-sm mb-6">Realiza tu primera reserva para empezar a ver tus datos.</p>
          <Link
            to="/reservar"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-lime text-black rounded-full font-bold text-sm hover:scale-105 transition-all"
          >
            <PlusCircle size={16} /> Hacer mi primera reserva
          </Link>
        </div>
      )}

      {/* LOGROS */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Award className="text-brand-lime" size={22} /> Logros
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {LOGROS.map(logro => (
            <LogroCard
              key={logro.id}
              logro={logro}
              unlocked={pasadas.length >= logro.threshold}
            />
          ))}
        </div>
      </div>

    </div>
  );
}
