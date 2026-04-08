// src/pages/Login.jsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function Login() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({ email: '', password: '' });

  // Si ya hay sesión activa → ir al dashboard directamente
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    console.log('--- Iniciando login ---');

    try {
      const loginPromise = supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT_ERROR: Supabase no responde después de 8 segundos.')), 8000)
      );

      const { data, error } = await Promise.race([loginPromise, timeoutPromise]);

      if (error) {
        console.error('Error de Supabase (Login):', error);
        throw error;
      }

      console.log('Login exitoso. Data recuperada:', data);
      toast.success('Sesión iniciada. Entrando...', { duration: 3000 });

      // Forzamos la navegación tras un breve delay si el useEffect fallara
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 800);
    } catch (error) {
      console.error('Catch handler:', error.message);
      const msg = error.message === 'Invalid login credentials'
        ? 'Email o contraseña incorrectos.'
        : error.message;
      toast.error(msg);
    } finally {
      setLoading(false);
      console.log('--- Fin login, loading=false ---');
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
          <p className="text-gray-400 text-sm">
            Bienvenido de nuevo
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <Input
            icon={Mail}
            name="email"
            type="email"
            placeholder="correo@ejemplo.com"
            value={formData.email}
            onChange={handleChange}
            required
          />

          {/* Input de contraseña con toggle de visibilidad */}
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
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors z-10"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <Button type="submit" variant="primary" isLoading={loading} className="w-full mt-2">
            Iniciar Sesión
            {!loading && <ArrowRight size={20} />}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            ¿No tienes cuenta?
            <Link
              to="/register"
              className="ml-2 text-white font-bold hover:text-brand-lime transition-colors"
            >
              Regístrate Gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}