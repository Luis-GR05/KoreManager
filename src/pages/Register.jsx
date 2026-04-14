// src/pages/Register.jsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/useAuth';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, Phone, MapPin, Calendar, IdCard, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function Register() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    dni: '',
    birthDate: '',
    address: '',
    postalCode: '',
    city: '',
    province: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    acceptPrivacy: false,
  });

  // Si ya hay sesión activa → ir al dashboard directamente
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden. Por favor, asegúrate de escribirlas igual.');
      return;
    }

    if (!formData.acceptTerms || !formData.acceptPrivacy) {
      toast.error('Debes aceptar los Términos de uso y la Política de privacidad para registrarte.');
      return;
    }

    setLoading(true);
    console.log('Intentando registro...');

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
            dni: formData.dni,
            fecha_nacimiento: formData.birthDate,
            direccion: formData.address,
            codigo_postal: formData.postalCode,
            municipio: formData.city,
            provincia: formData.province,
            consent_terms: true,
            consent_privacy: true,
            consent_ts: new Date().toISOString(),
          }
        }
      });
      
      if (error) throw error;

      // Si hay sesión inmediatamente (según configuración Supabase), guardamos extra también en profiles.
      // Si no hay columnas o no hay sesión (confirmación email), no bloqueamos el flujo.
      if (data?.session?.user?.id) {
        const userId = data.session.user.id;
        const attempt = await supabase.from('profiles').update({
          telefono: formData.phone,
          full_name: formData.fullName,
          dni: formData.dni || null,
          fecha_nacimiento: formData.birthDate || null,
          direccion: formData.address || null,
          codigo_postal: formData.postalCode || null,
          municipio: formData.city || null,
          provincia: formData.province || null,
        }).eq('id', userId);
        if (attempt.error) {
          // fallback mínimo
          await supabase.from('profiles').update({
            telefono: formData.phone,
            full_name: formData.fullName,
          }).eq('id', userId);
        }
      }
      
      toast.success('¡Registro exitoso! Ya puedes iniciar sesión.');
      // Enviar al usuario al login
      navigate('/login');
    } catch (error) {
      console.error('Catch handler (Register):', error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-dark-base p-4 relative overflow-hidden">
      {/* Fondos decorativos */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-lime/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-purple/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-dark-surface/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative z-10 my-8">

        <div className="flex items-center justify-between mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            Volver a la landing
          </Link>
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
            KORE <span className="text-brand-lime">MANAGER</span>
          </h1>
          <p className="text-gray-400 text-sm">Crea tu cuenta gratuita</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <Input
            icon={User}
            name="fullName"
            type="text"
            placeholder="Nombre Completo"
            value={formData.fullName}
            onChange={handleChange}
            required
          />

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
            icon={Phone}
            name="phone"
            type="tel"
            placeholder="Teléfono (ej: +34 600000000)"
            value={formData.phone}
            onChange={handleChange}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              icon={IdCard}
              name="dni"
              type="text"
              placeholder="DNI/NIE"
              value={formData.dni}
              onChange={handleChange}
              required
            />
            <Input
              icon={Calendar}
              name="birthDate"
              type="date"
              value={formData.birthDate}
              onChange={handleChange}
              required
            />
          </div>

          <Input
            icon={MapPin}
            name="address"
            type="text"
            placeholder="Dirección"
            value={formData.address}
            onChange={handleChange}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              icon={MapPin}
              name="postalCode"
              type="text"
              placeholder="Código postal"
              value={formData.postalCode}
              onChange={handleChange}
              required
            />
            <Input
              icon={MapPin}
              name="city"
              type="text"
              placeholder="Municipio"
              value={formData.city}
              onChange={handleChange}
              required
            />
            <Input
              icon={MapPin}
              name="province"
              type="text"
              placeholder="Provincia"
              value={formData.province}
              onChange={handleChange}
              required
            />
          </div>

          {/* Input de contraseña */}
          <div className="relative group">
            <Input
              icon={Lock}
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Contraseña (mín. 6 caracteres)"
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

          {/* Confirmar contraseña */}
          <div className="relative group">
            <Input
              icon={Lock}
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirmar Contraseña"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="pr-12"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors z-10"
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <Button type="submit" variant="primary" isLoading={loading} className="w-full mt-4">
            Crear Cuenta
            {!loading && <ArrowRight size={20} />}
          </Button>
        </form>

        <div className="mt-4 space-y-3 text-xs text-gray-400">
          <label className="flex items-start gap-2 select-none">
            <input
              type="checkbox"
              name="acceptTerms"
              checked={formData.acceptTerms}
              onChange={handleChange}
              className="mt-1"
            />
            <span>
              Acepto los{' '}
              <Link to="/legal/terminos" className="text-white font-bold hover:text-brand-lime transition-colors">
                Términos de uso
              </Link>
              .
            </span>
          </label>
          <label className="flex items-start gap-2 select-none">
            <input
              type="checkbox"
              name="acceptPrivacy"
              checked={formData.acceptPrivacy}
              onChange={handleChange}
              className="mt-1"
            />
            <span>
              He leído y acepto la{' '}
              <Link to="/legal/privacidad" className="text-white font-bold hover:text-brand-lime transition-colors">
                Política de privacidad
              </Link>
              {' '}y la{' '}
              <Link to="/legal/cookies" className="text-white font-bold hover:text-brand-lime transition-colors">
                Política de cookies
              </Link>
              .
            </span>
          </label>
          <p className="text-[11px] text-gray-500">
            Tus datos se usarán para gestionar tu cuenta y tus reservas. Puedes ejercer tus derechos conforme al RGPD (España).
          </p>
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-white font-bold hover:text-brand-lime transition-colors">
              Inicia Sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
