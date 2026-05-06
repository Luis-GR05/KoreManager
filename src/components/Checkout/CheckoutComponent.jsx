import React from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { CheckoutForm } from './CheckoutForm';

// Recomendación: Mantén loadStripe fuera del componente render
// para evitar recrear el objeto Stripe en cada renderizado.
// Asegúrate de definir VITE_STRIPE_PUBLIC_KEY en tus variables de entorno locales (.env)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_tu_public_key_aqui');

/**
 * Componente contenedor de la pasarela de pago. Envuelve el formulario
 * con el contexto de Elements de Stripe para permitir la tokenización.
 * 
 * @param {Object} props
 * @param {number} props.amount - Cantidad a cobrar en céntimos.
 * @param {string} props.orderId - UUID de la reserva pendiente.
 * @returns {import('react').JSX.Element}
 */
export const CheckoutComponent = ({ amount, orderId }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-100 dark:bg-gray-800 min-h-[400px]">
      <div className="w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">
          Completar Reserva
        </h2>
        
        {/*
          El componente Elements inicializa la UI y proporciona el contexto 
          para que funcione react-stripe-js. No requiere client_secret aquí si 
          estamos usando CardElement en lugar de PaymentElement y capturándolo 
          dinámicamente en el submit.
        */}
        <Elements stripe={stripePromise}>
          <CheckoutForm amount={amount} orderId={orderId} />
        </Elements>
      </div>
    </div>
  );
};
