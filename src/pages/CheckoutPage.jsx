import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Calendar, Clock, MapPin, ChevronLeft, Package, TimerReset } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/useAuth';
import { CheckoutComponent } from '../components/Checkout/CheckoutComponent';
import BrandLoader from '../components/feedback/BrandLoader';
import ErrorScreen from './errors/ErrorScreen';
import { formatEuros } from '../lib/bookings';

/** Minutos que le quedan a una reserva pendiente antes de caducar (igual que en SQL). */
function expiresAt(r) {
  const created = new Date(r.created_at).getTime();
  const start = new Date(`${r.fecha}T${String(r.hora).slice(0, 5)}:00`).getTime();
  const byAge = created + 3 * 3_600_000;
  const byStart = start - 3 * 3_600_000 < Date.now() ? created + 15 * 60_000 : Infinity;
  return Math.min(byAge, byStart, start);
}

/** Cuenta atrás mm:ss hasta que caduque la reserva. */
function Countdown({ until, onEnd }) {
  const { t } = useTranslation();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const left = Math.max(0, until - now);
  useEffect(() => { if (left === 0) onEnd?.(); }, [left, onEnd]);
  const h = Math.floor(left / 3_600_000);
  const m = Math.floor((left % 3_600_000) / 60_000);
  const s = Math.floor((left % 60_000) / 1000);
  const txt = h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return (
    <p className="flex items-center gap-2 text-sm font-bold text-amber-700 dark:text-amber-300" aria-live="off">
      <TimerReset size={16} /> {t('checkout.expiresIn')} <span className="tabular-nums">{txt}</span>
    </p>
  );
}

/**
 * Página de pago de una reserva pendiente.
 */
export default function CheckoutPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();

  const [reserva, setReserva] = useState(null);
  const [slots, setSlots] = useState([]);
  const [material, setMaterial] = useState([]);
  const [state, setState] = useState('loading'); // loading | ready | expired | notFound

  useEffect(() => {
    if (!id || !user?.id) return;
    let alive = true;
    (async () => {
      await supabase.rpc('expire_pending_reservas').then(() => {}, () => {});
      const { data, error } = await supabase
        .from('reservas')
        .select('id, fecha, hora, created_at, precio_cents, currency, payment_status, instalaciones(nombre, tipo)')
        .eq('id', id)
        .eq('user_id', user.id)
        .maybeSingle();
      if (!alive) return;
      if (error || !data) return setState('notFound');
      if (data.currency?.startsWith('linked_')) {
        navigate(`/checkout/${data.currency.slice(7)}`, { replace: true });
        return;
      }
      if (data.payment_status === 'paid') {
        toast.success(t('checkout.alreadyPaid'));
        navigate('/historial', { replace: true });
        return;
      }
      if (data.payment_status !== 'pending') return setState('expired');

      const [{ data: linked }, { data: mat }] = await Promise.all([
        supabase.from('reservas').select('hora').eq('currency', `linked_${data.id}`),
        supabase.from('reserva_material').select('cantidad, inventario(nombre)').eq('reserva_id', data.id),
      ]);
      if (!alive) return;
      setReserva(data);
      setSlots([data.hora, ...(linked ?? []).map((r) => r.hora)].map((h) => String(h).slice(0, 5)).sort());
      setMaterial(mat ?? []);
      setState('ready');
    })();
    return () => { alive = false; };
  }, [id, user?.id, navigate, t]);

  if (state === 'loading') return <BrandLoader fullscreen={false} label={t('checkout.loading')} />;
  if (state === 'notFound') {
    return (
      <ErrorScreen
        inApp
        code="404"
        title={t('checkout.notFound.title')}
        desc={t('checkout.notFound.desc')}
        primary={{ to: '/historial', label: t('payment.cancel.goToHistory') }}
        secondary={{ to: '/reservar', label: t('payment.cancel.bookAgain') }}
      />
    );
  }
  if (state === 'expired') {
    return (
      <ErrorScreen
        inApp
        court={0}
        code="410"
        title={t('checkout.expired.title')}
        desc={t('checkout.expired.desc')}
        primary={{ to: '/reservar', label: t('payment.cancel.bookAgain') }}
        secondary={{ to: '/historial', label: t('payment.cancel.goToHistory') }}
      />
    );
  }

  const dateLabel = new Date(`${reserva.fecha}T00:00:00`).toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <Link to="/historial" className="flex items-center gap-2 theme-faint hover:theme-text transition-colors text-sm font-bold w-fit">
        <ChevronLeft size={16} /> {t('checkout.back')}
      </Link>

      <header>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-purple dark:text-brand-lime">{t('checkout.kicker')}</p>
        <h1 className="mt-1 text-3xl md:text-4xl font-black theme-text tracking-tight">{t('checkout.title')}</h1>
        <p className="theme-faint text-sm mt-1">{t('checkout.subtitle')}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_1.1fr] gap-6 items-start">
        <section className="theme-card p-6 md:p-8 space-y-6" aria-labelledby="summary-title">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] theme-faint mb-2">{t('checkout.summary')}</p>
            <h2 id="summary-title" className="text-2xl font-black theme-text">{reserva.instalaciones?.nombre}</h2>
          </div>

          <ul className="space-y-4">
            <li className="flex items-center gap-3 theme-text">
              <span className="w-10 h-10 rounded-xl theme-bg border theme-border grid place-items-center"><Calendar size={18} className="text-brand-purple dark:text-brand-lime" /></span>
              <span><span className="block text-xs theme-faint font-bold uppercase tracking-wider">{t('booking.date')}</span><span className="font-bold capitalize">{dateLabel}</span></span>
            </li>
            <li className="flex items-center gap-3 theme-text">
              <span className="w-10 h-10 rounded-xl theme-bg border theme-border grid place-items-center"><Clock size={18} className="text-brand-purple dark:text-brand-lime" /></span>
              <span><span className="block text-xs theme-faint font-bold uppercase tracking-wider">{t('booking.hours')}</span><span className="font-bold tabular-nums">{slots.join(' · ')}</span></span>
            </li>
            <li className="flex items-center gap-3 theme-text">
              <span className="w-10 h-10 rounded-xl theme-bg border theme-border grid place-items-center"><MapPin size={18} className="theme-faint" /></span>
              <span><span className="block text-xs theme-faint font-bold uppercase tracking-wider">{t('checkout.sport')}</span><span className="font-bold capitalize">{reserva.instalaciones?.tipo}</span></span>
            </li>
            {material.length > 0 && (
              <li className="flex items-start gap-3 theme-text">
                <span className="w-10 h-10 rounded-xl theme-bg border theme-border grid place-items-center shrink-0"><Package size={18} className="theme-faint" /></span>
                <span><span className="block text-xs theme-faint font-bold uppercase tracking-wider">{t('booking.material')}</span>
                  <span className="font-bold">{material.map((m) => `${m.cantidad}× ${m.inventario?.nombre ?? ''}`).join(', ')}</span></span>
              </li>
            )}
          </ul>

          <div className="pt-6 border-t theme-border space-y-3">
            <div className="flex justify-between items-center">
              <span className="theme-faint font-bold">{t('booking.totalToPay')}</span>
              <span className="text-3xl font-black text-brand-purple dark:text-brand-lime tabular-nums">{formatEuros(reserva.precio_cents, i18n.language)}</span>
            </div>
            <Countdown until={expiresAt(reserva)} onEnd={() => setState('expired')} />
          </div>
        </section>

        <section className="theme-card overflow-hidden">
          <CheckoutComponent amount={reserva.precio_cents} orderId={reserva.id} onExpired={() => setState('expired')} />
        </section>
      </div>
    </div>
  );
}
