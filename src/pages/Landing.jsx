// src/pages/Landing.jsx
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, MapPin, Shield } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0F0F1A] text-white overflow-x-hidden selection:bg-brand-lime selection:text-black">
      
      {/* --- NAVBAR --- */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto z-50 relative">
        <div className="text-2xl font-bold tracking-tighter cursor-default">
          MONTIJO<span className="text-brand-lime">SPORT</span>
        </div>
        
        {/* Botón Acceso Usuarios */}
        <Link 
          to="/login" 
          className="px-8 py-2.5 rounded-full text-sm font-bold border border-white/20 bg-white/5 backdrop-blur-sm
          transition-all duration-300 ease-out
          hover:border-brand-lime hover:text-brand-lime hover:bg-brand-lime/10 hover:shadow-[0_0_20px_rgba(204,255,0,0.4)] hover:scale-105"
        >
          Acceso Usuarios
        </Link>
      </nav>

      {/* --- HERO SECTION --- */}
      <header className="relative pt-20 pb-32 px-6 text-center max-w-5xl mx-auto">
        {/* Efecto de luz de fondo central */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-purple/20 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="relative z-10 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          {/* Badge de versión */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-lime/5 border border-brand-lime/20 text-brand-lime text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-brand-lime animate-pulse"></span>
            Sistema v1.0 Disponible
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
            El deporte en Montijo,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-lime to-emerald-400 filter drop-shadow-lg">
              ahora es digital.
            </span>
          </h1>
          
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Olvídate de las llamadas y el papel. Reserva pistas de pádel, fútbol y tenis en segundos. Consulta disponibilidad en tiempo real y gestiona tus partidos desde el móvil.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link 
              to="/login" 
              className="px-8 py-4 bg-brand-lime text-black rounded-full font-bold text-lg 
              shadow-[0_0_15px_rgba(204,255,0,0.3)]
              hover:scale-105 hover:shadow-[0_0_30px_rgba(204,255,0,0.6)] 
              transition-all duration-300 flex items-center gap-2 group"
            >
              Reservar Pista Ahora
              <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
            </Link>
            
            <button className="px-8 py-4 bg-[#1A1A2E] border border-gray-700 text-white rounded-full font-bold text-lg hover:bg-gray-800 hover:border-gray-500 transition-all">
              Ver Instalaciones
            </button>
          </div>
        </div>
      </header>

      {/* --- CARACTERÍSTICAS --- */}
      <section className="px-6 py-24 bg-gradient-to-b from-[#0F0F1A] to-[#13131F] border-t border-white/5 relative">
        <div className="max-w-7xl mx-auto">
          
          {/* Título de sección pequeño */}
          <h2 className="text-center text-sm font-bold text-brand-gray uppercase tracking-widest mb-12">
            ¿Por qué usar la app?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Card 1: Reservas */}
            <div className="bg-[#1F1F2E] p-8 rounded-3xl border border-white/5 shadow-xl hover:shadow-2xl transition-all duration-300 group hover:-translate-y-2 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="w-14 h-14 bg-[#2A2A40] rounded-2xl flex items-center justify-center mb-6 text-brand-purple border border-white/5 group-hover:scale-110 group-hover:border-brand-purple/30 transition-all duration-300 relative z-10">
                <CheckCircle size={28} />
              </div>
              
              <h3 className="text-xl font-bold mb-3 text-white relative z-10">Reservas al instante</h3>
              <p className="text-gray-400 relative z-10 leading-relaxed">
                Consulta el calendario en vivo y asegura tu pista sin esperas ni desplazamientos innecesarios al pabellón.
              </p>
            </div>

            {/* Card 2: Instalaciones (Destacada) */}
            <div className="bg-[#1F1F2E] p-8 rounded-3xl border border-white/5 shadow-xl hover:shadow-2xl transition-all duration-300 group hover:-translate-y-2 relative overflow-hidden">
               {/* Un toque de luz extra en la tarjeta central */}
              <div className="absolute inset-0 bg-gradient-to-br from-brand-lime/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="w-14 h-14 bg-[#2A2A40] rounded-2xl flex items-center justify-center mb-6 text-brand-lime border border-white/5 group-hover:scale-110 group-hover:border-brand-lime/30 transition-all duration-300 relative z-10">
                <MapPin size={28} />
              </div>
              
              <h3 className="text-xl font-bold mb-3 text-white relative z-10">Todas las instalaciones</h3>
              <p className="text-gray-400 relative z-10 leading-relaxed">
                Desde el Pabellón A hasta las pistas exteriores de tenis. Todo el complejo deportivo en tu bolsillo.
              </p>
            </div>

             {/* Card 3: Seguridad */}
             <div className="bg-[#1F1F2E] p-8 rounded-3xl border border-white/5 shadow-xl hover:shadow-2xl transition-all duration-300 group hover:-translate-y-2 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="w-14 h-14 bg-[#2A2A40] rounded-2xl flex items-center justify-center mb-6 text-blue-400 border border-white/5 group-hover:scale-110 group-hover:border-blue-400/30 transition-all duration-300 relative z-10">
                <Shield size={28} />
              </div>
              
              <h3 className="text-xl font-bold mb-3 text-white relative z-10">Acceso Seguro</h3>
              <p className="text-gray-400 relative z-10 leading-relaxed">
                Identifícate con tu cuenta personal y accede a tu historial deportivo y notificaciones del ayuntamiento.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-12 text-center border-t border-white/5 bg-[#0A0A12]">
        <p className="text-gray-500 text-sm mb-2">© 2026 Ayuntamiento de Montijo. Gestión Deportiva Municipal.</p>
        <div className="flex justify-center gap-4 text-xs text-gray-600">
           <a href="#" className="hover:text-brand-lime transition-colors">Política de Privacidad</a>
           <span>•</span>
           <a href="#" className="hover:text-brand-lime transition-colors">Términos de Uso</a>
        </div>
      </footer>

    </div>
  );
}