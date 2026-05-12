import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/useAuth';
import { CheckoutComponent } from '../components/Checkout/CheckoutComponent';
import { Calendar, Clock, MapPin, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [reserva, setReserva] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !user?.id) return;

    const fetchReserva = async () => {
      const { data, error } = await supabase
        .from('reservas')
        .select(`*, instalaciones(nombre, tipo)`)
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        toast.error('No se pudo cargar la información de la reserva o no te pertenece.');
        navigate('/historial');
      } else if (data.payment_status === 'paid') {
        toast.success('Esta reserva ya está pagada.');
        navigate('/historial');
      } else {
        setReserva(data);
      }
      setLoading(false);
    };

    fetchReserva();
  }, [id, user?.id, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 min-h-[60vh]">
        <p className="text-brand-lime animate-pulse text-lg font-bold">Cargando detalles de pago...</p>
      </div>
    );
  }

  if (!reserva) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Botón Volver */}
      <button
        onClick={() => navigate('/historial')}
        className="flex items-center gap-2 theme-faint hover:theme-text transition-colors text-sm font-bold w-fit"
      >
        <ChevronLeft size={16} /> Volver al historial
      </button>

      <div>
        <h1 className="text-3xl font-black theme-text tracking-tight">Finalizar Reserva</h1>
        <p className="theme-faint text-sm mt-1">Completa el pago para confirmar tu pista mediante pago seguro.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Resumen de la reserva */}
        <div className="theme-card p-6 md:p-8 border theme-border space-y-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-purple dark:text-brand-lime/70 mb-2">Resumen</p>
            <h3 className="text-2xl font-black theme-text">{reserva.instalaciones?.nombre || 'Pista Deportiva'}</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 theme-text">
              <div className="w-10 h-10 rounded-xl theme-bg border theme-border flex items-center justify-center">
                <Calendar size={18} className="text-brand-purple dark:text-brand-lime" />
              </div>
              <div>
                <p className="text-xs theme-faint font-bold uppercase tracking-wider">Fecha</p>
                <p className="font-bold">{new Date(reserva.fecha + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 theme-text">
              <div className="w-10 h-10 rounded-xl theme-bg border theme-border flex items-center justify-center">
                <Clock size={18} className="text-brand-purple" />
              </div>
              <div>
                <p className="text-xs theme-faint font-bold uppercase tracking-wider">Hora</p>
                <p className="font-bold">{String(reserva.hora).slice(0, 5)}h</p>
              </div>
            </div>

            <div className="flex items-center gap-3 theme-text">
              <div className="w-10 h-10 rounded-xl theme-bg border theme-border flex items-center justify-center">
                <MapPin size={18} className="theme-faint" />
              </div>
              <div>
                <p className="text-xs theme-faint font-bold uppercase tracking-wider">Tipo</p>
                <p className="font-bold capitalize">{reserva.instalaciones?.tipo || 'General'}</p>
              </div>
            </div>
          </div>
          
          <div className="pt-6 border-t theme-border flex justify-between items-center">
            <span className="theme-faint font-bold">Total a pagar</span>
            <span className="text-3xl font-black text-brand-purple dark:text-brand-lime">{(reserva.precio_cents / 100).toFixed(2)} €</span>
          </div>
        </div>

        {/* Componente de Stripe */}
        <div className="theme-card border theme-border overflow-hidden">
          <CheckoutComponent amount={reserva.precio_cents} orderId={reserva.id} />
        </div>
      </div>
    </div>
  );
}
