import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../supabaseClient';
import Button from '../components/ui/Button';
import PasswordInput, { PasswordStrength } from '../components/ui/PasswordInput';
import AuthShell from '../components/auth/AuthShell';
import Seo from '../components/Seo';
import { resetLimiter, authErrorKey } from '../lib/rateLimit';
import { validatePassword, validatePasswordMatch } from '../lib/validation';

/**
 * Nueva contraseña tras el enlace de recuperación (misma política que el registro).
 */
export default function ResetPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [email, setEmail] = useState('');

  // El usuario debe llegar con una sesión de recuperación válida
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        toast.error(t('reset.errorLink'));
        navigate('/login');
      } else {
        setEmail(session.user?.email ?? '');
      }
    });
  }, [navigate, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const p = validatePassword(password, [email]);
    const c = validatePasswordMatch(password, confirmPassword);
    const next = {
      password: p ? t(`validation.${p.key}`, p.vars) : undefined,
      confirm: c ? t(`validation.${c.key}`) : undefined,
    };
    setErrors(next);
    if (next.password || next.confirm) return;

    if (resetLimiter.retryIn() > 0) { toast.error(t('auth.rateLimited')); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setIsSuccess(true);
      toast.success(t('reset.toastSuccess'));
      await supabase.auth.signOut();
      setTimeout(() => navigate('/login'), 3000);
    } catch (error) {
      resetLimiter.hit();
      const key = authErrorKey(error);
      toast.error(key ? t(key) : t('reset.toastError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell title={isSuccess ? t('reset.successTitle') : t('reset.title')} subtitle={isSuccess ? undefined : t('reset.desc')} backTo="/login">
      <Seo title={t('seo.resetTitle')} noindex />
      {isSuccess ? (
        <div role="status">
          <div className="mb-6 grid h-16 w-16 place-items-center rounded-full bg-brand-purple/10 dark:bg-brand-lime/10">
            <CheckCircle size={32} className="text-brand-purple dark:text-brand-lime" aria-hidden="true" />
          </div>
          <p className="theme-faint leading-relaxed">{t('reset.successDesc')}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div>
            <PasswordInput
              id="reset-password"
              name="password"
              label={t('reset.password')}
              autoComplete="new-password"
              maxLength={72}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              aria-describedby="reset-strength"
              required
            />
            <PasswordStrength id="reset-strength" value={password} personal={[email]} />
          </div>
          <PasswordInput
            id="reset-password2"
            name="confirmPassword"
            label={t('reset.confirmPassword')}
            autoComplete="new-password"
            maxLength={72}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={errors.confirm}
            required
          />
          <Button type="submit" variant="primary" isLoading={submitting} className="w-full h-12">
            {t('reset.submit')}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
