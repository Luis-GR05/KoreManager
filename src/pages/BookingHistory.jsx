import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/useAuth';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, CheckCircle, XCircle, PlusCircle, Trash2, Image as ImageIcon, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import { getReservaStatus } from '../lib/reservaStatus';
import { useTranslation } from 'react-i18next';

/**
 * Modal de confirmación para cancelar una reserva.
 * @param {{reserva: any, relatedCount: number, onConfirm: () => void, onCancel: () => void}} props
 * @returns {import('react').JSX.Element}
 */
function ConfirmModal({ reserva, relatedCount, onConfirm, onCancel }) {
  const { t } = useTranslation();
  const isPaid = reserva?.payment_status === 'paid';

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="theme-card border theme-border p-8 max-w-sm w-full mx-4 shadow-2xl animate-in zoom-in-95 duration-200">
        <h3 className="text-xl font-bold theme-text mb-2">{t('history.cancelModal.title')}</h3>
        <p className="theme-faint text-sm mb-6">
          {relatedCount > 0
            ? t('history.cancelModal.linkedSlots', { count: relatedCount })
            : ''}
          {t('history.cancelModal.freeSlot')}
          {isPaid && (
            <span className="text-yellow-600 dark:text-yellow-400 mt-3 block font-bold">
              {t('history.cancelModal.paidNote')}
            </span>
          )}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border theme-border theme-text font-bold hover:bg-brand-purple/5 dark:hover:bg-white/5 transition-colors"
          >
            {t('history.cancelModal.back')}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 font-bold hover:bg-red-500/30 transition-colors"
          >
            {t('history.cancelModal.confirm')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/**
 * Atajo de estado usando duración fija de 60 min.
 * @param {string} fecha
 * @param {string} hora
 * @returns {'upcoming'|'in_progress'|'completed'|'unknown'}
 */
function getStatus(fecha, hora) {
  return getReservaStatus(fecha, hora, 60);
}

/**
 * Timestamp (ms) del inicio de una reserva.
 * @param {{fecha: string, hora: string}} r
 * @returns {number}
 */
function reservaStartMs(r) {
  const d = new Date(`${r.fecha}T${String(r.hora).slice(0, 8)}`);
  return d.getTime();
}

/**
 * Ordena reservas por "cercanía": en curso -> próximas (asc) -> completadas (desc).
 * @param {any} a
 * @param {any} b
 * @returns {number}
 */
function compareReservasByCercania(a, b) {
  const now = Date.now();

  const sa = getStatus(a.fecha, a.hora);
  const sb = getStatus(b.fecha, b.hora);

  const group = (s) => {
    if (s === 'in_progress') return 0;
    if (s === 'upcoming') return 1;
    if (s === 'completed') return 2;
    return 3;
  };

  const ga = group(sa);
  const gb = group(sb);
  if (ga !== gb) return ga - gb;

  const ta = reservaStartMs(a);
  const tb = reservaStartMs(b);

  if (ga === 0 || ga === 1) return ta - tb;

  if (ga === 2) return tb - ta;

  return Math.abs(ta - now) - Math.abs(tb - now);
}

/**
 * Badge visual para el estado de la reserva.
 * @param {{status: string}} props
 * @returns {import('react').JSX.Element}
 */
function StatusBadge({ status }) {
  const { t } = useTranslation();
  if (status === 'upcoming') {
    return (
      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand-purple/15 dark:bg-brand-lime/20 text-brand-purple dark:text-brand-lime border border-brand-purple/25 dark:border-brand-lime/30">
        <Clock size={12} /> {t('history.status.upcoming')}
      </span>
    );
  }
  if (status === 'in_progress') {
    return (
      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
        <Clock size={12} /> {t('history.status.inProgress')}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand-purple/10 dark:bg-brand-lime/10 text-brand-purple dark:text-brand-lime border border-brand-purple/20 dark:border-brand-lime/20">
      <CheckCircle size={12} /> {t('history.status.completed')}
    </span>
  );
}

/**
 * Página de historial de reservas del usuario con filtros y cancelación.
 * @returns {import('react').JSX.Element}
 */
export default function BookingHistory() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todas');
  const [confirmId, setConfirmId] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const fetchReservas = async () => {
      const { data: linked } = await supabase
        .from('reservas')
        .select('id, currency')
        .eq('user_id', user.id)
        .eq('payment_status', 'pending')
        .eq('precio_cents', 0)
        .like('currency', 'linked_%');

      if (linked && linked.length > 0) {
        const parentIds = [...new Set(linked.map(r => r.currency.replace('linked_', '')))];
        const { data: parents } = await supabase
          .from('reservas')
          .select('id, payment_status')
          .in('id', parentIds);

        if (parents) {
          const paidParents = parents.filter(p => p.payment_status === 'paid').map(p => String(p.id));
          const failedParents = parents.filter(p => p.payment_status === 'cancelled' || p.payment_status === 'failed').map(p => String(p.id));

          for (const l of linked) {
            const pid = String(l.currency.replace('linked_', ''));
            if (paidParents.includes(pid)) {
              await supabase.from('reservas').update({ payment_status: 'paid' }).eq('id', l.id);
            } else if (failedParents.includes(pid)) {
              await supabase.from('reservas').update({ payment_status: 'cancelled' }).eq('id', l.id);
            }
          }
        }
      }

      const tresHorasAtras = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
      await supabase.from('reservas')
        .delete()
        .eq('payment_status', 'pending')
        .lt('created_at', tresHorasAtras);

      const { data, error } = await supabase
        .from('reservas')
        .select(`id, fecha, hora, payment_status, currency, precio_cents, instalaciones ( nombre, tipo )`)
        .eq('user_id', user.id)
        .order('fecha', { ascending: true })
        .order('hora', { ascending: true });

      if (error) {
        toast.error(t('history.errorLoad'));
      } else {
        setReservas(data || []);
      }
      setLoading(false);
    };

    fetchReservas();
  }, [user?.id]);

  const handleCancel = async () => {
    if (!confirmId) return;
    setCancelling(true);

    const reservaToCancel = reservas.find(r => r.id === confirmId);
    let idsToDelete = [confirmId];

    if (reservaToCancel && !reservaToCancel.currency?.startsWith('linked_')) {
      const children = reservas.filter(r => r.currency === `linked_${confirmId}`);
      idsToDelete = [...idsToDelete, ...children.map(c => c.id)];
    }

    const { error } = await supabase
      .from('reservas')
      .delete()
      .in('id', idsToDelete);

    if (error) {
      toast.error(t('history.errorCancel'));
    } else {
      toast.success(idsToDelete.length > 1 ? t('history.cancelSuccessMulti') : t('history.cancelSuccess'));
      setReservas(prev => prev.filter(r => !idsToDelete.includes(r.id)));
    }

    setConfirmId(null);
    setCancelling(false);
  };

  const groupedReservas = [];
  const map = new Map();

  for (const r of reservas) {
    if (r.payment_status === 'pending') {
      const matchStart = new Date(`${r.fecha}T${r.hora}`);
      const created = new Date(r.created_at || Date.now());
      const minsSinceCreated = (Date.now() - created.getTime()) / 60000;
      const hoursToMatch = (matchStart.getTime() - Date.now()) / 3600000;

      if (hoursToMatch < 3 && minsSinceCreated > 15) {
        supabase.from('reservas').delete().eq('id', r.id).then(() => { });
        continue;
      }
    }

    if (r.currency?.startsWith('linked_')) {
      const parentId = Number(r.currency.split('_')[1]);
      if (!map.has(parentId)) map.set(parentId, { children: [] });
      map.get(parentId).children.push(r);
    } else if (r.currency === 'eur') {
      if (!map.has(r.id)) map.set(r.id, { children: [] });
      map.get(r.id).parent = r;
    } else {
      groupedReservas.push({ ...r, isGroup: false, franjas: [r.hora] });
    }
  }

  for (const group of map.values()) {
    if (group.parent) {
      const allSlots = [group.parent, ...group.children].sort((a, b) => a.hora.localeCompare(b.hora));
      groupedReservas.push({
        ...group.parent,
        isGroup: group.children.length > 0,
        franjas: allSlots.map(s => s.hora)
      });
    } else {
      for (const c of group.children) {
        groupedReservas.push({ ...c, isGroup: false, franjas: [c.hora] });
      }
    }
  }

  const reservasFiltradas = groupedReservas
    .filter(r => {
      const status = getStatus(r.fecha, r.hora);
      if (filtro === 'proximas') return status === 'upcoming' || status === 'in_progress';
      if (filtro === 'pasadas') return status === 'completed';
      return true;
    })
    .sort(compareReservasByCercania);

  const proximas = groupedReservas.filter(r => {
    const s = getStatus(r.fecha, r.hora);
    return s === 'upcoming' || s === 'in_progress';
  }).length;
  const pasadas = groupedReservas.filter(r => getStatus(r.fecha, r.hora) === 'completed').length;

  return (
    <>
      {/* Modal */}
      {confirmId && (
        <ConfirmModal
          reserva={reservas.find(r => r.id === confirmId)}
          relatedCount={reservas.filter(r => r.currency === `linked_${confirmId}`).length}
          onConfirm={handleCancel}
          onCancel={() => setConfirmId(null)}
        />
      )}

      <div className="max-w-5xl mx-auto space-y-6">

        {/* Cabecera */}
        <header className="relative overflow-hidden theme-card p-6 md:p-8 anim-shine border-none bg-gradient-to-br from-brand-lime/10 via-transparent to-brand-purple/10">
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-brand-lime/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-brand-purple/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-start gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-black theme-text tracking-tight">
                  {t('history.title')} <span className="text-brand-purple dark:text-brand-lime">{t('history.titleHighlight')}</span>
                </h1>
                <p className="theme-faint text-sm mt-1">
                  {t('history.subtitle')}
                </p>
              </div>
            </div>
            <Link
              to="/reservar"
              className="flex items-center gap-2 px-5 py-3 bg-brand-purple dark:bg-brand-lime text-white dark:text-black rounded-2xl font-black text-sm hover:scale-[1.02] active:scale-[0.99] transition-all shadow-lg"
            >
              <PlusCircle size={18} /> {t('history.newBooking')}
            </Link>
          </div>
        </header>

        {/* Stats rápidas */}
        {!loading && groupedReservas.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: t('history.stats.total'), value: groupedReservas.length, color: 'theme-text', bg: 'theme-card' },
              { label: t('history.stats.upcoming'), value: proximas, color: 'text-brand-purple dark:text-brand-lime', bg: 'bg-brand-purple/10 dark:bg-brand-lime/10' },
              { label: t('history.stats.past'), value: pasadas, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10 dark:bg-blue-400/10' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className={`${bg} rounded-3xl p-5 text-center border theme-border hover:border-brand-purple dark:hover:border-brand-lime transition-colors shadow-sm`}>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs theme-faint font-bold uppercase tracking-wider mt-1">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filtros */}
        {!loading && groupedReservas.length > 0 && (
          <div className="flex gap-2 theme-card p-1 w-fit">
            {[
              { id: 'todas', label: t('history.filters.all') },
              { id: 'proximas', label: t('history.filters.upcoming') },
              { id: 'pasadas', label: t('history.filters.past') },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setFiltro(id)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filtro === id
                    ? 'bg-brand-purple dark:bg-brand-lime text-white dark:text-black shadow-sm'
                    : 'theme-faint hover:theme-text'
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
            <p className="text-brand-lime animate-pulse">{t('history.loading')}</p>
          </div>
        ) : reservasFiltradas.length === 0 ? (
          <div className="text-center py-16 theme-card">
            <Calendar size={48} className="mx-auto theme-faint mb-4" />
            {groupedReservas.length === 0 ? (
              <>
                <h3 className="text-xl theme-text font-bold mb-2">{t('history.empty.noBookings')}</h3>
                <p className="theme-faint text-sm mb-6">{t('history.empty.noBookingsDesc')}</p>
                <Link
                  to="/reservar"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-brand-purple dark:bg-brand-lime text-white dark:text-black rounded-full font-bold text-sm hover:scale-105 transition-all shadow-lg"
                >
                  <PlusCircle size={16} /> {t('history.empty.firstBooking')}
                </Link>
              </>
            ) : (
              <>
                <h3 className="text-xl theme-text font-bold mb-2">{t('history.empty.noResults')}</h3>
                <p className="theme-faint text-sm">{t('history.empty.noResultsDesc')}</p>
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
                  className={`theme-card border rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all duration-200 ${isUpcoming
                      ? 'border-brand-purple/30 dark:border-brand-lime/20 hover:border-brand-purple dark:hover:border-brand-lime/40'
                      : 'theme-border opacity-75 hover:opacity-100'
                    }`}
                >
                  {/* Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-base font-bold theme-text">
                        {reserva.instalaciones?.nombre || t('history.sport')}
                      </h3>
                      <StatusBadge status={status} />
                      <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${reserva.payment_status === 'paid'
                          ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
                          : reserva.payment_status === 'pending'
                            ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20'
                            : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                        }`}>
                        <CreditCard size={12} />
                        {reserva.payment_status === 'paid'
                          ? t('history.status.paid')
                          : reserva.payment_status === 'pending'
                            ? t('history.status.pending')
                            : t('history.status.cancelled')}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm theme-faint">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-brand-purple dark:text-brand-lime" />
                        {new Date(reserva.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
                          weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock size={14} className="text-brand-purple dark:text-brand-lime" />
                        {reserva.franjas.map(h => h.slice(0, 5)).join(', ')}h
                      </span>
                      {reserva.instalaciones?.tipo && (
                        <span className="flex items-center gap-1.5">
                          <MapPin size={14} className="theme-faint" />
                          {reserva.instalaciones.tipo}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Acción */}
                  <div className="flex gap-2 shrink-0">
                    {reserva.payment_status === 'pending' && !reserva.currency?.startsWith('linked_') && (
                      <Link
                        to={`/checkout/${reserva.id}`}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white dark:text-black bg-brand-purple dark:bg-brand-lime hover:opacity-90 transition-opacity"
                      >
                        <CreditCard size={15} /> {t('history.pay')}
                      </Link>
                    )}
                    {isUpcoming && (
                      <button
                        onClick={() => setConfirmId(reserva.id)}
                        disabled={cancelling}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-red-400 border border-red-500/20 bg-red-500/5 hover:bg-red-500/15 transition-colors disabled:opacity-40"
                      >
                        <Trash2 size={15} /> {t('history.cancel')}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </>
  );
}