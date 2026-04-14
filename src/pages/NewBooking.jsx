// src/pages/NewBooking.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/useAuth';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, CheckCircle, AlertCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';

const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00', '13:00',
  '16:00', '17:00', '18:00', '19:00', '20:00', '21:00',
];

// ─── Modal de confirmación custom (reemplaza window.confirm) ─────────────────
function ConfirmBookingModal({ date, time, instalacion, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#1A1A2E] border border-white/10 rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="w-14 h-14 bg-brand-lime/10 rounded-2xl flex items-center justify-center mb-5 mx-auto">
          <Calendar className="text-brand-lime" size={28} />
        </div>
        <h3 className="text-xl font-bold text-white text-center mb-1">Confirmar Reserva</h3>
        <p className="text-gray-400 text-sm text-center mb-6">
          Vas a reservar <strong className="text-white">{instalacion}</strong> el{' '}
          <strong className="text-brand-lime">{date}</strong> a las{' '}
          <strong className="text-brand-lime">{time}h</strong>.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-white/10 text-gray-300 font-bold hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
          >
            <X size={16} /> Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl bg-brand-lime text-black font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <CheckCircle size={16} /> Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NewBooking() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading]             = useState(false);
  const [instalaciones, setInstalaciones] = useState([]);
  const [selectedInst, setSelectedInst]   = useState(null);
  const [selectedInstData, setSelectedInstData] = useState(null);
  const [date, setDate]                   = useState(new Date().toISOString().split('T')[0]);
  const [occupiedSlots, setOccupiedSlots] = useState([]);
  // Estado del modal personalizado
  const [pendingTime, setPendingTime]     = useState(null); // horario pendiente de confirmar

  // Cargar instalaciones al montar
  useEffect(() => {
    supabase
      .from('instalaciones')
      .select('*')
      .order('id')
      .then(({ data }) => {
        if (data && data.length > 0) {
          setInstalaciones(data);
          setSelectedInst(data[0].id);
          setSelectedInstData(data[0]);
        }
      });
  }, []);

  // Comprobar disponibilidad al cambiar pista o fecha
  useEffect(() => {
    if (!selectedInst) return;
    supabase
      .from('reservas')
      .select('hora')
      .eq('installation_id', selectedInst)
      .eq('fecha', date)
      .then(({ data }) => {
        setOccupiedSlots((data || []).map(r => r.hora.slice(0, 5)));
      });
  }, [selectedInst, date]);

  const handleSelectInst = (inst) => {
    setSelectedInst(inst.id);
    setSelectedInstData(inst);
  };

  // Valida y abre el modal (antes usaba window.confirm)
  const requestBooking = (time) => {
    const hoy = new Date().toISOString().split('T')[0];
    if (date < hoy) {
      toast.error('No puedes reservar en una fecha pasada.');
      return;
    }
    if (selectedInstData?.estado === 'mantenimiento') {
      toast.error(`"${selectedInstData.nombre}" está en mantenimiento.`);
      return;
    }
    setPendingTime(time);
  };

  // Ejecuta la reserva tras confirmación en el modal
  const handleBooking = async () => {
    if (!pendingTime) return;
    const time = pendingTime;
    setPendingTime(null);
    setLoading(true);

    const toastId = toast.loading('Confirmando reserva...');
    // Precio fijo por reserva (1h). Puedes moverlo a BD o settings más adelante.
    const PRECIO_CENTS = 500; // 5,00€

    const { data: inserted, error } = await supabase.from('reservas').insert([{
      user_id: user.id,
      installation_id: selectedInst,
      fecha: date,
      hora: time,
      precio_cents: PRECIO_CENTS,
      currency: 'eur',
      payment_status: 'pending',
    }]);

    toast.dismiss(toastId);

    if (error) {
      if (error.code === '23505') {
        toast.error('Ese horario ya fue reservado. Elige otro.');
        const { data } = await supabase
          .from('reservas').select('hora')
          .eq('installation_id', selectedInst).eq('fecha', date);
        setOccupiedSlots((data || []).map(r => r.hora.slice(0, 5)));
      } else {
        toast.error('Error al reservar: ' + error.message);
      }
    } else {
      // Recuperar ID insertado y lanzar pago (Stripe Checkout)
      const reservaId = inserted?.[0]?.id;
      if (!reservaId) {
        toast.success('Reserva creada. Ve al historial para pagar.');
        navigate('/historial');
      } else {
        toast.loading('Redirigiendo a pago seguro...');
        const { data: fnData, error: fnErr } = await supabase.functions.invoke('create-checkout-session', {
          body: { reservaId },
        });
        if (fnErr || !fnData?.url) {
          toast.error('No se pudo iniciar el pago. Puedes reintentarlo desde el historial.');
          navigate('/historial');
        } else {
          window.location.assign(fnData.url);
        }
      }
    }

    setLoading(false);
  };

  return (
    <>
      {/* Modal de confirmación (reemplaza window.confirm nativo) */}
      {pendingTime && (
        <ConfirmBookingModal
          date={date}
          time={pendingTime}
          instalacion={selectedInstData?.nombre || 'Pista'}
          onConfirm={handleBooking}
          onCancel={() => setPendingTime(null)}
        />
      )}

      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl font-bold text-white">Nueva Reserva</h1>
          <p className="text-gray-400 text-sm mt-1">Selecciona la pista, la fecha y el horario que prefieras.</p>
        </div>

        {/* Selección de pista y fecha */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#1A1A2E] p-6 rounded-3xl border border-white/5">
          <div>
            <label className="text-gray-400 text-sm font-bold mb-3 block">Selecciona Pista</label>
            <div className="grid grid-cols-1 gap-3">
              {instalaciones.map((inst) => {
                const isSelected = selectedInst === inst.id;
                const isMaint = inst.estado === 'mantenimiento';
                return (
                  <button
                    key={inst.id}
                    onClick={() => handleSelectInst(inst)}
                    className={`p-3 rounded-xl text-sm font-bold border transition-all text-left flex items-center justify-between ${
                      isSelected
                        ? 'bg-brand-lime text-black border-brand-lime'
                        : isMaint
                          ? 'bg-yellow-500/5 text-yellow-400 border-yellow-500/20 opacity-70'
                          : 'bg-[#0F0F1A] text-gray-300 border-white/10 hover:border-white/30'
                    }`}
                  >
                    <span>{inst.nombre}</span>
                    {isMaint && (
                      <span className="text-[10px] uppercase tracking-wider flex items-center gap-1">
                        <AlertCircle size={12} /> Mant.
                      </span>
                    )}
                    {!isMaint && isSelected && <CheckCircle size={16} />}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-gray-400 text-sm font-bold mb-3 block">Fecha</label>
            <input
              type="date"
              value={date}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-[#0F0F1A] border border-white/10 text-white rounded-xl p-3 focus:border-brand-lime outline-none"
            />

            {selectedInstData?.estado === 'mantenimiento' && (
              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-400 text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                Esta pista está en mantenimiento y no puede reservarse.
              </div>
            )}
          </div>
        </div>

        {/* Horarios */}
        <div>
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <Clock className="text-brand-lime" /> Horarios Disponibles
          </h3>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {TIME_SLOTS.map((time) => {
              const isOccupied = occupiedSlots.includes(time);
              return (
                <button
                  key={time}
                  disabled={isOccupied || loading || selectedInstData?.estado === 'mantenimiento'}
                  onClick={() => requestBooking(time)}
                  className={`py-4 rounded-2xl font-bold text-lg transition-all ${
                    isOccupied
                      ? 'bg-red-500/10 text-red-500 border border-red-500/20 cursor-not-allowed opacity-50'
                      : 'bg-[#1F1F2E] text-white border border-brand-lime/20 hover:bg-brand-lime hover:text-black hover:shadow-[0_0_15px_rgba(204,255,0,0.4)] disabled:opacity-30'
                  }`}
                >
                  {time}
                  {isOccupied && <span className="text-[10px] block font-normal">OCUPADO</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}