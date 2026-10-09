import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  AlertCircle, CalendarDays, CheckCircle, Clock, CreditCard, Minus, Package, Plus, Sun, Sunset, Trash2,
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/useAuth';
import DatePicker from '../components/ui/DatePicker';
import BrandLoader from '../components/feedback/BrandLoader';
import { describeSport } from '../lib/sports';
import {
  MAX_DAYS_AHEAD, MAX_SLOTS, MIN_LEAD_HOURS, TIME_SLOTS, addDaysIso, cancelReserva, cancelErrorMessage,
  formatEuros, localIsoDate, pricePerSlot, slotStartMs,
} from '../lib/bookings';

const STRIP_DAYS = 14;

/**
 * Modal de confirmación de la reserva.
 * @param {{ summary: { court: string, dateLabel: string, slots: string[], total: string }, busy: boolean, onConfirm: () => void, onCancel: () => void }} props
 */
function ConfirmBookingModal({ summary, busy, onConfirm, onCancel }) {
  const { t } = useTranslation();

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !busy) onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onCancel]);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-booking-title">
      <div className="theme-card border theme-border p-7 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="w-14 h-14 bg-brand-purple/15 dark:bg-brand-lime/15 rounded-2xl flex items-center justify-center mb-5 mx-auto">
          <CalendarDays className="text-brand-purple dark:text-brand-lime" size={28} />
        </div>
        <h2 id="confirm-booking-title" className="text-xl font-black theme-text text-center">{t('booking.confirmTitle')}</h2>
        <dl className="mt-5 space-y-2 text-sm">
          <div className="flex justify-between gap-4"><dt className="theme-faint">{t('booking.court')}</dt><dd className="font-bold theme-text text-right">{summary.court}</dd></div>
          <div className="flex justify-between gap-4"><dt className="theme-faint">{t('booking.date')}</dt><dd className="font-bold theme-text text-right capitalize">{summary.dateLabel}</dd></div>
          <div className="flex justify-between gap-4"><dt className="theme-faint">{t('booking.hours')}</dt><dd className="font-bold theme-text text-right tabular-nums">{summary.slots.join(' · ')}</dd></div>
          <div className="flex justify-between gap-4 pt-3 mt-3 border-t theme-border"><dt className="font-bold theme-text">{t('booking.totalToPay')}</dt><dd className="text-xl font-black text-brand-purple dark:text-brand-lime tabular-nums">{summary.total}</dd></div>
        </dl>
        <p className="mt-4 text-xs theme-faint">{t('booking.confirmNote')}</p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="flex-1 py-3 rounded-xl border theme-border theme-text font-bold hover:bg-brand-purple/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            {t('booking.cancelBtn')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 py-3 rounded-xl bg-brand-purple dark:bg-brand-lime text-white dark:text-black font-black hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <CheckCircle size={16} /> {busy ? t('booking.errors.confirming') : t('booking.confirmBtn')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/**
 * Aviso cuando el usuario ya tiene una reserva sin pagar: puede pagarla o
 * cancelarla desde aquí mismo.
 */
function PendingBookingNotice({ booking, onCancelled }) {
  const { t, i18n } = useTranslation();
  const [busy, setBusy] = useState(false);
  const dateLabel = new Date(`${booking.fecha}T00:00:00`).toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' });

  const cancel = async () => {
    setBusy(true);
    try {
      await cancelReserva(booking);
      toast.success(t('history.cancelSuccess'));
      onCancelled();
    } catch (err) {
      toast.error(cancelErrorMessage(err, t));
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-500">
      <div className="theme-card border border-amber-500/30 p-8 md:p-10 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-amber-400/15 blur-3xl pointer-events-none" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">
            <AlertCircle size={14} /> {t('booking.pendingBadge')}
          </span>
          <h1 className="mt-4 text-2xl md:text-3xl font-black theme-text">{t('booking.pendingTitle')}</h1>
          <p className="mt-2 theme-faint">{t('booking.pendingDesc', { hours: MIN_LEAD_HOURS })}</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3 text-sm">
            <div className="rounded-2xl theme-bg border theme-border p-4">
              <p className="text-[11px] uppercase tracking-wider font-bold theme-faint">{t('booking.court')}</p>
              <p className="mt-1 font-bold theme-text">{booking.instalaciones?.nombre ?? '—'}</p>
            </div>
            <div className="rounded-2xl theme-bg border theme-border p-4">
              <p className="text-[11px] uppercase tracking-wider font-bold theme-faint">{t('booking.date')}</p>
              <p className="mt-1 font-bold theme-text capitalize">{dateLabel}</p>
            </div>
            <div className="rounded-2xl theme-bg border theme-border p-4">
              <p className="text-[11px] uppercase tracking-wider font-bold theme-faint">{t('booking.totalToPay')}</p>
              <p className="mt-1 font-black theme-text tabular-nums">{formatEuros(booking.precio_cents, i18n.language)}</p>
            </div>
          </div>
          <p className="mt-4 text-xs theme-faint">{t('booking.pendingWarning')}</p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to={`/checkout/${booking.id}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-purple dark:bg-brand-lime text-white dark:text-black font-black hover:opacity-90 transition-opacity"
            >
              <CreditCard size={16} /> {t('booking.payNow')}
            </Link>
            <button
              type="button"
              onClick={cancel}
              disabled={busy}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-red-500/30 text-red-600 dark:text-red-400 font-bold hover:bg-red-500/10 transition-colors disabled:opacity-50"
            >
              <Trash2 size={16} /> {t('booking.cancelPending')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Página de nueva reserva:
 * 1. Deporte y pista (las crea el administrador; nada está fijo).
 * 2. Día (tira de 14 días + selector para más adelante).
 * 3. Franjas (mañana / tarde) con disponibilidad en tiempo real.
 * 4. Material opcional.
 * La reserva se crea de forma atómica en el servidor (`create_booking`) y el
 * precio lo calcula la base de datos.
 */
export default function NewBooking() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'es';

  const today = localIsoDate();
  const maxDate = addDaysIso(today, MAX_DAYS_AHEAD);

  const [instalaciones, setInstalaciones] = useState(null);
  const [sport, setSport] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [date, setDate] = useState(today);
  const [occupied, setOccupied] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [materialReq, setMaterialReq] = useState({});
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pending, setPending] = useState(undefined); // undefined = comprobando
  const [now, setNow] = useState(() => Date.now());

  // Reloj para que las franjas se cierren solas si la página queda abierta
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const userId = user?.id;
  const loadPending = useCallback(async () => {
    if (!userId) return;
    await supabase.rpc('expire_pending_reservas').then(() => {}, () => {});
    const { data } = await supabase
      .from('reservas')
      .select('id, fecha, hora, currency, precio_cents, payment_status, instalaciones(nombre)')
      .eq('user_id', userId)
      .eq('payment_status', 'pending')
      .eq('currency', 'eur')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setPending(data ?? null);
  }, [userId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial asíncrona
    loadPending();
  }, [loadPending]);

  useEffect(() => {
    let alive = true;
    supabase
      .from('instalaciones')
      .select('*')
      .order('tipo')
      .order('nombre')
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) toast.error(t('booking.errors.loadCourts'));
        const list = data ?? [];
        setInstalaciones(list);
        const first = list.find((i) => (i.estado ?? 'disponible') === 'disponible') ?? list[0];
        if (first) setSelectedId(first.id);
      });
    return () => { alive = false; };
  }, [t]);

  const selected = useMemo(
    () => instalaciones?.find((i) => i.id === selectedId) ?? null,
    [instalaciones, selectedId],
  );
  const bookable = (selected?.estado ?? 'disponible') === 'disponible';

  const sports = useMemo(() => {
    const seen = new Map();
    for (const i of instalaciones ?? []) {
      const tipo = String(i.tipo ?? '').toLowerCase();
      if (!seen.has(tipo)) seen.set(tipo, describeSport({ tipo }, t));
    }
    return [...seen.values()];
  }, [instalaciones, t]);

  const visibleCourts = useMemo(
    () => (instalaciones ?? []).filter((i) => sport === 'all' || String(i.tipo).toLowerCase() === sport),
    [instalaciones, sport],
  );

  // Franjas ocupadas
  const refreshOccupied = useCallback(async () => {
    if (!selectedId) return;
    setLoadingSlots(true);
    const { data, error } = await supabase.rpc('get_occupied_slots', { inst_id: selectedId, date_in: date });
    setOccupied(error ? [] : (data ?? []).map((r) => String(r.hora).slice(0, 5)));
    setLoadingSlots(false);
  }, [selectedId, date]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza con el servidor
    refreshOccupied();
  }, [refreshOccupied]);

  // Material según el tipo de pista
  const tipoSel = String(selected?.tipo ?? '').toLowerCase();
  useEffect(() => {
    if (!tipoSel) return;
    let alive = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- indicador de carga
    setLoadingInventory(true);
    supabase
      .from('inventario')
      .select('id, nombre, cantidad, tipo_pista')
      .eq('tipo_pista', tipoSel)
      .order('nombre')
      .then(({ data }) => {
        if (!alive) return;
        setInventory(data ?? []);
        setLoadingInventory(false);
      });
    return () => { alive = false; };
  }, [tipoSel]);

  const selectCourt = (id) => {
    setSelectedId(id);
    setSelectedSlots([]);
    setMaterialReq({});
  };
  const selectDate = (iso) => {
    if (!iso || iso < today || iso > maxDate) return;
    setDate(iso);
    setSelectedSlots([]);
  };

  const slotState = (time) => {
    if (occupied.includes(time)) return 'occupied';
    const start = slotStartMs(date, time);
    if (start <= now) return 'past';
    if (start <= now + MIN_LEAD_HOURS * 3_600_000) return 'soon';
    return 'free';
  };

  const toggleSlot = (time) => {
    if (!bookable || slotState(time) !== 'free') return;
    setSelectedSlots((prev) => {
      if (prev.includes(time)) return prev.filter((x) => x !== time);
      if (prev.length >= MAX_SLOTS) {
        toast.error(t('booking.errors.maxSlots', { max: MAX_SLOTS }));
        return prev;
      }
      return [...prev, time].sort();
    });
  };

  const setReqQty = (id, qty, max) => {
    const safe = Math.max(0, Math.min(Number(qty) || 0, max));
    setMaterialReq((prev) => {
      const next = { ...prev };
      if (safe <= 0) delete next[id];
      else next[id] = safe;
      return next;
    });
  };

  const price = pricePerSlot(selected);
  const totalCents = price * selectedSlots.length;
  const dateLabel = new Date(`${date}T00:00:00`).toLocaleDateString(lang, { weekday: 'long', day: 'numeric', month: 'long' });

  const handleBooking = async () => {
    if (!selected || selectedSlots.length === 0) return;
    setSubmitting(true);
    const material = Object.entries(materialReq).map(([id, qty]) => ({ id: Number(id), qty: Number(qty) }));
    const { data: reservaId, error } = await supabase.rpc('create_booking', {
      p_inst: selected.id,
      p_fecha: date,
      p_horas: selectedSlots,
      p_material: material,
    });
    setSubmitting(false);

    if (error) {
      setConfirming(false);
      if (error.code === '23505') {
        toast.error(t('booking.errors.slotTaken'));
        setSelectedSlots([]);
        refreshOccupied();
      } else if (error.code === 'P0001' && /pendiente/i.test(error.message)) {
        loadPending();
      } else if (/function .*create_booking|Could not find the function/i.test(error.message)) {
        toast.error(t('booking.errors.migration'));
      } else {
        toast.error(error.message || t('booking.errors.bookingError'));
      }
      return;
    }
    toast.success(t('booking.success'));
    navigate(`/checkout/${reservaId}`);
  };

  /* ──────────────── estados de carga ──────────────── */
  if (pending === undefined || instalaciones === null) {
    return <BrandLoader fullscreen={false} label={t('booking.loading')} />;
  }
  if (pending) {
    return <PendingBookingNotice booking={pending} onCancelled={() => setPending(null)} />;
  }
  if (instalaciones.length === 0) {
    return (
      <div className="max-w-xl mx-auto theme-card p-10 text-center">
        <AlertCircle className="mx-auto theme-faint" size={40} />
        <h1 className="mt-4 text-xl font-black theme-text">{t('booking.noCourtsTitle')}</h1>
        <p className="mt-2 theme-faint">{t('booking.noCourtsDesc')}</p>
      </div>
    );
  }

  const strip = Array.from({ length: STRIP_DAYS }, (_, i) => addDaysIso(today, i));
  const morning = TIME_SLOTS.filter((s) => s < '14:00');
  const afternoon = TIME_SLOTS.filter((s) => s >= '14:00');
  const freeCount = TIME_SLOTS.filter((s) => slotState(s) === 'free').length;

  const renderSlot = (time) => {
    const state = slotState(time);
    const isSel = selectedSlots.includes(time);
    const disabled = !bookable || state !== 'free';
    const sub = state === 'occupied' ? t('booking.occupied')
      : state === 'past' ? t('booking.past')
        : state === 'soon' ? t('booking.tooSoon')
          : isSel ? t('booking.selected') : formatEuros(price, lang);
    return (
      <button
        key={time}
        type="button"
        disabled={disabled}
        aria-pressed={isSel}
        onClick={() => toggleSlot(time)}
        className={[
          'relative rounded-2xl border px-3 py-3 text-left transition-all',
          isSel
            ? 'bg-brand-purple dark:bg-brand-lime border-brand-purple dark:border-brand-lime text-white dark:text-black shadow-lg -translate-y-0.5'
            : state === 'occupied'
              ? 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300 cursor-not-allowed'
              : state !== 'free' || !bookable
                ? 'theme-border theme-faint opacity-50 cursor-not-allowed'
                : 'theme-bg theme-border theme-text hover:border-brand-purple dark:hover:border-brand-lime hover:-translate-y-0.5',
        ].join(' ')}
      >
        <span className="block font-display text-xl font-black tabular-nums leading-none">{time}</span>
        <span className="mt-1 block text-[11px] font-bold uppercase tracking-wide opacity-80">{sub}</span>
      </button>
    );
  };

  return (
    <>
      {confirming && (
        <ConfirmBookingModal
          summary={{ court: selected?.nombre ?? '', dateLabel, slots: selectedSlots, total: formatEuros(totalCents, lang) }}
          busy={submitting}
          onConfirm={handleBooking}
          onCancel={() => setConfirming(false)}
        />
      )}

      <div className="max-w-5xl mx-auto space-y-6 pb-6 animate-in fade-in duration-500">
        <header>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-purple dark:text-brand-lime">{t('booking.kicker')}</p>
          <h1 className="mt-1 text-3xl md:text-4xl font-black theme-text tracking-tight">{t('booking.title')}</h1>
          <p className="theme-faint text-sm mt-1">{t('booking.subtitle')}</p>
        </header>

        {/* 1 · Pista */}
        <section className="theme-card p-5 md:p-6" aria-labelledby="step-court">
          <h2 id="step-court" className="flex items-center gap-3 font-black theme-text">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-purple dark:bg-brand-lime text-white dark:text-black text-xs">1</span>
            {t('booking.selectCourt')}
          </h2>

          {sports.length > 1 && (
            <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={t('booking.sport')}>
              {[{ tipo: 'all', name: t('booking.allSports') }, ...sports].map((s) => (
                <button
                  key={s.tipo}
                  type="button"
                  aria-pressed={sport === s.tipo}
                  onClick={() => setSport(s.tipo)}
                  className={`rounded-full px-4 py-1.5 text-sm font-bold border transition-colors ${sport === s.tipo
                    ? 'bg-brand-purple dark:bg-brand-lime border-transparent text-white dark:text-black'
                    : 'theme-border theme-muted hover:theme-text'}`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          )}

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visibleCourts.map((inst) => {
              const ok = (inst.estado ?? 'disponible') === 'disponible';
              const active = inst.id === selectedId;
              const info = describeSport({ tipo: inst.tipo }, t);
              return (
                <button
                  key={inst.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => selectCourt(inst.id)}
                  className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all ${active
                    ? 'border-brand-purple dark:border-brand-lime ring-2 ring-brand-purple/30 dark:ring-brand-lime/30 theme-elevated'
                    : 'theme-border theme-bg hover:border-brand-purple/50 dark:hover:border-brand-lime/50'} ${ok ? '' : 'opacity-70'}`}
                >
                  <span className="text-[11px] font-black uppercase tracking-wider text-brand-purple dark:text-brand-lime">{info.name}</span>
                  <span className="mt-1 block font-black theme-text text-lg leading-tight">{inst.nombre}</span>
                  <span className="mt-3 flex items-center justify-between text-xs">
                    <span className={`font-bold ${ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      ● {ok ? t('booking.status.available') : t(`booking.status.${inst.estado}`, { defaultValue: inst.estado })}
                    </span>
                    <span className="theme-muted font-bold tabular-nums">{formatEuros(pricePerSlot(inst), lang)}<span className="theme-faint font-normal">/h</span></span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 2 · Día */}
        <section className="theme-card relative z-20 p-5 md:p-6" aria-labelledby="step-date">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="step-date" className="flex items-center gap-3 font-black theme-text">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-purple dark:bg-brand-lime text-white dark:text-black text-xs">2</span>
              {t('booking.date')}
              <span className="font-bold theme-faint text-sm capitalize">· {dateLabel}</span>
            </h2>
          </div>

          <div className="mt-4 -mx-1 flex gap-2 overflow-x-auto pb-2 px-1 snap-x" role="listbox" aria-label={t('booking.date')}>
            {strip.map((iso) => {
              const d = new Date(`${iso}T00:00:00`);
              const active = iso === date;
              return (
                <button
                  key={iso}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => selectDate(iso)}
                  className={`snap-start shrink-0 w-[4.5rem] rounded-2xl border py-3 text-center transition-all ${active
                    ? 'bg-brand-purple dark:bg-brand-lime border-transparent text-white dark:text-black shadow-lg'
                    : 'theme-bg theme-border theme-text hover:border-brand-purple dark:hover:border-brand-lime'}`}
                >
                  <span className="block text-[11px] font-bold uppercase opacity-80">
                    {iso === today ? t('booking.today') : d.toLocaleDateString(lang, { weekday: 'short' })}
                  </span>
                  <span className="block font-display text-2xl font-black leading-tight tabular-nums">{d.getDate()}</span>
                  <span className="block text-[11px] font-bold uppercase opacity-70">{d.toLocaleDateString(lang, { month: 'short' })}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-3 max-w-xs">
            <DatePicker
              id="booking-date"
              label={t('booking.otherDate')}
              value={date}
              min={today}
              max={maxDate}
              onChange={(e) => selectDate(e.target.value)}
              hint={t('booking.maxAhead', { days: MAX_DAYS_AHEAD })}
            />
          </div>
        </section>

        {/* 3 · Franjas */}
        <section className="theme-card p-5 md:p-6" aria-labelledby="step-slots" aria-busy={loadingSlots}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="step-slots" className="flex items-center gap-3 font-black theme-text">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-purple dark:bg-brand-lime text-white dark:text-black text-xs">3</span>
              {t('booking.availableSlots')}
            </h2>
            <span className="text-xs font-bold theme-faint">{t('booking.freeCount', { count: freeCount })} · {t('booking.maxSlotsHint', { max: MAX_SLOTS })}</span>
          </div>

          {!bookable && (
            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl text-amber-700 dark:text-amber-300 text-sm flex items-center gap-2">
              <AlertCircle size={16} /> {t('booking.maintenance')}
            </div>
          )}

          <div className={`mt-5 space-y-5 transition-opacity ${loadingSlots ? 'opacity-50' : ''}`}>
            <div>
              <p className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wider theme-faint"><Sun size={14} /> {t('booking.morning')}</p>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">{morning.map(renderSlot)}</div>
            </div>
            <div>
              <p className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wider theme-faint"><Sunset size={14} /> {t('booking.afternoon')}</p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">{afternoon.map(renderSlot)}</div>
            </div>
          </div>
          <p className="mt-4 text-xs theme-faint flex items-center gap-1.5"><Clock size={12} /> {t('booking.leadNote', { hours: MIN_LEAD_HOURS })}</p>
        </section>

        {/* 4 · Material */}
        <section className="theme-card p-5 md:p-6" aria-labelledby="step-material">
          <h2 id="step-material" className="flex items-center gap-3 font-black theme-text">
            <span className="grid h-7 w-7 place-items-center rounded-full theme-elevated border theme-border text-xs"><Package size={14} /></span>
            {t('booking.material')} <span className="text-xs font-bold theme-faint">({t('booking.optional')})</span>
          </h2>
          <p className="mt-1 text-xs theme-muted">{t('booking.materialDesc')}</p>

          {loadingInventory ? (
            <p className="mt-4 text-sm theme-faint animate-pulse">{t('booking.loadingInventory')}</p>
          ) : inventory.length === 0 ? (
            <p className="mt-4 theme-faint text-sm">{t('booking.noMaterial')}</p>
          ) : (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {inventory.map((it) => {
                const max = Math.max(0, Math.min(20, Number(it.cantidad) || 0));
                const qty = Number(materialReq[it.id] || 0);
                return (
                  <div key={it.id} className={`rounded-2xl border p-3 pl-4 flex items-center justify-between gap-3 theme-bg theme-border ${max === 0 ? 'opacity-50' : ''}`}>
                    <div className="min-w-0">
                      <p className="text-sm font-bold theme-text truncate">{it.nombre}</p>
                      <p className="text-[11px] theme-faint">{t('booking.stock')} <span className="theme-text font-bold">{it.cantidad}</span></p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button type="button" disabled={qty <= 0} onClick={() => setReqQty(it.id, qty - 1, max)} className="w-9 h-9 grid place-items-center rounded-xl border theme-border theme-text disabled:opacity-30" aria-label={t('booking.less', { item: it.nombre })}>
                        <Minus size={14} />
                      </button>
                      <output className="w-8 text-center font-black theme-text tabular-nums" aria-live="polite">{qty}</output>
                      <button type="button" disabled={qty >= max} onClick={() => setReqQty(it.id, qty + 1, max)} className="w-9 h-9 grid place-items-center rounded-xl bg-brand-purple/10 dark:bg-brand-lime/10 text-brand-purple dark:text-brand-lime disabled:opacity-30" aria-label={t('booking.more', { item: it.nombre })}>
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Barra de resumen (se pega abajo al hacer scroll) */}
        {selectedSlots.length > 0 && (
          <div className="sticky bottom-4 z-30 pr-16 sm:pr-20 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-brand-purple/30 dark:border-brand-lime/30 theme-card px-5 py-4 shadow-2xl">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold theme-text">{selected?.nombre} · <span className="capitalize">{dateLabel}</span></p>
                <p className="truncate text-xs theme-faint tabular-nums">{selectedSlots.join(' · ')}</p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <span className="text-xl font-black text-brand-purple dark:text-brand-lime tabular-nums">{formatEuros(totalCents, lang)}</span>
                <button
                  type="button"
                  onClick={() => setConfirming(true)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-brand-purple dark:bg-brand-lime px-5 py-3 font-black text-white dark:text-black hover:opacity-90"
                >
                  {t('booking.continue')} <CheckCircle size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
