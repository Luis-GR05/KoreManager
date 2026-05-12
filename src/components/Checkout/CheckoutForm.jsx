import React, { useState } from 'react';
import { CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';
import toast from 'react-hot-toast';
import { supabase } from '../../supabaseClient';
import { CheckCircle } from 'lucide-react';

/**
 * Componente de formulario de pago integrado con Stripe y Supabase Edge Functions.
 * * @param {Object} props
 * @param {number} props.amount - Cantidad a cobrar en céntimos (ej. 1500 = 15.00€).
 * @param {string} props.orderId - UUID de la reserva pendiente.
 * @returns {import('react').JSX.Element}
 * * @author Senior Web Architect
 */
export const CheckoutForm = ({ amount, orderId }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  /**
   * Maneja la sumisión del formulario, solicita el client_secret a una Edge Function
   * y confirma el pago con Stripe directamente en el cliente.
   * * @param {React.FormEvent} event
   */
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);
    setPaymentError(null);

    try {
      // 1. Invocar Supabase Edge Function en lugar de un servidor externo.
      // Esto garantiza que el usuario autenticado es quien hace la petición.
      const { data, error: functionError } = await supabase.functions.invoke('create-payment-intent', {
        body: { reservaId: orderId }
      });

      if (functionError) {
        throw new Error(`Error en el servidor: ${functionError.message || functionError}`);
      }
      
      if (data?.error) {
        throw new Error(`Detalle interno: ${data.details || data.error}`);
      }

      if (!data?.clientSecret) {
        throw new Error('No se recibió el clientSecret de la pasarela.');
      }

      const clientSecret = data.clientSecret;

      // 2. Confirmar el pago en el cliente
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardNumberElement),
          billing_details: {
            name: 'Usuario Plataforma', // En producción, extraer de useAuth()
          },
        },
      });

      if (stripeError) {
        setPaymentError(stripeError.message);
        toast.error(`Pago denegado: ${stripeError.message}`);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        setIsSuccess(true);
      }

    } catch (err) {
      console.error('[Stripe Error]', err);
      setPaymentError(err.message);
      toast.error('Error crítico en la pasarela de pago.');
    } finally {
      setIsProcessing(false);
    }
  };

  const isDark = document.documentElement.classList.contains('dark');

  const elementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: isDark ? '#ffffff' : '#1A1A2E',
        '::placeholder': { color: isDark ? '#9ca3af' : '#495057' },
      },
      invalid: { color: '#FF3B30' },
    },
  };

  if (isSuccess) {
    return (
      <div className="w-full max-w-md mx-auto p-8 theme-card text-center flex flex-col items-center justify-center space-y-6 animate-fade-in">
        <div className="w-24 h-24 bg-brand-lime/10 rounded-full flex items-center justify-center animate-bounce">
          <CheckCircle className="w-12 h-12 text-brand-purple dark:text-brand-lime" />
        </div>
        <div>
          <h3 className="text-2xl font-black theme-text mb-2">¡Pago Completado!</h3>
          <p className="theme-muted text-sm leading-relaxed">
            Tu pago ha sido validado correctamente. La reserva ya está confirmada en el sistema.
          </p>
        </div>
        <button
          onClick={() => window.history.back()}
          className="w-full mt-4 py-4 px-4 theme-elevated border theme-border rounded-xl theme-text font-bold hover:theme-hover transition-all"
        >
          Volver atrás
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto p-6 theme-card border theme-border shadow-md">
      <h3 className="text-xl font-black mb-4 theme-text">Detalles de Pago</h3>
      
      <div className="mb-6 space-y-4">
        <div>
          <label className="block text-xs font-bold theme-muted uppercase tracking-wider mb-2">Número de tarjeta</label>
          <div className="p-4 border rounded-lg theme-border theme-bg">
            <CardNumberElement options={{ ...elementOptions, showIcon: true }} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold theme-muted uppercase tracking-wider mb-2">Fecha de expiración</label>
            <div className="p-4 border rounded-lg theme-border theme-bg">
              <CardExpiryElement options={elementOptions} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold theme-muted uppercase tracking-wider mb-2">CVV</label>
            <div className="p-4 border rounded-lg theme-border theme-bg">
              <CardCvcElement options={elementOptions} />
            </div>
          </div>
        </div>
      </div>

      {paymentError && (
        <div className="mb-4 text-[#FF3B30] text-sm font-bold bg-[#FF3B30]/10 p-3 rounded-lg border border-[#FF3B30]/20">
          {paymentError}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className={`w-full py-4 px-4 flex justify-center items-center rounded-xl font-black uppercase tracking-wider transition-all shadow-lg ${
          isProcessing || !stripe 
            ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed theme-muted' 
            : 'bg-brand-purple dark:bg-brand-lime text-white dark:text-black hover:scale-[1.02] active:scale-[0.98]'
        }`}
      >
        {isProcessing ? 'Procesando Transacción...' : `Pagar ${(amount / 100).toFixed(2)} €`}
      </button>
    </form>
  );
};