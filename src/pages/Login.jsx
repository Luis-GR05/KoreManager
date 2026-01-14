import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const navigate = useNavigate(); 

  const handleSubmit = (e) => {
    e.preventDefault();
    // Por ahora, forzamos la navegación al Dashboard:
    navigate('/dashboard'); 
  };

  return (
    <div className="relative flex h-screen w-full items-center justify-center bg-[#0F0F1A] overflow-hidden">
      
      {/* --- FONDO --- */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full bg-brand-purple/20 blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full bg-brand-lime/10 blur-[120px] pointer-events-none translate-x-1/2 translate-y-1/2"></div>

      {/* --- TARJETA DE LOGIN --- */}
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-[#1A1A2E]/60 backdrop-blur-xl p-8 shadow-2xl border border-white/10">
        
        {/* Header - Logo */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            MONTIJO <span className="text-brand-lime">SPORT</span>
          </h1>
          <div className="mx-auto mt-3 h-1.5 w-16 rounded-full bg-brand-lime shadow-[0_0_10px_#CCFF00]"></div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-brand-gray uppercase tracking-wider ml-1">
              Usuario / DNI
            </label>
            <input
              type="text"
              placeholder="luis.gordillo"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl bg-[#0F0F15] border border-gray-700/50 p-4 text-white placeholder-gray-600 focus:border-brand-lime focus:ring-1 focus:ring-brand-lime focus:outline-none transition-all duration-300"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-brand-gray uppercase tracking-wider ml-1">
              Contraseña
            </label>
            <input
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl bg-[#0F0F15] border border-gray-700/50 p-4 text-white placeholder-gray-600 focus:border-brand-lime focus:ring-1 focus:ring-brand-lime focus:outline-none transition-all duration-300"
            />
          </div>

          {/* BOTÓN NEÓN */}
          <button
            type="submit"
            className="w-full mt-4 rounded-full bg-brand-lime py-4 font-extrabold text-[#0F0F1A] tracking-wide 
            transition-all duration-300 ease-out
            hover:scale-[1.03] hover:brightness-110 hover:shadow-[0_0_30px_rgba(204,255,0,0.6)]
            active:scale-95 active:brightness-90
            shadow-[0_0_15px_rgba(204,255,0,0.3)]
            cursor-pointer"
          >
            INICIAR SESIÓN
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-gray-500">
          ¿No tienes cuenta? <span className="text-brand-lime cursor-pointer hover:underline">Regístrate en el Ayuntamiento</span>
        </p>
      </div>
    </div>
  );
}