// src/pages/Login.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function Login() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, loading: authLoading } = useAuth();

  const [submitting,    setSubmitting]    = useState(false);
  const [showPassword,  setShowPassword]  = useState(false);
  const [formData,      setFormData]      = useState({ email: '', password: '' });

  // Ruta destino tras login (guardada por ProtectedRoute, o /dashboard por defecto)
  const from = location.state?.from?.pathname ?? '/dashboard';

  // Si ya hay sesión → redirigir (ej: usuario llega a /login estando ya autenticado)
  useEffect(() => {
    if (!authLoading && user) {
      navigate(from, { replace: true });
    }
  }, [user, authLoading, navigate, from]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email:    formData.email.trim(),
        password: formData.password,
      });

      if (error) throw error;

      // No llamamos a navigate() aquí.
      // El useEffect de arriba reacciona al cambio de `user` en AuthContext
      // (disparado por onAuthStateChange → SIGNED_IN) y navega automáticamente.
      // Esto evita condiciones de carrera y dobles navegaciones.
      toast.success('¡Sesión iniciada!', { duration: 2000 });

    } catch (error) {
      const msg = error.message === 'Invalid login credentials'
        ? 'Email o contraseña incorrectos.'
        : error.message;
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-dark-base p-4 relative overflow-hidden">

      {/* Fondos decorativos */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-lime/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-purple/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-dark-surface/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative z-10">

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
            KORE <span className="text-brand-lime">MANAGER</span>
          </h1>
          <p className="text-gray-400 text-sm">Bienvenido de nuevo</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            icon={Mail}
            name="email"
            type="email"
            placeholder="correo@ejemplo.com"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <div className="relative group">
            <Input
              icon={Lock}
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
              className="pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors z-10"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <Button type="submit" variant="primary" isLoading={submitting} className="w-full mt-2">
            Iniciar Sesión
            {!submitting && <ArrowRight size={20} />}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            ¿No tienes cuenta?
            <Link to="/register" className="ml-2 text-white font-bold hover:text-brand-lime transition-colors">
              Regístrate Gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}