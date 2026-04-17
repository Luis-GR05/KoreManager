import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import toast from 'react-hot-toast';

export const CheckoutForm = ({ amount, orderId }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js no se ha cargado aún
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      // 1. Enviar monto al Backend -> Recibir client_secret
      // Asegúrate de usar la URL y endpoints correctos de tu entorno
      const response = await fetch('http://localhost:8080/api/v1/payment/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Incluye tokens de Auth aquí si requieres autenticación en el Backend Spring Boot
        },
        body: JSON.stringify({ amount: amount, orderId: orderId }),
      });

      if (!response.ok) {
        throw new Error('Error al conectar con el servidor para iniciar el pago');
      }

      const backendData = await response.json();
      const clientSecret = backendData.clientSecret;

      if (!clientSecret) {
        throw new Error('No se recibió client_secret del backend');
      }

      // 2. Confirmar pago con stripe.confirmCardPayment sin procesar la tarjeta manual
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            // Se puede extender para pedir nombre, email, etc. al usuario
            name: 'Cliente GestorDeportivo', 
          },
        },
      });

      if (error) {
        // Mostrar mensaje de error (por ej. tarjeta rechazada, fondos insuficientes)
        setPaymentError(error.message);
        toast.error(error.message || 'Error en el pago');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Pago exitoso
        toast.success('¡Pago realizado con éxito!');
        // Aquí podrías redirigir al usuario o actualizar el estado de tu UI local
      }

    } catch (err) {
      setPaymentError(err.message);
      toast.error(err.message || 'Error interno durante el proceso de pago');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
      <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Detalles de Pago</h3>
      
      <div className="mb-6 p-4 border rounded-lg border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900">
        <CardElement 
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
            hidePostalCode: true,
          }} 
        />
      </div>

      {paymentError && (
        <div className="mb-4 text-red-500 text-sm font-medium">
          {paymentError}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className={`w-full py-3 px-4 flex justify-center items-center rounded-lg text-white font-medium transition-all ${
          isProcessing || !stripe 
            ? 'bg-blue-400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
        }`}
      >
        {isProcessing ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Procesando...
          </span>
        ) : (
          `Pagar ${(amount / 100).toFixed(2)} €`
        )}
      </button>
      <p className="mt-4 text-xs text-center text-gray-500 dark:text-gray-400">
        Pago seguro procesado por Stripe. Nunca guardamos los datos de tu tarjeta.
      </p>
    </form>
  );
};
