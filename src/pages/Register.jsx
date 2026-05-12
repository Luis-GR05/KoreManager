import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/useAuth';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, Phone, MapPin, Calendar, IdCard, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

/**
 * Página de registro:
 * - valida campos obligatorios (incl. aceptación legal)
 * - crea usuario en Supabase Auth y guarda metadatos
 *
 * @returns {import('react').JSX.Element}
 */
export default function Register() {
  const { t } = useTranslation();
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

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  /**
   * Actualiza el estado del formulario (inputs + checkboxes).
   * @param {import('react').ChangeEvent<HTMLInputElement|HTMLSelectElement>} e
   * @returns {void}
   */
  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  /**
   * Crea el usuario en Supabase Auth y persiste metadatos de perfil.
   * @param {import('react').FormEvent} e
   * @returns {Promise<void>}
   */
  const handleRegister = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (formData.password.length < 6) {
      toast.error(t('register.errorMinChars'));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error(t('register.errorMatch'));
      return;
    }

    // VALIDACIONES DE SEGURIDAD
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error(t('register.errorEmail'));
      return;
    }

    const phoneRegex = /^[0-9+]{9,15}$/;
    if (!phoneRegex.test(formData.phone)) {
      toast.error(t('register.errorPhone'));
      return;
    }

    const dniRegex = /^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/i;
    const nieRegex = /^[XYZ][0-9]{7}[TRWAGMYFPDXBNJZSQVHLCKE]$/i;
    if (!dniRegex.test(formData.dni) && !nieRegex.test(formData.dni)) {
      toast.error(t('register.errorDni'));
      return;
    }

    if (!formData.acceptTerms || !formData.acceptPrivacy) {
      toast.error(t('register.errorTerms'));
      return;
    }

    setLoading(true);

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
      
      toast.success(t('register.success'));
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
    <div className="min-h-screen w-full flex items-center justify-center theme-bg p-4 relative overflow-hidden">
      {/* Fondos decorativos */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-purple/10 dark:bg-brand-lime/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-purple/5 dark:bg-brand-purple/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md theme-card backdrop-blur-xl border theme-border p-8 shadow-2xl relative z-10 my-8">

        <div className="flex items-center justify-between mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-bold theme-faint hover:theme-text transition-colors"
          >
            <ArrowLeft size={16} />
            {t('register.back')}
          </Link>
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold theme-text mb-2 tracking-tight">
            KORE <span className="text-brand-purple dark:text-brand-lime">MANAGER</span>
          </h1>
          <p className="theme-faint text-sm">{t('register.title')}</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <Input
            icon={User}
            name="fullName"
            type="text"
            placeholder={t('register.fullName')}
            value={formData.fullName}
            onChange={handleChange}
            required
          />

          <Input
            icon={Mail}
            name="email"
            type="email"
            placeholder={t('register.emailPlaceholder')}
            value={formData.email}
            onChange={handleChange}
            required
          />

          <Input
            icon={Phone}
            name="phone"
            type="tel"
            placeholder={t('register.phone')}
            value={formData.phone}
            onChange={handleChange}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              icon={IdCard}
              name="dni"
              type="text"
              placeholder={t('register.dni')}
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
            placeholder={t('register.address')}
            value={formData.address}
            onChange={handleChange}
            required
          />

          <Input
              icon={MapPin}
              name="postalCode"
              type="text"
              placeholder={t('register.postalCode')}
              value={formData.postalCode}
              onChange={handleChange}
              required
            />
            <Input
              icon={MapPin}
              name="city"
              type="text"
              placeholder={t('register.city')}
              value={formData.city}
              onChange={handleChange}
              required
            />
            <Input
              icon={MapPin}
              name="province"
              type="text"
              placeholder={t('register.province')}
              value={formData.province}
              onChange={handleChange}
              required
            />

          {/* Input de contraseña */}
          <div className="relative group">
            <Input
              icon={Lock}
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder={t('register.password')}
              value={formData.password}
              onChange={handleChange}
              required
              className="pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 theme-faint hover:theme-text transition-colors z-10"
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
              placeholder={t('register.confirmPassword')}
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="pr-12"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 theme-faint hover:theme-text transition-colors z-10"
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Aceptación de términos (Movido arriba del botón) */}
          <div className="mt-6 space-y-3 text-xs theme-faint">
            <label className="flex items-start gap-3 select-none cursor-pointer group">
              <input
                type="checkbox"
                name="acceptTerms"
                checked={formData.acceptTerms}
                onChange={handleChange}
                className="mt-1 w-4 h-4 rounded border-theme-border text-brand-purple focus:ring-brand-purple"
              />
              <span className="group-hover:theme-text transition-colors">
                {t('register.acceptTermsPrefix')}
                <Link to="/legal/terminos" className="theme-text font-bold hover:text-brand-purple dark:hover:text-brand-lime transition-colors">
                  {t('register.terms')}
                </Link>
                .
              </span>
            </label>
            <label className="flex items-start gap-3 select-none cursor-pointer group">
              <input
                type="checkbox"
                name="acceptPrivacy"
                checked={formData.acceptPrivacy}
                onChange={handleChange}
                className="mt-1 w-4 h-4 rounded border-theme-border text-brand-purple focus:ring-brand-purple"
              />
              <span className="group-hover:theme-text transition-colors">
                {t('register.acceptPrivacyPrefix')}
                <Link to="/legal/privacidad" className="theme-text font-bold hover:text-brand-purple dark:hover:text-brand-lime transition-colors">
                  {t('register.privacy')}
                </Link>
                {t('register.and')}
                <Link to="/legal/cookies" className="theme-text font-bold hover:text-brand-purple dark:hover:text-brand-lime transition-colors">
                  {t('register.cookies')}
                </Link>
                .
              </span>
            </label>
            <p className="text-[11px] text-gray-500 italic mt-2">
              {t('register.legalWarning')}
            </p>
          </div>

          <Button 
            type="submit" 
            variant="primary" 
            isLoading={loading} 
            className="w-full mt-4"
            disabled={!formData.acceptTerms || !formData.acceptPrivacy}
          >
            {t('register.submit')}
            {!loading && <ArrowRight size={20} />}
          </Button>
        </form>

        <div className="mt-8 text-center pt-6 border-t theme-border">
          <p className="theme-faint text-sm">
            {t('register.hasAccount')}{' '}
            <Link to="/login" className="theme-text font-bold hover:text-brand-purple dark:hover:text-brand-lime transition-colors">
              {t('register.login')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
