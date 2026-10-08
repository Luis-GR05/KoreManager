import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, User, Phone, MapPin, Calendar, IdCard, ArrowRight, ArrowLeft, CheckCircle, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/useAuth';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import PasswordInput, { PasswordStrength } from '../components/ui/PasswordInput';
import AuthShell from '../components/auth/AuthShell';
import Seo, { SITE_URL } from '../components/Seo';
import useCountdown from '../hooks/useCountdown';
import { registerLimiter, authErrorKey } from '../lib/rateLimit';
import {
  MIN_AGE, PROVINCE_LIST, normalizeDni, normalizeEmail, normalizePhone, normalizeSpaces,
  provinceFromPostalCode, suggestEmail, validateAddress, validateBirthDate, validateCity, validateDni,
  validateEmail, validateName, validatePassword, validatePasswordMatch, validatePhone,
  validatePostalCode, validateProvince,
} from '../lib/validation';

/** URL de redirección tras confirmar el email */
const EMAIL_REDIRECT_TO = `${SITE_URL}/login`;

const STEPS = [
  { id: 'account', fields: ['fullName', 'email', 'password', 'confirmPassword'] },
  { id: 'identity', fields: ['phone', 'dni', 'birthDate'] },
  { id: 'address', fields: ['address', 'postalCode', 'city', 'province', 'terms'] },
];

/** Fecha máxima permitida (hoy − edad mínima) en formato YYYY-MM-DD */
function maxBirthDate() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - MIN_AGE);
  return d.toISOString().slice(0, 10);
}

/**
 * Registro en tres pasos (cuenta → identidad → dirección) con validación
 * en vivo, medidor de contraseña, CP → provincia automática, honeypot
 * antibots y límite de intentos.
 *
 * @returns {import('react').JSX.Element}
 */
export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [touched, setTouched] = useState({});
  const [showErrors, setShowErrors] = useState({});
  const [lockSeconds, startLock] = useCountdown(Math.ceil(registerLimiter.retryIn() / 1000));
  const headingRef = useRef(null);
  const formRef = useRef(null);
  const firstRender = useRef(true);

  const [formData, setFormData] = useState({
    fullName: '', email: '', phone: '', dni: '', birthDate: '', address: '',
    postalCode: '', city: '', province: '', password: '', confirmPassword: '',
    acceptTerms: false, acceptPrivacy: false,
    website: '', // honeypot: los humanos no lo ven
  });

  useEffect(() => {
    if (!authLoading && user) navigate('/dashboard', { replace: true });
  }, [user, authLoading, navigate]);

  // Al cambiar de paso, el foco va al título del paso (lectores de pantalla)
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    headingRef.current?.focus();
  }, [step]);

  /** Errores actuales (clave i18n traducida) de todos los campos. */
  const errors = useMemo(() => {
    const f = formData;
    const tr = (e) => (e ? t(`validation.${e.key}`, e.vars) : undefined);
    return {
      fullName: tr(validateName(f.fullName)),
      email: tr(validateEmail(f.email)),
      password: tr(validatePassword(f.password, [f.fullName, f.email])),
      confirmPassword: tr(validatePasswordMatch(f.password, f.confirmPassword)),
      phone: tr(validatePhone(f.phone)),
      dni: tr(validateDni(f.dni)),
      birthDate: tr(validateBirthDate(f.birthDate)),
      address: tr(validateAddress(f.address)),
      postalCode: tr(validatePostalCode(f.postalCode)),
      city: tr(validateCity(f.city)),
      province: tr(validateProvince(f.province, f.postalCode)),
      terms: f.acceptTerms && f.acceptPrivacy ? undefined : t('validation.terms'),
    };
  }, [formData, t]);

  // Un error se muestra si el campo ya se tocó (al salir) o si se intentó avanzar
  const errorFor = (name) => ((touched[name] || showErrors[name]) ? errors[name] : undefined);
  const emailSuggestion = touched.email && !errors.email ? suggestEmail(formData.email) : null;

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    let v = type === 'checkbox' ? checked : value;
    if (name === 'dni') v = String(v).toUpperCase().replace(/\s/g, '').slice(0, 10);
    if (name === 'postalCode') v = String(v).replace(/\D/g, '').slice(0, 5);
    setFormData((prev) => {
      const next = { ...prev, [name]: v };
      // CP → provincia automática
      if (name === 'postalCode') {
        const prov = provinceFromPostalCode(v);
        if (prov && v.length === 5) next.province = prov;
      }
      return next;
    });
  };

  const handleBlur = (e) => setTouched((p) => ({ ...p, [e.target.name]: true }));

  /** Marca los campos del paso y devuelve si es válido; enfoca el primer error. */
  const validateStep = (i) => {
    const fields = STEPS[i].fields;
    setShowErrors((p) => ({ ...p, ...Object.fromEntries(fields.map((f) => [f, true])) }));
    const firstBad = fields.find((f) => errors[f]);
    if (firstBad) {
      const el = formRef.current?.querySelector(`[name="${firstBad === 'terms' ? 'acceptTerms' : firstBad}"]`);
      el?.focus();
      return false;
    }
    return true;
  };

  const next = () => { if (validateStep(step)) setStep((s) => Math.min(s + 1, STEPS.length - 1)); };
  const prev = () => setStep((s) => Math.max(0, s - 1));

  const handleRegister = async (e) => {
    e.preventDefault();
    if (loading || lockSeconds > 0) return;
    if (step < STEPS.length - 1) { next(); return; }

    // Valida todos los pasos (por si se editó algo hacia atrás)
    for (let i = 0; i < STEPS.length; i += 1) {
      if (STEPS[i].fields.some((f) => errors[f])) {
        setStep(i);
        setTimeout(() => validateStep(i), 0);
        toast.error(t('validation.fixErrors'));
        return;
      }
    }

    const email = normalizeEmail(formData.email);

    // Honeypot: un bot lo ha rellenado → simulamos éxito sin crear nada
    if (formData.website) {
      setRegisteredEmail(email);
      setPendingVerification(true);
      return;
    }

    const wait = registerLimiter.hit();
    if (wait > 0) startLock(Math.ceil(wait / 1000));

    setLoading(true);
    const clean = {
      full_name: normalizeSpaces(formData.fullName),
      phone: normalizePhone(formData.phone),
      dni: normalizeDni(formData.dni),
      fecha_nacimiento: formData.birthDate,
      direccion: normalizeSpaces(formData.address),
      codigo_postal: formData.postalCode.trim(),
      municipio: normalizeSpaces(formData.city),
      provincia: formData.province,
    };

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: formData.password,
        options: {
          emailRedirectTo: EMAIL_REDIRECT_TO,
          data: {
            ...clean,
            consent_terms: true,
            consent_privacy: true,
            consent_ts: new Date().toISOString(),
          },
        },
      });
      if (error) throw error;

      // Confirmación de email desactivada: hay sesión inmediata
      if (data?.session?.user?.id) {
        await supabase.from('profiles').update({
          telefono: clean.phone,
          full_name: clean.full_name,
          dni: clean.dni,
          fecha_nacimiento: clean.fecha_nacimiento,
          direccion: clean.direccion,
          codigo_postal: clean.codigo_postal,
          municipio: clean.municipio,
          provincia: clean.provincia,
        }).eq('id', data.session.user.id);
        toast.success(t('register.success'));
        navigate('/dashboard');
      } else {
        setRegisteredEmail(email);
        setPendingVerification(true);
      }
    } catch (error) {
      const key = authErrorKey(error);
      // Los errores del trigger de BD llegan como "Database error saving new user"
      toast.error(key ? t(key) : (error?.message?.includes('Database error') ? t('validation.fixErrors') : t('auth.network')));
    } finally {
      setLoading(false);
    }
  };

  // ── Verificación pendiente ──────────────────────────────────────────
  if (pendingVerification) {
    return (
      <AuthShell title={t('register.verifyTitle')} backTo="/login" backLabel={t('register.goToLogin')}>
        <Seo title={t('seo.registerTitle')} path="/register" />
        <div className="text-center sm:text-left">
          <div className="mb-6 grid h-16 w-16 place-items-center rounded-full bg-brand-purple/10 dark:bg-brand-lime/10 mx-auto sm:mx-0">
            <CheckCircle size={32} className="text-brand-purple dark:text-brand-lime" aria-hidden="true" />
          </div>
          <p className="theme-faint">{t('register.verifyDesc')}</p>
          <p className="mt-2 break-all font-semibold theme-text">{registeredEmail}</p>
          <p className="mt-4 text-sm theme-faint">{t('register.verifyNote')}</p>
          <Link
            to="/login"
            className="mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-purple font-bold text-white dark:bg-brand-lime dark:text-black"
          >
            {t('register.goToLogin')}
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </AuthShell>
    );
  }

  const field = (name) => ({
    name,
    value: formData[name],
    onChange: handleChange,
    onBlur: handleBlur,
    error: errorFor(name),
    required: true,
  });

  return (
    <AuthShell
      title={t('register.title')}
      wide
      footer={(
        <p>
          {t('register.hasAccount')}{' '}
          <Link to="/login" className="font-bold theme-text underline-offset-4 hover:underline hover:text-brand-purple dark:hover:text-brand-lime">
            {t('register.login')}
          </Link>
        </p>
      )}
    >
      <Seo title={t('seo.registerTitle')} description={t('seo.registerDesc')} path="/register" />

      {/* Indicador de pasos */}
      <nav aria-label={t('register.stepOf', { n: step + 1, total: STEPS.length })} className="mb-8">
        <ol className="grid grid-cols-3 gap-2">
          {STEPS.map((s, i) => (
            <li key={s.id} aria-current={i === step ? 'step' : undefined}>
              <span className={`step-dot block h-1 rounded-full ${i <= step ? 'bg-brand-purple dark:bg-brand-lime' : 'theme-elevated'}`} />
              <span className={`mt-2 block text-xs font-semibold ${i === step ? 'theme-text' : 'theme-faint'}`}>
                <span className="tabular">{i + 1}.</span> {t(`register.steps.${s.id}`)}
              </span>
            </li>
          ))}
        </ol>
      </nav>

      <form ref={formRef} onSubmit={handleRegister} noValidate>
        <h2 ref={headingRef} tabIndex={-1} className="sr-only">
          {t('register.stepOf', { n: step + 1, total: STEPS.length })}: {t(`register.steps.${STEPS[step].id}`)}
        </h2>

        {/* Honeypot (oculto para personas, visible para bots) */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label htmlFor="reg-website">{t('register.honeypot')}</label>
          <input id="reg-website" name="website" type="text" tabIndex={-1} autoComplete="off" value={formData.website} onChange={handleChange} />
        </div>

        <div key={step} className="space-y-5 animate-fade-in">
          {step === 0 && (
            <>
              <Input icon={User} id="reg-name" label={t('register.fullName')} autoComplete="name" maxLength={80} {...field('fullName')} />
              <div>
                <Input
                  icon={Mail}
                  id="reg-email"
                  type="email"
                  label={t('auth.email')}
                  placeholder={t('register.emailPlaceholder')}
                  autoComplete="email"
                  inputMode="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  maxLength={254}
                  {...field('email')}
                />
                {emailSuggestion && (
                  <button
                    type="button"
                    className="mt-1.5 text-xs font-semibold text-brand-purple dark:text-brand-lime underline underline-offset-2"
                    onClick={() => setFormData((p) => ({ ...p, email: emailSuggestion }))}
                  >
                    {t('validation.emailTypo', { suggestion: emailSuggestion })}
                  </button>
                )}
              </div>
              <div>
                <PasswordInput
                  id="reg-password"
                  label={t('register.password')}
                  autoComplete="new-password"
                  maxLength={72}
                  aria-describedby="reg-password-strength"
                  {...field('password')}
                />
                <PasswordStrength id="reg-password-strength" value={formData.password} personal={[formData.fullName, formData.email]} />
              </div>
              <PasswordInput id="reg-password2" label={t('register.confirmPassword')} autoComplete="new-password" maxLength={72} {...field('confirmPassword')} />
            </>
          )}

          {step === 1 && (
            <>
              <Input icon={Phone} id="reg-phone" type="tel" label={t('register.phone')} hint={t('register.phoneHint')} autoComplete="tel" inputMode="tel" maxLength={20} {...field('phone')} />
              <div className="grid gap-5 sm:grid-cols-2">
                <Input icon={IdCard} id="reg-dni" label={t('register.dni')} hint={t('register.dniHint')} autoComplete="off" autoCapitalize="characters" spellCheck={false} {...field('dni')} />
                <Input icon={Calendar} id="reg-birth" type="date" label={t('register.birthDate')} autoComplete="bday" max={maxBirthDate()} min="1900-01-01" {...field('birthDate')} />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <Input icon={MapPin} id="reg-address" label={t('register.address')} hint={t('register.addressHint')} autoComplete="street-address" maxLength={120} {...field('address')} />
              <div className="grid gap-5 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                <Input icon={MapPin} id="reg-cp" label={t('register.postalCode')} autoComplete="postal-code" inputMode="numeric" pattern="[0-9]*" {...field('postalCode')} />
                <Input icon={Building2} id="reg-city" label={t('register.city')} autoComplete="address-level2" maxLength={60} {...field('city')} />
              </div>
              <div>
                <label htmlFor="reg-province" className="mb-1.5 block text-sm font-semibold theme-text">{t('register.province')}</label>
                <select
                  id="reg-province"
                  name="province"
                  value={formData.province}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  autoComplete="address-level1"
                  required
                  aria-invalid={errorFor('province') ? true : undefined}
                  aria-describedby={errorFor('province') ? 'reg-province-error' : 'reg-province-hint'}
                  className={`w-full rounded-xl border px-4 py-3 theme-bg theme-text focus:outline-none ${errorFor('province') ? 'border-semantic-danger' : 'theme-border focus:border-brand-purple dark:focus:border-brand-lime'}`}
                >
                  <option value="">—</option>
                  {PROVINCE_LIST.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                {errorFor('province')
                  ? <p id="reg-province-error" role="alert" className="mt-1.5 text-xs font-medium text-semantic-danger">{errorFor('province')}</p>
                  : <p id="reg-province-hint" className="mt-1.5 text-xs theme-faint">{t('register.provinceAuto')}</p>}
              </div>

              <fieldset className="space-y-3 pt-2 text-sm theme-muted">
                <legend className="sr-only">{t('register.terms')}</legend>
                <label className="flex cursor-pointer items-start gap-3">
                  <input type="checkbox" name="acceptTerms" checked={formData.acceptTerms} onChange={handleChange} className="mt-0.5 h-5 w-5 shrink-0 rounded accent-[#8A2BE2] dark:accent-[#CCFF00]" />
                  <span>
                    {t('register.acceptTermsPrefix')}
                    <Link to="/legal/terminos" target="_blank" rel="noopener" className="font-bold theme-text underline underline-offset-2">{t('register.terms')}</Link>.
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-3">
                  <input type="checkbox" name="acceptPrivacy" checked={formData.acceptPrivacy} onChange={handleChange} className="mt-0.5 h-5 w-5 shrink-0 rounded accent-[#8A2BE2] dark:accent-[#CCFF00]" />
                  <span>
                    {t('register.acceptPrivacyPrefix')}
                    <Link to="/legal/privacidad" target="_blank" rel="noopener" className="font-bold theme-text underline underline-offset-2">{t('register.privacy')}</Link>
                    {t('register.and')}
                    <Link to="/legal/cookies" target="_blank" rel="noopener" className="font-bold theme-text underline underline-offset-2">{t('register.cookies')}</Link>.
                  </span>
                </label>
                {errorFor('terms') && <p role="alert" className="text-xs font-medium text-semantic-danger">{errorFor('terms')}</p>}
                <p className="text-xs theme-faint">{t('register.legalWarning')}</p>
              </fieldset>
            </>
          )}
        </div>

        <div className="mt-8 flex gap-3">
          {step > 0 && (
            <Button type="button" variant="secondary" onClick={prev} className="h-12 px-5">
              <ArrowLeft size={18} aria-hidden="true" /> {t('register.prev')}
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button type="button" variant="primary" onClick={next} className="h-12 flex-1">
              {t('register.next')} <ArrowRight size={18} aria-hidden="true" />
            </Button>
          ) : (
            <Button type="submit" variant="primary" isLoading={loading} disabled={lockSeconds > 0} className="h-12 flex-1">
              {lockSeconds > 0 ? t('common.retryIn', { s: lockSeconds }) : t('register.submit')}
            </Button>
          )}
        </div>
      </form>
    </AuthShell>
  );
}
