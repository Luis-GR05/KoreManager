import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useTranslation } from 'react-i18next';
import { CheckoutForm } from './CheckoutForm';

const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
// Fuera del componente para no recrear Stripe en cada render
const stripePromise = STRIPE_KEY ? loadStripe(STRIPE_KEY) : null;

/**
 * Envuelve el formulario de pago con el contexto de Stripe Elements.
 * @param {{ amount: number, orderId: number, onExpired?: () => void }} props
 */
export function CheckoutComponent({ amount, orderId, onExpired }) {
  const { t } = useTranslation();
  return (
    <div className="p-6 md:p-8">
      <h2 className="text-xl font-black theme-text mb-5">{t('checkout.paymentDetails')}</h2>
      {stripePromise ? (
        <Elements stripe={stripePromise}>
          <CheckoutForm amount={amount} orderId={orderId} onExpired={onExpired} />
        </Elements>
      ) : (
        <p className="text-sm text-red-600 dark:text-red-400 font-bold" role="alert">{t('checkout.errors.noKey')}</p>
      )}
    </div>
  );
}
