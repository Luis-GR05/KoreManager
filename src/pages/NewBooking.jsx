// src/pages/NewBooking.jsx
import { useMemo, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/useAuth';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, CheckCircle, AlertCircle, X, ChevronsUpDown, ChevronLeft, ChevronRight, Package } from 'lucide-react';
import toast from 'react-hot-toast';

const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00', '13:00',
  '16:00', '17:00', '18:00', '19:00', '20:00', '21:00',
];

function toISODate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function buildCalendarGrid(monthDate) {
  const firstOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const startWeekday = firstOfMonth.getDay(); // 0..6 (Dom..Sáb)
  const start = new Date(firstOfMonth);
  start.setDate(firstOfMonth.getDate() - startWeekday);

  const days = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

function CalendarModal({ value, minDate, onSelect, onClose }) {
  const selected = value ? new Date(`${value}T00:00:00`) : null;
  const min = minDate ? new Date(`${minDate}T00:00:00`) : null;

  const initial = selected || (min ? new Date(min) : new Date());
  const [cursor, setCursor] = useState(new Date(initial.getFullYear(), initial.getMonth(), 1));

  const monthLabel = cursor.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const grid = buildCalendarGrid(cursor);
  const today = startOfDay(new Date());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#1A1A2E] border border-white/10 rounded-3xl p-6 md:p-7 max-w-md w-full mx-4 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-lime/70">Selecciona día</p>
            <h3 className="text-xl font-black text-white mt-1 flex items-center gap-2">
              <Calendar size={18} className="text-brand-lime" />
              Calendario
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl border border-white/10 text-gray-300 hover:bg-white/5 transition-colors inline-flex items-center justify-center"
            aria-label="Cerrar calendario"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            className="w-10 h-10 rounded-2xl border border-white/10 text-gray-300 hover:bg-white/5 transition-colors inline-flex items-center justify-center"
            aria-label="Mes anterior"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="text-sm font-black text-white capitalize tracking-tight">
            {monthLabel}
          </div>

          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            className="w-10 h-10 rounded-2xl border border-white/10 text-gray-300 hover:bg-white/5 transition-colors inline-flex items-center justify-center"
            aria-label="Mes siguiente"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((d) => (
            <div key={d} className="text-center">{d}</div>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-7 gap-2">
          {grid.map((d) => {
            const inMonth = d.getMonth() === cursor.getMonth();
            const isToday = isSameDay(d, today);
            const isSelected = selected ? isSameDay(d, selected) : false;
            const disabled = min ? startOfDay(d) < startOfDay(min) : false;

            return (
              <button
                key={d.toISOString()}
                disabled={disabled}
                onClick={() => {
                  if (disabled) return;
                  onSelect(toISODate(d));
                  onClose();
                }}
                className={[
                  'h-11 rounded-2xl border text-sm font-black transition-all',
                  disabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/5 hover:border-white/20',
                  inMonth ? 'text-white' : 'text-gray-600',
                  isSelected ? 'bg-brand-lime text-black border-brand-lime shadow-[0_0_14px_rgba(204,255,0,0.28)]' : 'bg-[#0F0F1A] border-white/10',
                  !isSelected && isToday ? 'ring-1 ring-brand-lime/30' : '',
                ].join(' ')}
              >
                {d.getDate()}
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              const base = min ? new Date(`${minDate}T00:00:00`) : new Date();
              onSelect(toISODate(base));
              onClose();
            }}
            className="flex-1 py-3 rounded-2xl border border-white/10 text-gray-300 font-black hover:bg-white/5 transition-colors"
          >
            Hoy
          </button>
          <button
            onClick={() => {
              onSelect(minDate);
              onClose();
            }}
            className="flex-1 py-3 rounded-2xl bg-brand-lime text-black font-black hover:opacity-90 transition-opacity"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

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
  const [inventory, setInventory]         = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(true);
  const [materialReq, setMaterialReq]     = useState({}); // { [inventarioId]: qty }
  // Estado del modal personalizado
  const [pendingTime, setPendingTime]     = useState(null); // horario pendiente de confirmar
  const [calendarOpen, setCalendarOpen]   = useState(false);

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

  // Cargar inventario (material disponible) filtrado por tipo de pista
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoadingInventory(true);
      const tipo = String(selectedInstData?.tipo || 'general').toLowerCase();
      if (!selectedInstData?.tipo) {
        if (!alive) return;
        setInventory([]);
        setLoadingInventory(false);
        return;
      }
      const { data, error } = await supabase
        .from('inventario')
        .select('id, nombre, cantidad, tipo_pista')
        // Solo material del tipo de pista seleccionado
        .eq('tipo_pista', tipo)
        .order('nombre', { ascending: true });

      if (!alive) return;
      if (error) {
        console.warn('[Booking] inventario error:', error.message);
        setInventory([]);
      } else {
        setInventory(data || []);
      }
      setLoadingInventory(false);
    })();
    return () => { alive = false; };
  }, [selectedInstData?.tipo]);

  // Resetear solicitud de material al cambiar pista/fecha (para evitar confusiones)
  useEffect(() => {
    setMaterialReq({});
  }, [selectedInst, date]);

  // Comprobar disponibilidad al cambiar pista o fecha
  useEffect(() => {
    if (!selectedInst) return;
    supabase
      .rpc('get_occupied_slots', { inst_id: selectedInst, date_in: date })
      .then(({ data, error }) => {
        if (error) {
          console.warn('[Booking] get_occupied_slots error:', error.message);
          setOccupiedSlots([]);
          return;
        }
        setOccupiedSlots((data || []).map(r => String(r.hora).slice(0, 5)));
      });
  }, [selectedInst, date]);

  const handleSelectInst = (instId) => {
    const inst = instalaciones.find(i => i.id === Number(instId));
    if (!inst) return;
    setSelectedInst(inst.id);
    setSelectedInstData(inst);
  };

  const requestedMaterialRows = useMemo(() => {
    return Object.entries(materialReq)
      .map(([id, qty]) => ({ id: Number(id), qty: Number(qty) }))
      .filter(r => Number.isFinite(r.id) && Number.isFinite(r.qty) && r.qty > 0);
  }, [materialReq]);

  const setReqQty = (id, nextQty, maxQty) => {
    const safe = Math.max(0, Math.min(Number(nextQty) || 0, maxQty));
    setMaterialReq(prev => {
      const next = { ...prev };
      if (safe <= 0) delete next[id];
      else next[id] = safe;
      return next;
    });
  };

  // Valida y abre el modal (antes usaba window.confirm)
  const requestBooking = (time) => {
    const hoy = new Date().toISOString().split('T')[0];
    if (date < hoy) {
      toast.error('No puedes reservar en una fecha pasada.');
      return;
    }
    if (date === hoy) {
      const slotStart = new Date(`${date}T${time}:00`);
      if (slotStart.getTime() <= Date.now()) {
        toast.error('Ese horario ya ha pasado. Elige una franja posterior.');
        return;
      }
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

    const { data: inserted, error } = await supabase
      .from('reservas')
      .insert([{
        user_id: user.id,
        installation_id: selectedInst,
        fecha: date,
        hora: time,
        precio_cents: PRECIO_CENTS,
        currency: 'eur',
        payment_status: 'pending',
      }])
      .select('id')
      .single();

    toast.dismiss(toastId);

    if (error) {
      if (error.code === '23505') {
        toast.error('Ese horario ya fue reservado. Elige otro.');
        const { data } = await supabase.rpc('get_occupied_slots', { inst_id: selectedInst, date_in: date });
        setOccupiedSlots((data || []).map(r => String(r.hora).slice(0, 5)));
      } else {
        toast.error('Error al reservar: ' + error.message);
      }
    } else {
      // Recuperar ID insertado y lanzar pago (Stripe Checkout)
      const reservaId = inserted?.id;
      if (!reservaId) {
        toast.success('Reserva creada. Ve al historial para pagar.');
        navigate('/historial');
      } else {
        // Guardar material solicitado (si aplica)
        if (requestedMaterialRows.length > 0) {
          const rows = requestedMaterialRows.map(r => ({
            reserva_id: reservaId,
            inventario_id: r.id,
            cantidad: r.qty,
          }));

          const { error: matErr } = await supabase.from('reserva_material').insert(rows);
          if (matErr) {
            // rollback de reserva para evitar reservas sin material guardado (consistencia UI)
            await supabase.from('reservas').delete().eq('id', reservaId);
            toast.error('No se pudo guardar el material solicitado: ' + matErr.message);
            setLoading(false);
            return;
          }
        }

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
      {calendarOpen && (
        <CalendarModal
          value={date}
          minDate={new Date().toISOString().split('T')[0]}
          onSelect={setDate}
          onClose={() => setCalendarOpen(false)}
        />
      )}

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
            {/* Select estilizado (mobile-friendly) */}
            <div className="relative">
              <ChevronsUpDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <select
                value={selectedInst ?? ''}
                onChange={(e) => handleSelectInst(e.target.value)}
                className="w-full appearance-none bg-[#0F0F1A] border border-white/10 text-white rounded-2xl p-3 pr-12 font-bold focus:border-brand-lime outline-none transition-colors"
              >
                {instalaciones.map(inst => (
                  <option key={inst.id} value={inst.id}>
                    {inst.nombre}{inst.estado === 'mantenimiento' ? ' (Mantenimiento)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-gray-400 text-sm font-bold mb-3 block">Fecha</label>
            <button
              onClick={() => setCalendarOpen(true)}
              className="w-full bg-[#0F0F1A] border border-white/10 text-white rounded-2xl p-3 font-black focus:border-brand-lime outline-none
              hover:bg-white/5 hover:border-white/20 transition-colors flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <Calendar size={18} className="text-brand-lime" />
                {date}
              </span>
              <span className="text-gray-500 text-sm font-bold">Abrir</span>
            </button>

            {selectedInstData?.estado === 'mantenimiento' && (
              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-400 text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                Esta pista está en mantenimiento y no puede reservarse.
              </div>
            )}
          </div>
        </div>

        {/* Material */}
        <div className="bg-[#1A1A2E] p-6 rounded-3xl border border-white/5">
          <h3 className="text-white font-bold mb-1 flex items-center gap-2">
            <Package className="text-brand-purple" size={18} />
            Solicitar material
          </h3>
          <p className="text-xs text-gray-500 mb-5">
            Opcional. El conserje preparará el material para la pista seleccionada (según stock).
          </p>

          {loadingInventory ? (
            <p className="text-brand-lime animate-pulse text-sm">Cargando inventario...</p>
          ) : inventory.length === 0 ? (
            <p className="text-gray-500 text-sm">No hay material disponible.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {inventory.map((it) => {
                const maxQty = Math.max(0, Number(it.cantidad) || 0);
                const current = Number(materialReq[it.id] || 0);
                const disabled = maxQty === 0;
                return (
                  <div
                    key={it.id}
                    className={`rounded-2xl border p-4 flex items-center justify-between gap-3 ${
                      disabled ? 'bg-white/3 border-white/5 opacity-50' : 'bg-[#0F0F1A] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">{it.nombre}</p>
                      <p className="text-[11px] text-gray-500">
                        Stock: <span className="text-gray-300 font-bold">{maxQty}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={disabled || current <= 0}
                        onClick={() => setReqQty(it.id, current - 1, maxQty)}
                        className="w-10 h-10 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 disabled:opacity-30 transition-colors"
                        aria-label="Restar"
                      >
                        −
                      </button>
                      <div className="w-10 text-center font-black text-white tabular-nums">
                        {current}
                      </div>
                      <button
                        type="button"
                        disabled={disabled || current >= maxQty}
                        onClick={() => setReqQty(it.id, current + 1, maxQty)}
                        className="w-10 h-10 rounded-xl bg-brand-lime/10 border border-brand-lime/20 text-brand-lime hover:bg-brand-lime hover:text-black disabled:opacity-30 transition-colors"
                        aria-label="Sumar"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Horarios */}
        <div>
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <Clock className="text-brand-lime" /> Horarios Disponibles
          </h3>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {TIME_SLOTS.filter((time) => {
              const hoy = new Date().toISOString().split('T')[0];
              if (date !== hoy) return true;
              const slotStart = new Date(`${date}T${time}:00`);
              return slotStart.getTime() > Date.now();
            }).map((time) => {
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