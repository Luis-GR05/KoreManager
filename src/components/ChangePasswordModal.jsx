import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/useAuth';
import Button from './ui/Button';
import PasswordInput, { PasswordStrength } from './ui/PasswordInput';
import { validatePassword, validatePasswordMatch } from '../lib/validation';
import { authErrorKey } from '../lib/rateLimit';

/**
 * Modal para cambiar la contraseña (misma política que el registro).
 * Accesible: role="dialog", foco inicial, cierre con Escape y clic fuera.
 */
export default function ChangePasswordModal({ isOpen, onClose }) {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const id = setTimeout(() => dialogRef.current?.querySelector('input')?.focus(), 50);
    return () => { window.removeEventListener('keydown', onKey); clearTimeout(id); };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const personal = [user?.email, profile?.full_name];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const p = validatePassword(password, personal);
    const c = validatePasswordMatch(password, confirmPassword);
    const next = {
      password: p ? t(`validation.${p.key}`, p.vars) : undefined,
      confirm: c ? t(`validation.${c.key}`) : undefined,
    };
    setErrors(next);
    if (next.password || next.confirm) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setIsSuccess(true);
      toast.success(t('changePassword.successToast'));
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
        setPassword('');
        setConfirmPassword('');
      }, 2000);
    } catch (error) {
      const key = authErrorKey(error);
      toast.error(key ? t(key) : t('changePassword.errors.updateError'));
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-pw-title"
        className="relative w-full max-w-md rounded-3xl border theme-border theme-surface p-8 shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t('common.closeMenu')}
          className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-xl theme-faint transition-colors hover:theme-text hover:theme-elevated"
        >
          <X size={16} aria-hidden="true" />
        </button>

        {isSuccess ? (
          <div className="py-6 text-center" role="status">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-brand-purple/10 dark:bg-brand-lime/10">
              <CheckCircle className="h-8 w-8 text-brand-purple dark:text-brand-lime" aria-hidden="true" />
            </div>
            <h2 id="change-pw-title" className="text-xl font-bold theme-text">{t('changePassword.successTitle')}</h2>
          </div>
        ) : (
          <>
            <h2 id="change-pw-title" className="font-display text-3xl font-black uppercase theme-text">{t('changePassword.title')}</h2>
            <p className="mb-6 mt-1 text-sm theme-faint">{t('changePassword.desc')}</p>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <PasswordInput
                  id="cp-password"
                  name="password"
                  label={t('changePassword.newPassword')}
                  autoComplete="new-password"
                  maxLength={72}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={errors.password}
                  aria-describedby="cp-strength"
                  required
                />
                <PasswordStrength id="cp-strength" value={password} personal={personal} />
              </div>
              <PasswordInput
                id="cp-password2"
                name="confirmPassword"
                label={t('changePassword.repeatPassword')}
                autoComplete="new-password"
                maxLength={72}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={errors.confirm}
                required
              />
              <Button type="submit" variant="primary" isLoading={submitting} className="mt-2 h-12 w-full">
                {t('changePassword.save')}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
