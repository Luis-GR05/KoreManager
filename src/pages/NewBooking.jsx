import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, CheckCircle } from 'lucide-react';

export default function NewBooking() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [instalaciones, setInstalaciones] = useState([]);
    const [selectedInst, setSelectedInst] = useState(null);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // Hoy
    const [occupiedSlots, setOccupiedSlots] = useState([]);

    const timeSlots = [
        "09:00", "10:00", "11:00", "12:00", "13:00", "16:00",
        "17:00", "18:00", "19:00", "20:00", "21:00"
    ];

    useEffect(() => {
        const fetchInst = async () => {
            const { data } = await supabase.from('instalaciones').select('*');
            setInstalaciones(data || []);
            if (data && data.length > 0) setSelectedInst(data[0].id);
        };
        fetchInst();
    }, []);

    useEffect(() => {
        if (!selectedInst) return;
        const checkAvailability = async () => {
            const { data } = await supabase
                .from('reservas')
                .select('hora')
                .eq('installation_id', selectedInst)
                .eq('fecha', date);

            setOccupiedSlots(data.map(r => r.hora));
        };
        checkAvailability();
    }, [selectedInst, date]);

    const handleBooking = async (time) => {
        if (!confirm(`¿Confirmar reserva para el ${date} a las ${time}?`)) return;
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();

        const { error } = await supabase.from('reservas').insert([
            {
                user_id: user.id,
                installation_id: selectedInst,
                fecha: date,
                hora: time
            }
        ]);

        if (error) alert('Error al reservar: ' + error.message);
        else {
            alert('¡Reserva confirmada!');
            navigate('/dashboard');
        }
        setLoading(false);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <h1 className="text-3xl font-bold text-white mb-6">Nueva Reserva</h1>

            {/* SELECCIÓN DE PISTA Y FECHA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#1A1A2E] p-6 rounded-3xl border border-white/5">
                <div>
                    <label className="text-gray-400 text-sm font-bold mb-2 block">Selecciona Pista</label>
                    <div className="grid grid-cols-2 gap-3">
                        {instalaciones.map((inst) => (
                            <button
                                key={inst.id}
                                onClick={() => setSelectedInst(inst.id)}
                                className={`p-3 rounded-xl text-sm font-bold border transition-all ${selectedInst === inst.id
                                        ? 'bg-brand-lime text-black border-brand-lime'
                                        : 'bg-[#0F0F1A] text-gray-400 border-white/10 hover:border-white/30'
                                    }`}
                            >
                                {inst.nombre}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="text-gray-400 text-sm font-bold mb-2 block">Fecha</label>
                    <input
                        type="date"
                        value={date}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-[#0F0F1A] border border-white/10 text-white rounded-xl p-3 focus:border-brand-lime outline-none"
                    />
                </div>
            </div>

            {/* HORARIOS */}
            <div>
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <Clock className="text-brand-lime" /> Horarios Disponibles
                </h3>
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {timeSlots.map((time) => {
                        const isOccupied = occupiedSlots.includes(time);
                        return (
                            <button
                                key={time}
                                disabled={isOccupied || loading}
                                onClick={() => handleBooking(time)}
                                className={`py-4 rounded-2xl font-bold text-lg transition-all relative overflow-hidden group ${isOccupied
                                        ? 'bg-red-500/10 text-red-500 border border-red-500/20 cursor-not-allowed opacity-50'
                                        : 'bg-[#1F1F2E] text-white border border-brand-lime/20 hover:bg-brand-lime hover:text-black hover:shadow-[0_0_15px_rgba(204,255,0,0.4)]'
                                    }`}
                            >
                                {time}
                                {isOccupied && <span className="text-[10px] block font-normal">OCUPADO</span>}
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    );
}