// src/pages/NewBooking.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00', '13:00',
  '16:00', '17:00', '18:00', '19:00', '20:00', '21:00',
];

export default function NewBooking() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading]           = useState(false);
  const [instalaciones, setInstalaciones] = useState([]);
  const [selectedInst, setSelectedInst]  = useState(null);
  const [selectedInstData, setSelectedInstData] = useState(null);
  const [date, setDate]                 = useState(new Date().toISOString().split('T')[0]);
  const [occupiedSlots, setOccupiedSlots] = useState([]);

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

  const handleBooking = async (time) => {
    // Validar fecha no pasada
    const hoy = new Date().toISOString().split('T')[0];
    if (date < hoy) {
      toast.error('No puedes reservar en una fecha pasada.');
      return;
    }

    // Validar instalación disponible
    if (selectedInstData?.estado === 'mantenimiento') {
      toast.error(`"${selectedInstData.nombre}" está en mantenimiento.`);
      return;
    }

    if (!confirm(`¿Confirmar reserva el ${date} a las ${time}?`)) return;

    setLoading(true);
    const toastId = toast.loading('Confirmando reserva...');

    const { error } = await supabase.from('reservas').insert([{
      user_id: user.id,
      installation_id: selectedInst,
      fecha: date,
      hora: time,
    }]);

    toast.dismiss(toastId);

    if (error) {
      if (error.code === '23505') {
        toast.error('Ese horario ya fue reservado. Elige otro.');
        // Refrescar slots
        const { data } = await supabase
          .from('reservas').select('hora')
          .eq('installation_id', selectedInst).eq('fecha', date);
        setOccupiedSlots((data || []).map(r => r.hora.slice(0, 5)));
      } else {
        toast.error('Error al reservar: ' + error.message);
      }
    } else {
      toast.success('¡Reserva confirmada! 🎉');
      navigate('/dashboard');
    }

    setLoading(false);
  };

  return (
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
                onClick={() => handleBooking(time)}
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
  );
}