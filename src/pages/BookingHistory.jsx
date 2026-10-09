import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/useAuth';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, CheckCircle, PlusCircle, Trash2, CreditCard, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { getReservaStatus } from '../lib/reservaStatus';
import { useTranslation } from 'react-i18next';
import BrandLoader from '../components/feedback/BrandLoader';
import { cancelReserva, cancelErrorMessage, formatEuros, groupReservas, slotStartMs } from '../lib/bookings';

/** Horas mínimas para cancelar con reembolso (igual que CANCEL_MIN_HOURS en la edge function). */
const REFUND_MIN_HOURS = 24;

/**
 * Modal de confirmación para cancelar una reserva.
 * @param {{reserva: any, relatedCount: number, onConfirm: () => void, onCancel: () => void}} props
 * @returns {import('react').JSX.Element}
 */
function ConfirmModal({ reserva, relatedCount, busy, onConfirm, onCancel }) {
  const { t } = useTranslation();
  const isPaid = reserva?.payment_status === 'paid';
  const [openedAt] = useState(() => Date.now());
  const hoursLeft = reserva ? (slotStartMs(reserva.fecha, reserva.hora) - openedAt) / 3_600_000 : 0;
  const refundable = isPaid && hoursLeft >= REFUND_MIN_HOURS;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-labelledby="cancel-title">
      <div className="theme-card border theme-border p-8 max-w-sm w-full mx-4 shadow-2xl animate-in zoom-in-95 duration-200">
        <h3 id="cancel-title" className="text-xl font-bold theme-text mb-2">{t('history.cancelModal.title')}</h3>
        <p className="theme-muted text-sm mb-6">
          {relatedCount > 0
            ? t('history.cancelModal.linkedSlots', { count: relatedCount })
            : ''}
          {t('history.cancelModal.freeSlot')}
          {isPaid && (
            <span className={`mt-3 block font-bold ${refundable ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {refundable
                ? t('history.cancelModal.refundNote', { amount: formatEuros(reserva.precio_cents) })
                : t('history.cancelModal.noRefundNote', { hours: REFUND_MIN_HOURS })}
            </span>
          )}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={busy}
            className="flex-1 py-3 rounded-xl border theme-border theme-text font-bold hover:bg-brand-purple/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            {t('history.cancelModal.back')}
          </button>
          <button
            onClick={onConfirm}
            disabled={busy || (isPaid && !refundable)}
            className="flex-1 py-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400 font-bold hover:bg-red-500/25 transition-colors disabled:opacity-40"
          >
            {busy ? t('history.cancelling') : t('history.cancelModal.confirm')}
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
  return slotStartMs(r.fecha, r.hora);
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

/** Estilo del badge de pago según `payment_status`. */
const PAY_BADGE = {
  paid: { key: 'paid', cls: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20' },
  pending: { key: 'pending', cls: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20' },
  refunded: { key: 'refunded', icon: 'refund', cls: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20' },
  failed: { key: 'failed', cls: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20' },
  cancelled: { key: 'cancelled', cls: 'bg-zinc-500/10 theme-muted border-zinc-500/20' },
};

/**
 * Página de historial de reservas del usuario con filtros y cancelación.
 * @returns {import('react').JSX.Element}
 */
export default function BookingHistory() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();

  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todas');
  const [confirmId, setConfirmId] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let alive = true;

    (async () => {
      // Marca como canceladas las pendientes que ya caducaron (en el servidor)
      await supabase.rpc('expire_pending_reservas').then(() => {}, () => {});
      const { data, error } = await supabase
        .from('reservas')
        .select('id, fecha, hora, payment_status, currency, precio_cents, created_at, instalaciones ( nombre, tipo )')
        .eq('user_id', user.id)
        .order('fecha', { ascending: true })
        .order('hora', { ascending: true });
      if (!alive) return;
      if (error) toast.error(t('history.errorLoad'));
      else setReservas(data || []);
      setLoading(false);
    })();

    return () => { alive = false; };
  }, [user?.id, t]);

  const handleCancel = async () => {
    const target = groupedReservas.find((r) => r.id === confirmId);
    if (!target) return;
    setCancelling(true);
    try {
      const result = await cancelReserva(target);
      const newStatus = result === 'refunded' ? 'refunded' : 'cancelled';
      setReservas((prev) => prev.map((r) =>
        r.id === target.id || r.currency === `linked_${target.id}` ? { ...r, payment_status: newStatus } : r));
      toast.success(result === 'refunded' ? t('history.refundSuccess') : t('history.cancelSuccess'));
      setConfirmId(null);
    } catch (err) {
      toast.error(cancelErrorMessage(err, t));
    } finally {
      setCancelling(false);
    }
  };

  const isActive = (r) => r.payment_status === 'pending' || r.payment_status === 'paid';
  const groupedReservas = groupReservas(reservas);

  const reservasFiltradas = groupedReservas
    .filter(r => {
      const status = getStatus(r.fecha, r.hora);
      if (filtro === 'proximas') return isActive(r) && (status === 'upcoming' || status === 'in_progress');
      if (filtro === 'pasadas') return status === 'completed' || !isActive(r);
      return true;
    })
    .sort(compareReservasByCercania);

  const proximas = groupedReservas.filter(r => {
    const s = getStatus(r.fecha, r.hora);
    return isActive(r) && (s === 'upcoming' || s === 'in_progress');
  }).length;
  const pasadas = groupedReservas.filter(r => getStatus(r.fecha, r.hora) === 'completed').length;

  return (
    <>
      {/* Modal */}
      {confirmId && (
        <ConfirmModal
          reserva={groupedReservas.find(r => r.id === confirmId)}
          relatedCount={reservas.filter(r => r.currency === `linked_${confirmId}`).length}
          busy={cancelling}
          onConfirm={handleCancel}
          onCancel={() => setConfirmId(null)}
        />
      )}

      <div className="max-w-7xl mx-auto space-y-6 bg-cueva-gradient -m-6 p-6 md:-m-8 md:p-8 rounded-[3rem]">

        {/* Cabecera */}
        <header className="relative overflow-hidden theme-card p-6 md:p-8 anim-shine border-none bg-gradient-to-br from-brand-lime/25 via-transparent to-brand-purple/25 shadow-2xl">
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-brand-lime/20 rounded-full blur-3xl pointer-events-none anim-floaty" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-brand-purple/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-start gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-black theme-text tracking-tight">
                  {t('history.title')} <span className="text-brand-purple dark:text-brand-lime">{t('history.titleHighlight')}</span>
                </h1>
                <p className="theme-muted text-sm mt-1">
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
              { 
                label: t('history.stats.total'), 
                value: groupedReservas.length, 
                color: 'theme-text', 
                border: 'theme-border hover:border-brand-purple dark:hover:border-brand-lime',
                shadow: 'glow-purple'
              },
              { 
                label: t('history.stats.upcoming'), 
                value: proximas, 
                color: 'text-brand-purple dark:text-brand-lime', 
                border: 'border-brand-purple/20 dark:border-brand-lime/20 hover:border-brand-purple dark:hover:border-brand-lime',
                shadow: 'shadow-brand-purple/5 dark:shadow-brand-lime/10'
              },
              { 
                label: t('history.stats.past'), 
                value: pasadas, 
                color: 'text-blue-600 dark:text-blue-400', 
                border: 'border-blue-500/20 dark:border-blue-400/20 hover:border-blue-500 dark:hover:border-blue-400',
                shadow: 'shadow-blue-500/5'
              },
            ].map(({ label, value, color, border, shadow }) => (
              <div 
                key={label} 
                className={`theme-card rounded-3xl p-5 text-center border ${border} transition-all duration-300 shadow-xl ${shadow} hover:scale-[1.02] cursor-default`}
              >
                <p className={`text-3xl font-black ${color} tracking-tight`}>{value}</p>
                <p className="text-[10px] theme-muted font-extrabold uppercase tracking-widest mt-1.5">{label}</p>
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
                    : 'theme-muted hover:theme-text'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Contenido */}
        {loading ? (
          <BrandLoader fullscreen={false} label={t('history.loading')} />
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
              const active = isActive(reserva);
              const isUpcoming = status === 'upcoming' && active;
              const pay = PAY_BADGE[reserva.payment_status] ?? PAY_BADGE.cancelled;

              return (
                <div
                  key={reserva.id}
                  className={`theme-card border rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all duration-300 ${isUpcoming
                      ? 'border-brand-purple/40 dark:border-brand-lime/30 hover:border-brand-purple dark:hover:border-brand-lime/60 shadow-xl glow-purple hover:scale-[1.01]'
                      : 'theme-border opacity-90 hover:opacity-100 hover:shadow-lg'
                    }`}
                >
                  {/* Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-base font-bold theme-text">
                        {reserva.instalaciones?.nombre || t('history.sport')}
                      </h3>
                      {active && <StatusBadge status={status} />}
                      <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${pay.cls}`}>
                        {pay.icon === 'refund' ? <RotateCcw size={12} /> : <CreditCard size={12} />}
                        {t(`history.status.${pay.key}`)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm theme-muted">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-brand-purple dark:text-brand-lime" />
                        {new Date(reserva.fecha + 'T00:00:00').toLocaleDateString(i18n.language, {
                          weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock size={14} className="text-brand-purple dark:text-brand-lime" />
                        {reserva.franjas.join(', ')}h
                      </span>
                      <span className="flex items-center gap-1.5 font-bold theme-text tabular-nums">
                        {formatEuros(reserva.precio_cents, i18n.language)}
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
                    {reserva.payment_status === 'pending' && isUpcoming && (
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