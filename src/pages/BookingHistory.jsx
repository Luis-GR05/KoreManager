// src/pages/BookingHistory.jsx
import { Calendar, Clock, MapPin, CheckCircle, XCircle } from 'lucide-react';

export default function BookingHistory() {
  // Simulamos datos de reservas
  const bookings = [
    {
      id: 1,
      sport: 'Pádel',
      court: 'Pista Principal',
      date: '2026-03-30',
      time: '18:00 - 19:30',
      status: 'upcoming',
      price: '15.00€'
    },
    {
      id: 2,
      sport: 'Tenis',
      court: 'Pista 2',
      date: '2026-03-25',
      time: '10:00 - 11:30',
      status: 'completed',
      price: '12.00€'
    },
    {
      id: 3,
      sport: 'Baloncesto',
      court: 'Pabellón Interior',
      date: '2026-03-20',
      time: '19:00 - 20:30',
      status: 'cancelled',
      price: '20.00€'
    }
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'upcoming':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-brand-lime/20 text-brand-lime border border-brand-lime/30">
            <Clock size={14} /> Próxima
          </span>
        );
      case 'completed':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-brand-purple/20 text-brand-purple border border-brand-purple/30">
            <CheckCircle size={14} /> Completada
          </span>
        );
      case 'cancelled':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-500 border border-red-500/30">
            <XCircle size={14} /> Cancelada
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Historial de <span className="text-brand-lime">Reservas</span>
        </h1>
        <p className="text-gray-400 mt-2">
          Consulta tus reservas pasadas y próximas.
        </p>
      </header>

      <div className="grid gap-4">
        {bookings.map((booking) => (
          <div
            key={booking.id}
            className="bg-dark-surface border border-white/5 rounded-2xl p-5 hover:border-brand-lime/30 transition-all duration-300 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-white">{booking.sport}</h3>
                {getStatusBadge(booking.status)}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-brand-purple" />
                  <span>{booking.court}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-brand-lime" />
                  <span>{booking.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-gray-500" />
                  <span>{booking.time}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-2">
              <span className="text-xl font-bold text-white">{booking.price}</span>
              {booking.status === 'upcoming' && (
                <button className="text-sm text-red-400 hover:text-red-300 transition-colors underline decoration-transparent hover:decoration-red-300 underline-offset-4">
                  Cancelar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {bookings.length === 0 && (
        <div className="text-center py-12 bg-dark-surface border border-white/5 rounded-2xl">
          <Calendar size={48} className="mx-auto text-gray-600 mb-4" />
          <h3 className="text-xl text-white font-medium mb-2">No tienes reservas</h3>
          <p className="text-gray-400">Aún no has realizado ninguna reserva en las instalaciones.</p>
        </div>
      )}
    </div>
  );
}
