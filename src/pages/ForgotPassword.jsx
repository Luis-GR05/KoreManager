import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, CheckCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import AuthShell from '../components/auth/AuthShell';
import Seo from '../components/Seo';
import useCountdown from '../hooks/useCountdown';
import { forgotLimiter, authErrorKey } from '../lib/rateLimit';
import { normalizeEmail, validateEmail } from '../lib/validation';

/**
 * Recuperación de contraseña.
 * Seguridad: la respuesta es siempre la misma exista o no la cuenta (no se
 * filtra qué correos están registrados) y hay un enfriamiento entre envíos.
 */
export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [lockSeconds, startLock] = useCountdown(Math.ceil(forgotLimiter.retryIn() / 1000));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting || lockSeconds > 0) return;
    const v = validateEmail(email);
    if (v) { setError(t(`validation.${v.key}`)); return; }
    setError('');
    setSubmitting(true);
    try {
      const wait = forgotLimiter.hit();
      if (wait > 0) startLock(Math.ceil(wait / 1000));
      const { error: err } = await supabase.auth.resetPasswordForEmail(normalizeEmail(email), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (err && authErrorKey(err) === 'auth.rateLimited') {
        setError(t('auth.rateLimited'));
        return;
      }
      if (err && authErrorKey(err) === 'auth.network') {
        setError(t('auth.network'));
        return;
      }
      setIsSuccess(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title={isSuccess ? t('forgot.checkInbox') : t('forgot.title')}
      subtitle={isSuccess ? undefined : t('forgot.desc')}
      backTo="/login"
      backLabel={t('forgot.backToLogin')}
    >
      <Seo title={t('seo.forgotTitle')} path="/forgot-password" />
      {isSuccess ? (
        <div role="status">
          <div className="mb-6 grid h-16 w-16 place-items-center rounded-full bg-brand-purple/10 dark:bg-brand-lime/10">
            <CheckCircle size={32} className="text-brand-purple dark:text-brand-lime" aria-hidden="true" />
          </div>
          <p className="theme-faint leading-relaxed">{t('forgot.sentGeneric')}</p>
          <Link
            to="/login"
            className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-xl border theme-border font-bold theme-text transition-colors hover:theme-elevated"
          >
            {t('forgot.goToLogin')}
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <Input
            icon={Mail}
            id="forgot-email"
            name="email"
            type="email"
            label={t('auth.email')}
            placeholder={t('forgot.emailPlaceholder')}
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            error={error}
            required
          />
          <Button type="submit" variant="primary" isLoading={submitting} disabled={lockSeconds > 0} className="w-full h-12">
            {lockSeconds > 0 ? t('common.retryIn', { s: lockSeconds }) : t('forgot.submit')}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
