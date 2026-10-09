import { useState } from 'react';
import { CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CheckCircle, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { formatEuros, invokeFunction } from '../../lib/bookings';

/**
 * Formulario de pago con Stripe Elements.
 * 1. Pide el `clientSecret` a la Edge Function `create-payment-intent`
 *    (el importe lo calcula el servidor).
 * 2. Confirma el pago con la tarjeta en el navegador.
 * 3. Llama a `confirm-payment`, que verifica el pago con Stripe y marca la
 *    reserva como pagada al momento (el webhook es la red de seguridad).
 *
 * @param {{ amount: number, orderId: number, onExpired?: () => void }} props
 */
export function CheckoutForm({ amount, orderId, onExpired }) {
  const stripe = useStripe();
  const elements = useElements();
  const { profile, user } = useAuth();
  const { t, i18n } = useTranslation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [result, setResult] = useState(null); // 'paid' | 'processing' | 'refunded'

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setPaymentError(null);

    try {
      let clientSecret;
      try {
        const data = await invokeFunction('create-payment-intent', { reservaId: orderId });
        clientSecret = data?.clientSecret;
      } catch (err) {
        if (err.code === 'expired') {
          onExpired?.();
          return;
        }
        if (err.code === 'rate_limited') throw new Error(t('checkout.errors.rateLimited'));
        throw new Error(t('checkout.errors.server'));
      }
      if (!clientSecret) throw new Error(t('checkout.errors.server'));

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardNumberElement),
          billing_details: {
            name: profile?.full_name || user?.email || undefined,
            email: user?.email || undefined,
          },
        },
      });

      if (stripeError) {
        setPaymentError(stripeError.message);
        toast.error(t('checkout.errors.declined'));
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        try {
          const data = await invokeFunction('confirm-payment', { reservaId: orderId, paymentIntentId: paymentIntent.id });
          setResult(data?.status === 'refunded' ? 'refunded' : 'paid');
        } catch {
          // El cobro está hecho; el webhook terminará de marcar la reserva
          setResult('processing');
        }
      } else {
        setResult('processing');
      }
    } catch (err) {
      setPaymentError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const isDark = document.documentElement.classList.contains('dark');
  const elementOptions = {
    style: {
      base: {
        fontSize: '16px',
        fontFamily: 'system-ui, sans-serif',
        color: isDark ? '#ffffff' : '#1A1A2E',
        '::placeholder': { color: isDark ? '#9ca3af' : '#6b7280' },
      },
      invalid: { color: '#FF3B30' },
    },
  };

  if (result) {
    const refunded = result === 'refunded';
    return (
      <div className="w-full text-center flex flex-col items-center space-y-5 py-6 animate-in fade-in duration-300" role="status">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center ${refunded ? 'bg-amber-400/15' : 'bg-brand-purple/10 dark:bg-brand-lime/15'}`}>
          {refunded
            ? <AlertCircle className="w-10 h-10 text-amber-500" />
            : <CheckCircle className="w-10 h-10 text-brand-purple dark:text-brand-lime" />}
        </div>
        <div>
          <h3 className="text-2xl font-black theme-text">{t(`checkout.result.${result}.title`)}</h3>
          <p className="mt-2 theme-muted text-sm leading-relaxed">{t(`checkout.result.${result}.desc`)}</p>
        </div>
        <div className="flex w-full flex-col gap-2">
          <Link to="/historial" className="w-full py-3 rounded-xl bg-brand-purple dark:bg-brand-lime text-white dark:text-black font-black">
            {t('payment.success.viewHistory')}
          </Link>
          <Link to="/dashboard" className="w-full py-3 rounded-xl border theme-border theme-text font-bold">
            {t('payment.success.goToDashboard')}
          </Link>
        </div>
      </div>
    );
  }

  const fieldCls = 'p-4 rounded-xl border theme-border theme-bg focus-within:border-brand-purple dark:focus-within:border-brand-lime transition-colors';

  return (
    <form onSubmit={handleSubmit} className="w-full" noValidate>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold theme-muted uppercase tracking-wider mb-2">{t('checkout.cardNumber')}</label>
          <div className={fieldCls}><CardNumberElement options={{ ...elementOptions, showIcon: true }} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold theme-muted uppercase tracking-wider mb-2">{t('checkout.expiry')}</label>
            <div className={fieldCls}><CardExpiryElement options={elementOptions} /></div>
          </div>
          <div>
            <label className="block text-xs font-bold theme-muted uppercase tracking-wider mb-2">{t('checkout.cvc')}</label>
            <div className={fieldCls}><CardCvcElement options={elementOptions} /></div>
          </div>
        </div>
      </div>

      {paymentError && (
        <div className="mt-4 text-red-600 dark:text-red-400 text-sm font-bold bg-red-500/10 p-3 rounded-xl border border-red-500/20" role="alert">
          {paymentError}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="mt-6 w-full py-4 px-4 flex justify-center items-center gap-2 rounded-xl font-black uppercase tracking-wider transition-all shadow-lg bg-brand-purple dark:bg-brand-lime text-white dark:text-black hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0 disabled:cursor-wait"
      >
        <Lock size={16} />
        {isProcessing ? t('checkout.processing') : t('checkout.pay', { amount: formatEuros(amount, i18n.language) })}
      </button>
      <p className="mt-3 text-center text-[11px] theme-faint">{t('checkout.secureNote')}</p>
    </form>
  );
}
