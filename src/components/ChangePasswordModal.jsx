import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, CheckCircle, MailCheck, ArrowLeft, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/useAuth';
import Button from './ui/Button';
import PasswordInput, { PasswordStrength } from './ui/PasswordInput';
import { validatePassword, validatePasswordMatch } from '../lib/validation';
import { authErrorKey, createLimiter } from '../lib/rateLimit';
import useCountdown from '../hooks/useCountdown';

/** Intentos con la contraseña actual: 5 fallos → bloqueo creciente. */
const verifyLimiter = createLimiter('pw_verify', { max: 5, windowMs: 15 * 60 * 1000, lockMs: 60 * 1000 });
const RESEND_SECONDS = 60;
const CODE_LENGTH = 6;

/** "luisgorrod@gmail.com" → "lu••••••@gmail.com" */
function maskEmail(email = '') {
  const [name, domain] = String(email).split('@');
  if (!domain) return email;
  return `${name.slice(0, 2)}${'•'.repeat(Math.max(2, name.length - 2))}@${domain}`;
}

/**
 * Cambio de contraseña con doble verificación:
 * 1. Contraseña actual (se comprueba con Supabase) + nueva contraseña.
 * 2. Código de 6 dígitos enviado al correo (`reauthenticate`), que Supabase
 *    valida en el servidor al guardar la nueva contraseña.
 */
export default function ChangePasswordModal({ isOpen, onClose }) {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const [step, setStep] = useState('form'); // form | code | done
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [resendIn, startResend] = useCountdown(0);
  const [lockIn, startLock] = useCountdown(Math.ceil(verifyLimiter.retryIn() / 1000));
  const dialogRef = useRef(null);

  const reset = () => {
    setStep('form'); setCurrent(''); setPassword(''); setConfirmPassword(''); setCode(''); setErrors({});
  };
  const close = () => { reset(); onClose(); };

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const id = setTimeout(() => dialogRef.current?.querySelector('input')?.focus(), 50);
    return () => { window.removeEventListener('keydown', onKey); clearTimeout(id); };
  }, [isOpen, onClose, step]);

  if (!isOpen) return null;

  const personal = [user?.email, profile?.full_name];

  const sendCode = async () => {
    const { error } = await supabase.auth.reauthenticate();
    if (error) throw error;
    startResend(RESEND_SECONDS);
  };

  /* Paso 1: comprobar la contraseña actual y enviar el código */
  const handleVerify = async (e) => {
    e.preventDefault();
    if (submitting || lockIn > 0) return;
    const p = validatePassword(password, personal);
    const c = validatePasswordMatch(password, confirmPassword);
    const next = {
      current: current ? undefined : t('validation.required'),
      password: p ? t(`validation.${p.key}`, p.vars) : (password && password === current ? t('changePassword.errors.samePassword') : undefined),
      confirm: c ? t(`validation.${c.key}`) : undefined,
    };
    setErrors(next);
    if (next.current || next.password || next.confirm) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: user.email, password: current });
      if (error) {
        const wait = verifyLimiter.hit();
        if (wait > 0) startLock(wait / 1000);
        setErrors({ current: authErrorKey(error) === 'auth.rateLimited' ? t('auth.rateLimited') : t('changePassword.errors.wrongCurrent') });
        return;
      }
      verifyLimiter.reset();
      await sendCode();
      setStep('code');
    } catch (err) {
      const key = authErrorKey(err);
      toast.error(key ? t(key) : t('changePassword.errors.codeSend'));
    } finally {
      setSubmitting(false);
    }
  };

  /* Paso 2: guardar con el código del correo */
  const handleConfirm = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!new RegExp(`^\\d{${CODE_LENGTH}}$`).test(code)) {
      setErrors({ code: t('changePassword.errors.codeFormat', { n: CODE_LENGTH }) });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password, nonce: code });
      if (error) {
        const msg = String(error.message ?? '').toLowerCase();
        if (msg.includes('nonce') || msg.includes('otp') || msg.includes('expired') || msg.includes('invalid')) {
          setErrors({ code: t('changePassword.errors.codeInvalid') });
          return;
        }
        throw error;
      }
      setStep('done');
      toast.success(t('changePassword.successToast'));
      setTimeout(close, 2200);
    } catch (err) {
      const key = authErrorKey(err);
      toast.error(key ? t(key) : t('changePassword.errors.updateError'));
    } finally {
      setSubmitting(false);
    }
  };

  const resend = async () => {
    if (resendIn > 0) return;
    try {
      await sendCode();
      toast.success(t('changePassword.codeResent'));
    } catch (err) {
      const key = authErrorKey(err);
      toast.error(key ? t(key) : t('changePassword.errors.codeSend'));
    }
  };

  const renderSteps = () => (
    <ol className="mb-5 flex items-center gap-2 text-[11px] font-black uppercase tracking-wider" aria-label={t('changePassword.stepsLabel')}>
      {['verify', 'code'].map((s, i) => {
        const active = (step === 'form' && i === 0) || (step === 'code' && i === 1);
        const done = step === 'code' && i === 0;
        return (
          <li key={s} className="flex items-center gap-2" aria-current={active ? 'step' : undefined}>
            {i > 0 && <span className="h-px w-6 bg-current opacity-20" aria-hidden="true" />}
            <span className={`grid h-6 w-6 place-items-center rounded-full ${active || done ? 'bg-brand-purple text-white dark:bg-brand-lime dark:text-[#0F0F1A]' : 'theme-elevated theme-faint'}`}>
              {done ? <Check size={13} strokeWidth={3} aria-hidden="true" /> : i + 1}
            </span>
            <span className={active ? 'theme-text' : 'theme-faint'}>{t(`changePassword.steps.${s}`)}</span>
          </li>
        );
      })}
    </ol>
  );

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in"
      onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-pw-title"
        className="relative w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-3xl border theme-border theme-surface p-6 sm:p-8 shadow-2xl"
      >
        <button
          type="button"
          onClick={close}
          aria-label={t('common.closeMenu')}
          className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-xl theme-faint transition-colors hover:theme-text hover:theme-elevated"
        >
          <X size={16} aria-hidden="true" />
        </button>

        {step === 'done' && (
          <div className="py-6 text-center" role="status">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-brand-purple/10 dark:bg-brand-lime/10">
              <CheckCircle className="h-8 w-8 text-brand-purple dark:text-brand-lime" aria-hidden="true" />
            </div>
            <h2 id="change-pw-title" className="text-xl font-bold theme-text">{t('changePassword.successTitle')}</h2>
          </div>
        )}

        {step === 'form' && (
          <>
            <h2 id="change-pw-title" className="pr-10 font-display text-3xl font-black uppercase theme-text">{t('changePassword.title')}</h2>
            <p className="mb-5 mt-1 text-sm theme-faint">{t('changePassword.descVerify')}</p>
            {renderSteps()}
            <form onSubmit={handleVerify} noValidate className="space-y-4">
              <PasswordInput
                id="cp-current"
                name="currentPassword"
                label={t('changePassword.currentPassword')}
                autoComplete="current-password"
                maxLength={72}
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                error={errors.current}
                required
              />
              <div className="border-t theme-border pt-4">
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
              <Button type="submit" variant="primary" isLoading={submitting} disabled={lockIn > 0} className="mt-2 h-12 w-full">
                {lockIn > 0 ? t('changePassword.locked', { s: lockIn }) : t('changePassword.continue')}
              </Button>
            </form>
          </>
        )}

        {step === 'code' && (
          <>
            <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand-purple/10 dark:bg-brand-lime/10 text-brand-purple dark:text-brand-lime">
              <MailCheck size={26} aria-hidden="true" />
            </div>
            <h2 id="change-pw-title" className="pr-10 font-display text-3xl font-black uppercase theme-text">{t('changePassword.codeTitle')}</h2>
            <p className="mb-5 mt-1 text-sm theme-faint">
              {t('changePassword.codeDesc', { email: maskEmail(user?.email) })}
            </p>
            {renderSteps()}
            <form onSubmit={handleConfirm} noValidate className="space-y-4">
              <div>
                <label htmlFor="cp-code" className="mb-2 block text-sm font-bold theme-text">{t('changePassword.codeLabel')}</label>
                <input
                  id="cp-code"
                  name="code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]*"
                  maxLength={CODE_LENGTH}
                  value={code}
                  onChange={(e) => { setCode(e.target.value.replace(/\D/g, '').slice(0, CODE_LENGTH)); setErrors({}); }}
                  aria-invalid={!!errors.code}
                  aria-describedby={errors.code ? 'cp-code-error' : undefined}
                  placeholder="••••••"
                  className={`w-full rounded-2xl border theme-bg theme-text px-4 py-4 text-center font-display text-4xl font-black tracking-[0.5em] tabular-nums outline-none transition-colors focus:border-brand-purple dark:focus:border-brand-lime ${errors.code ? 'border-red-500' : 'theme-border'}`}
                />
                {errors.code && <p id="cp-code-error" role="alert" className="mt-1.5 text-xs font-bold text-red-600 dark:text-red-400">{errors.code}</p>}
              </div>
              <Button type="submit" variant="primary" isLoading={submitting} disabled={code.length !== CODE_LENGTH} className="h-12 w-full">
                <ShieldCheck size={18} aria-hidden="true" /> {t('changePassword.save')}
              </Button>
              <div className="flex items-center justify-between gap-3 text-sm">
                <button type="button" onClick={() => { setStep('form'); setCode(''); setErrors({}); }} className="inline-flex items-center gap-1.5 font-bold theme-faint hover:theme-text">
                  <ArrowLeft size={14} aria-hidden="true" /> {t('changePassword.back')}
                </button>
                <button type="button" onClick={resend} disabled={resendIn > 0} className="font-bold text-brand-purple dark:text-brand-lime disabled:opacity-50 disabled:cursor-not-allowed">
                  {resendIn > 0 ? t('changePassword.resendIn', { s: resendIn }) : t('changePassword.resend')}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
