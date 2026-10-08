import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/useAuth';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import PasswordInput from '../components/ui/PasswordInput';
import AuthShell from '../components/auth/AuthShell';
import Seo from '../components/Seo';
import useCountdown from '../hooks/useCountdown';
import { loginLimiter, authErrorKey } from '../lib/rateLimit';
import { normalizeEmail, validateEmail } from '../lib/validation';

/**
 * Página de login:
 * - autentica con Supabase (email/password)
 * - limita los intentos fallidos (bloqueo progresivo con cuenta atrás)
 * - redirige a la ruta original guardada por `ProtectedRoute`
 *
 * @returns {import('react').JSX.Element}
 */
export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();

  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [lockSeconds, startLock] = useCountdown(Math.ceil(loginLimiter.retryIn() / 1000));

  // Solo rutas internas como destino (evita redirecciones abiertas)
  const rawFrom = location.state?.from?.pathname ?? '/dashboard';
  const from = typeof rawFrom === 'string' && rawFrom.startsWith('/') && !rawFrom.startsWith('//') ? rawFrom : '/dashboard';

  useEffect(() => {
    if (!authLoading && user) navigate(from, { replace: true });
  }, [user, authLoading, navigate, from]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting || lockSeconds > 0) return;

    const emailErr = validateEmail(formData.email);
    const next = {
      email: emailErr ? t(`validation.${emailErr.key}`) : undefined,
      password: formData.password ? undefined : t('validation.required'),
    };
    setErrors(next);
    if (next.email || next.password) return;

    setSubmitting(true);
    setFormError('');
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: normalizeEmail(formData.email),
        password: formData.password,
      });
      if (error) throw error;
      loginLimiter.reset();
      toast.success(t('landing.login.success'), { duration: 2000 });
    } catch (error) {
      const key = authErrorKey(error);
      if (key !== 'auth.network' && key !== 'auth.emailNotConfirmed') {
        const wait = loginLimiter.hit();
        if (wait > 0) startLock(Math.ceil(wait / 1000));
      }
      setFormError(t(key || 'landing.login.errorCreds'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title={t('landing.login.welcome')}
      footer={(
        <p>
          {t('landing.login.noAccount')}{' '}
          <Link to="/register" className="font-bold theme-text underline-offset-4 hover:underline hover:text-brand-purple dark:hover:text-brand-lime">
            {t('landing.login.register')}
          </Link>
        </p>
      )}
    >
      <Seo title={t('seo.loginTitle')} description={t('seo.loginDesc')} path="/login" />

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {formError && (
          <div role="alert" className="rounded-xl border border-semantic-danger/30 bg-semantic-danger/10 px-4 py-3 text-sm font-medium text-semantic-danger">
            {lockSeconds > 0 ? t('auth.tooMany', { s: lockSeconds }) : formError}
          </div>
        )}

        <Input
          icon={Mail}
          id="login-email"
          name="email"
          type="email"
          label={t('auth.email')}
          placeholder={t('landing.login.emailPlaceholder')}
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          spellCheck={false}
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          required
        />

        <div>
          <PasswordInput
            id="login-password"
            name="password"
            label={t('auth.password')}
            placeholder="••••••••"
            autoComplete="current-password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            required
          />
          <div className="mt-2 flex justify-end">
            <Link to="/forgot-password" className="text-sm font-semibold theme-faint hover:text-brand-purple dark:hover:text-brand-lime transition-colors">
              {t('landing.login.forgot')}
            </Link>
          </div>
        </div>

        <Button type="submit" variant="primary" isLoading={submitting} disabled={lockSeconds > 0} className="w-full h-12">
          {lockSeconds > 0 ? t('common.retryIn', { s: lockSeconds }) : t('landing.login.submit')}
        </Button>
      </form>
    </AuthShell>
  );
}
