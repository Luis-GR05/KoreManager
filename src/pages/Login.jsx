import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/useAuth';
import { Mail, Lock, ArrowRight, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

/**
 * Página de login:
 * - autentica con Supabase (email/password)
 * - redirige a la ruta original guardada por `ProtectedRoute`
 *
 * @returns {import('react').JSX.Element}
 */
export default function Login() {
  const { t } = useTranslation();
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, loading: authLoading } = useAuth();

  const [submitting,    setSubmitting]    = useState(false);
  const [showPassword,  setShowPassword]  = useState(false);
  const [formData,      setFormData]      = useState({ email: '', password: '' });

  const from = location.state?.from?.pathname ?? '/dashboard';

  useEffect(() => {
    if (!authLoading && user) {
      navigate(from, { replace: true });
    }
  }, [user, authLoading, navigate, from]);

  /**
   * Actualiza el estado del formulario.
   * @param {import('react').ChangeEvent<HTMLInputElement>} e
   * @returns {void}
   */
  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  /**
   * Envía credenciales a Supabase y deja que el AuthContext gestione la navegación.
   * @param {import('react').FormEvent} e
   * @returns {Promise<void>}
   */
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

      toast.success(t('landing.login.success'), { duration: 2000 });

    } catch (error) {
      const msg = error.message === 'Invalid login credentials'
        ? t('landing.login.errorCreds')
        : error.message;
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center theme-bg p-4 relative overflow-hidden">

      {/* Fondos decorativos */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-purple/10 dark:bg-brand-lime/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-purple/5 dark:bg-brand-purple/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md theme-card backdrop-blur-xl border theme-border p-8 shadow-2xl relative z-10">

        <div className="flex items-center justify-between mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-bold theme-faint hover:theme-text transition-colors"
          >
            <ArrowLeft size={16} />
            {t('landing.login.back')}
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold theme-text mb-2 tracking-tight">
            KORE <span className="text-brand-purple dark:text-brand-lime">MANAGER</span>
          </h1>
          <p className="theme-faint text-sm">{t('landing.login.welcome')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            icon={Mail}
            name="email"
            type="email"
            placeholder={t('landing.login.emailPlaceholder')}
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
              className="absolute right-4 top-1/2 -translate-y-1/2 theme-faint hover:theme-text transition-colors z-10"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="flex justify-end mt-1">
            <Link to="/forgot-password" className="text-sm font-bold theme-faint hover:text-brand-purple dark:hover:text-brand-lime transition-colors">
              {t('landing.login.forgot')}
            </Link>
          </div>

          <Button type="submit" variant="primary" isLoading={submitting} className="w-full mt-2">
            {t('landing.login.submit')}
            {!submitting && <ArrowRight size={20} />}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="theme-faint text-sm">
            {t('landing.login.noAccount')}
            <Link to="/register" className="ml-2 theme-text font-bold hover:text-brand-purple dark:hover:text-brand-lime transition-colors">
              {t('landing.login.register')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}