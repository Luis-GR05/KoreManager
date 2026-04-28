import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import toast from 'react-hot-toast';
import { supabase } from '../../supabaseClient';

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
        body: { amount, orderId }
      });

      if (functionError || !data?.clientSecret) {
        throw new Error(functionError?.message || 'Error al generar la intención de pago.');
      }

      const clientSecret = data.clientSecret;

      // 2. Confirmar el pago en el cliente
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: 'Usuario Plataforma', // En producción, extraer de useAuth()
          },
        },
      });

      if (stripeError) {
        setPaymentError(stripeError.message);
        toast.error(`Pago denegado: ${stripeError.message}`);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        toast.success('¡Pago validado correctamente!');
        // Aquí debe emitirse un evento o recargar para que la UI verifique el nuevo estado de la reserva.
        window.location.href = '/historial';
      }

    } catch (err) {
      console.error('[Stripe Error]', err);
      setPaymentError(err.message);
      toast.error('Error crítico en la pasarela de pago.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto p-6 bg-white dark:bg-[#1A1A2E] rounded-xl shadow-md border border-gray-200 dark:border-white/5">
      <h3 className="text-xl font-black mb-4 text-gray-900 dark:text-white">Detalles de Pago</h3>
      
      <div className="mb-6 p-4 border rounded-lg border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-[#0F0F1A]">
        <CardElement 
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#fff', // Ajustado para dark mode
                '::placeholder': { color: '#aab7c4' },
              },
              invalid: { color: '#FF3B30' },
            },
            hidePostalCode: true,
          }} 
        />
      </div>

      {paymentError && (
        <div className="mb-4 text-[#FF3B30] text-sm font-bold bg-[#FF3B30]/10 p-3 rounded-lg border border-[#FF3B30]/20">
          {paymentError}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className={`w-full py-4 px-4 flex justify-center items-center rounded-xl text-black font-black uppercase tracking-wider transition-all ${
          isProcessing || !stripe 
            ? 'bg-gray-600 cursor-not-allowed text-gray-300' 
            : 'bg-[#CCFF00] hover:bg-[#b3e600] shadow-[0_0_20px_rgba(204,255,0,0.3)]'
        }`}
      >
        {isProcessing ? 'Procesando Transacción...' : `Pagar ${(amount / 100).toFixed(2)} €`}
      </button>
    </form>
  );
};