// src/pages/BookingHistory.jsx
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/useAuth';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, CheckCircle, XCircle, PlusCircle, Trash2, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { getReservaStatus } from '../lib/reservaStatus';

// ─── Modal de confirmación (reemplaza el confirm() nativo) ──────────────────
function ConfirmModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1A1A2E] border border-white/10 rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl">
        <h3 className="text-xl font-bold text-white mb-2">¿Cancelar reserva?</h3>
        <p className="text-gray-400 text-sm mb-6">
          Esta acción no se puede deshacer. La franja horaria quedará libre para otros usuarios.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-white/10 text-gray-300 font-bold hover:bg-white/5 transition-colors"
          >
            Volver
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 font-bold hover:bg-red-500/30 transition-colors"
          >
            Sí, cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getStatus(fecha, hora) {
  return getReservaStatus(fecha, hora, 60);
}

function reservaStartMs(r) {
  const d = new Date(`${r.fecha}T${String(r.hora).slice(0, 8)}`);
  return d.getTime();
}

function compareReservasByCercania(a, b) {
  const now = Date.now();

  const sa = getStatus(a.fecha, a.hora);
  const sb = getStatus(b.fecha, b.hora);

  const group = (s) => {
    if (s === 'in_progress') return 0; // lo más cercano/urgente
    if (s === 'upcoming') return 1;
    if (s === 'completed') return 2;
    return 3;
  };

  const ga = group(sa);
  const gb = group(sb);
  if (ga !== gb) return ga - gb;

  const ta = reservaStartMs(a);
  const tb = reservaStartMs(b);

  // En próximas/en curso: más cercano primero (asc)
  if (ga === 0 || ga === 1) return ta - tb;

  // En completadas: más reciente primero (desc) => más "cercana" al presente
  if (ga === 2) return tb - ta;

  // fallback: ordenar por cercanía absoluta a ahora
  return Math.abs(ta - now) - Math.abs(tb - now);
}

function StatusBadge({ status }) {
  if (status === 'upcoming') {
    return (
      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand-lime/20 text-brand-lime border border-brand-lime/30">
        <Clock size={12} /> Próxima
      </span>
    );
  }
  if (status === 'in_progress') {
    return (
      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-300 border border-blue-400/25">
        <Clock size={12} /> En curso
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand-purple/20 text-brand-purple border border-brand-purple/30">
      <CheckCircle size={12} /> Completada
    </span>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────
export default function BookingHistory() {
  const { user } = useAuth();

  const [reservas, setReservas]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filtro, setFiltro]           = useState('todas'); // 'todas' | 'proximas' | 'pasadas'
  const [confirmId, setConfirmId]     = useState(null);   // id de la reserva a cancelar
  const [cancelling, setCancelling]   = useState(false);

  // ── Carga todas las reservas del usuario ──────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;

    const fetchReservas = async () => {
      const { data, error } = await supabase
        .from('reservas')
        .select(`id, fecha, hora, instalaciones ( nombre, tipo )`)
        .eq('user_id', user.id)
        .order('fecha', { ascending: true })
        .order('hora',  { ascending: true });

      if (error) {
        toast.error('No se pudieron cargar las reservas.');
      } else {
        setReservas(data || []);
      }
      setLoading(false);
    };

    fetchReservas();
  }, [user?.id]);

  // ── Cancelar reserva ─────────────────────────────────────────────────────
  const handleCancel = async () => {
    if (!confirmId) return;
    setCancelling(true);

    const { error } = await supabase
      .from('reservas')
      .delete()
      .eq('id', confirmId);

    if (error) {
      toast.error('Error al cancelar la reserva.');
    } else {
      toast.success('Reserva cancelada correctamente.');
      setReservas(prev => prev.filter(r => r.id !== confirmId));
    }

    setConfirmId(null);
    setCancelling(false);
  };

  // ── Filtrado ─────────────────────────────────────────────────────────────
  const reservasFiltradas = reservas
    .filter(r => {
    const status = getStatus(r.fecha, r.hora);
    if (filtro === 'proximas') return status === 'upcoming' || status === 'in_progress';
    if (filtro === 'pasadas')  return status === 'completed';
    return true;
    })
    .slice()
    .sort(compareReservasByCercania);

  const proximas = reservas.filter(r => {
    const s = getStatus(r.fecha, r.hora);
    return s === 'upcoming' || s === 'in_progress';
  }).length;
  const pasadas  = reservas.filter(r => getStatus(r.fecha, r.hora) === 'completed').length;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Modal */}
      {confirmId && (
        <ConfirmModal
          onConfirm={handleCancel}
          onCancel={() => setConfirmId(null)}
        />
      )}

      <div className="max-w-5xl mx-auto space-y-6">

        {/* Cabecera */}
        <header className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-brand-lime/10 via-white/0 to-brand-purple/10 p-6 md:p-8 anim-shine">
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-brand-lime/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-brand-purple/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400">
                <ImageIcon size={18} />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                  Mis <span className="text-brand-lime">Reservas</span>
                </h1>
                <p className="text-gray-400 text-sm mt-1">
                  Historial completo de tus reservas en las instalaciones.
                </p>
              </div>
            </div>
            <Link
              to="/reservar"
              className="flex items-center gap-2 px-5 py-3 bg-brand-lime text-black rounded-2xl font-black text-sm hover:scale-[1.02] active:scale-[0.99] transition-all shadow-[0_0_18px_rgba(204,255,0,0.22)]"
            >
              <PlusCircle size={18} /> Nueva reserva
            </Link>
          </div>
        </header>

        {/* Stats rápidas */}
        {!loading && reservas.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Total',    value: reservas.length, color: 'text-white',        bg: 'bg-white/5' },
              { label: 'Próximas', value: proximas,        color: 'text-brand-lime',   bg: 'bg-brand-lime/10' },
              { label: 'Pasadas',  value: pasadas,         color: 'text-brand-purple', bg: 'bg-brand-purple/10' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className={`${bg} rounded-3xl p-5 text-center border border-white/5 hover:border-white/10 transition-colors`}>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filtros */}
        {!loading && reservas.length > 0 && (
          <div className="flex gap-2 bg-[#1A1A2E] p-1 rounded-2xl border border-white/5 w-fit">
            {[
              { id: 'todas',    label: 'Todas' },
              { id: 'proximas', label: 'Próximas' },
              { id: 'pasadas',  label: 'Pasadas' },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setFiltro(id)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  filtro === id
                    ? 'bg-brand-lime text-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Contenido */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <p className="text-brand-lime animate-pulse">Cargando reservas...</p>
          </div>
        ) : reservasFiltradas.length === 0 ? (
          <div className="text-center py-16 bg-[#1A1A2E] border border-white/5 rounded-3xl">
            <Calendar size={48} className="mx-auto text-gray-600 mb-4" />
            {reservas.length === 0 ? (
              <>
                <h3 className="text-xl text-white font-bold mb-2">Aún no tienes reservas</h3>
                <p className="text-gray-400 text-sm mb-6">Reserva una pista y empieza a jugar.</p>
                <Link
                  to="/reservar"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-brand-lime text-black rounded-full font-bold text-sm hover:scale-105 transition-all"
                >
                  <PlusCircle size={16} /> Hacer mi primera reserva
                </Link>
              </>
            ) : (
              <>
                <h3 className="text-xl text-white font-bold mb-2">Sin resultados</h3>
                <p className="text-gray-400 text-sm">No hay reservas en este filtro.</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {reservasFiltradas.map((reserva) => {
              const status = getStatus(reserva.fecha, reserva.hora);
              const isUpcoming = status === 'upcoming';

              return (
                <div
                  key={reserva.id}
                  className={`bg-[#1A1A2E] border rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all duration-200 ${
                    isUpcoming
                      ? 'border-brand-lime/20 hover:border-brand-lime/40'
                      : 'border-white/5 hover:border-white/10 opacity-75 hover:opacity-100'
                  }`}
                >
                  {/* Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-base font-bold text-white">
                        {reserva.instalaciones?.nombre || 'Pista Deportiva'}
                      </h3>
                      <StatusBadge status={status} />
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-brand-lime" />
                        {new Date(reserva.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
                          weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock size={14} className="text-brand-purple" />
                        {reserva.hora?.slice(0, 5)}h
                      </span>
                      {reserva.instalaciones?.tipo && (
                        <span className="flex items-center gap-1.5">
                          <MapPin size={14} className="text-gray-500" />
                          {reserva.instalaciones.tipo}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Acción */}
                  {isUpcoming && (
                    <button
                      onClick={() => setConfirmId(reserva.id)}
                      disabled={cancelling}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-red-400 border border-red-500/20 bg-red-500/5 hover:bg-red-500/15 transition-colors disabled:opacity-40 shrink-0"
                    >
                      <Trash2 size={15} /> Cancelar
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>
    </>
  );
}