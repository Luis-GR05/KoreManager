// src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function Login() {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
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
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: { data: { full_name: formData.fullName } }
        });
        if (error) throw error;
        toast.success('¡Registro exitoso! Inicia sesión.');
        setIsRegistering(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
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
    // Fíjate en el uso de bg-dark-base en lugar de #0F0F1A
    <div className="min-h-screen w-full flex items-center justify-center bg-dark-base p-4 relative overflow-hidden">

      {/* Efectos de fondo usando colores de marca */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-lime/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-purple/10 rounded-full blur-[120px]"></div>

      {/* Tarjeta usando bg-dark-surface */}
      <div className="w-full max-w-md bg-dark-surface/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-500 relative z-10">

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
            KORE <span className="text-brand-lime">MANAGER</span>
          </h1>
          <p className="text-gray-400 text-sm">
            {isRegistering ? 'Crea tu cuenta' : 'Bienvenido de nuevo'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">

          <div className="space-y-4">
            {isRegistering && (
              <Input
                icon={User}
                name="fullName"
                type="text"
                placeholder="Nombre Completo"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            )}

            <Input
              icon={Mail}
              name="email"
              type="email"
              placeholder="correo@ejemplo.com"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <Input
              icon={Lock}
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          {errorMsg && (
            <div className="text-semantic-danger text-sm text-center bg-semantic-danger/10 p-3 rounded-xl border border-semantic-danger/20 font-medium">
              {errorMsg}
            </div>
          )}

          {/* Uso de nuestro componente universal Button */}
          <Button
            type="submit"
            variant="primary"
            isLoading={loading}
            className="w-full"
          >
            {isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}
            {!loading && <ArrowRight size={20} />}
          </Button>

        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            {isRegistering ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setErrorMsg(null);
              }}
              className="ml-2 text-white font-bold hover:text-brand-lime transition-colors"
            >
              {isRegistering ? 'Inicia Sesión' : 'Regístrate Gratis'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}