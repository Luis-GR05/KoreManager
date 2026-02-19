// src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Mail, Lock, User, Phone, ArrowRight, Loader2 } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();

  // Estado para saber si estamos en modo Login o Registro
  const [isRegistering, setIsRegistering] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Datos del formulario
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      if (isRegistering) {
        // --- LÓGICA DE REGISTRO ---
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            // Pasamos estos datos para que el TRIGGER los capture
            data: {
              full_name: formData.fullName,
              phone: formData.phone // (Opcional, si ampliamos el trigger)
            }
          }
        });

        if (error) throw error;
        alert('¡Registro exitoso! Revisa tu correo o inicia sesión.');
        setIsRegistering(false); // Volvemos al login para que entre

      } else {
        // --- LÓGICA DE LOGIN ---
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;
        navigate('/dashboard');
      }

    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0F0F1A] p-4 relative overflow-hidden">

      {/* Fondo decorativo (Efecto Glow) */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-lime/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-purple/10 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-md bg-[#1A1A2E]/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-500">

        {/* Cabecera */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
            KORE <span className="text-brand-lime">MANAGER</span>
          </h1>
          <p className="text-gray-400 text-sm">
            {isRegistering ? 'Crea tu cuenta de deportista' : 'Bienvenido de nuevo'}
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleAuth} className="space-y-4">

          {/* Campo Nombre (Solo en Registro) */}
          {isRegistering && (
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand-lime transition-colors" size={20} />
              <input
                name="fullName"
                type="text"
                placeholder="Nombre Completo"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full bg-[#0F0F1A] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-brand-lime focus:outline-none transition-all"
                required
              />
            </div>
          )}

          {/* Campo Email */}
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand-lime transition-colors" size={20} />
            <input
              name="email"
              type="email"
              placeholder="correo@ejemplo.com"
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-[#0F0F1A] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-brand-lime focus:outline-none transition-all"
              required
            />
          </div>

          {/* Campo Contraseña */}
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand-lime transition-colors" size={20} />
            <input
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              className="w-full bg-[#0F0F1A] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-brand-lime focus:outline-none transition-all"
              required
            />
          </div>

          {/* Mensaje de Error */}
          {errorMsg && (
            <div className="text-red-400 text-sm text-center bg-red-500/10 p-2 rounded-lg border border-red-500/20">
              {errorMsg}
            </div>
          )}

          {/* Botón Principal */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-brand-lime text-black font-bold rounded-xl hover:shadow-[0_0_20px_rgba(204,255,0,0.4)] hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" /> : (
              isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'
            )}
            {!loading && <ArrowRight size={20} />}
          </button>
        </form>

        {/* Toggle Login/Registro */}
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            {isRegistering ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
            <button
              onClick={() => {
                setIsRegistering(!isRegistering);
                setErrorMsg(null);
              }}
              className="ml-2 text-white font-bold hover:text-brand-lime underline decoration-brand-lime/50 hover:decoration-brand-lime transition-all"
            >
              {isRegistering ? 'Inicia Sesión' : 'Regístrate Gratis'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}