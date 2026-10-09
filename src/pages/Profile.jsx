import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import {
  User, Mail, Phone, Save, Trophy, Calendar, MapPin,
  TrendingUp, Image as ImageIcon, ShieldCheck, IdCard, Map,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import DatePicker from '../components/ui/DatePicker';
import { useProfile } from '../hooks/useprofile';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/useAuth';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import {
  MIN_AGE, PROVINCE_LIST, cleanDniNumber, dniLetterFor, provinceFromPostalCode,
  validateAddress, validateBirthDate, validateCity, validateDni, validateName,
  validatePhone, validatePostalCode, validateProvince,
} from '../lib/validation';
import { localIsoDate } from '../lib/bookings';
import BrandLoader from '../components/feedback/BrandLoader';

/** Fecha máxima de nacimiento (edad mínima). */
function maxBirthDate() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - MIN_AGE);
  return localIsoDate(d);
}

/**
 * Página de perfil:
 * - edición de datos personales
 * - subida de avatar a Storage
 * - estadísticas rápidas del usuario
 *
 * @returns {import('react').JSX.Element}
 */
export default function Profile() {
  const { profile, roleName, loading, updating, updateProfile } = useProfile();
  const { user, refreshProfile } = useAuth();
  const { t } = useTranslation();
  const fileRef = useRef(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarDisplayUrl, setAvatarDisplayUrl] = useState(null);

  const [formData, setFormData] = useState({
    full_name: '',
    telefono: '',
    dni: '',
    fecha_nacimiento: '',
    direccion: '',
    codigo_postal: '',
    municipio: '',
    provincia: '',
  });
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [stats, setStats] = useState({ total: 0, proximas: 0, favorita: '—' });
  const [loadingStats, setLoadingStats] = useState(true);


  useEffect(() => {
    if (profile) {
      const meta = user?.user_metadata || {};
      const id = setTimeout(() => {
        setFormData({
          full_name: profile.full_name || meta.full_name || '',
          telefono: profile.telefono || meta.phone || meta.telefono || '',
          dni: profile.dni || meta.dni || '',
          fecha_nacimiento: profile.fecha_nacimiento || meta.fecha_nacimiento || '',
          direccion: profile.direccion || meta.direccion || '',
          codigo_postal: profile.codigo_postal || meta.codigo_postal || '',
          municipio: profile.municipio || meta.municipio || '',
          provincia: profile.provincia || meta.provincia || '',
        });
      }, 0);
      return () => clearTimeout(id);
    }
  }, [profile, user?.user_metadata]);

  /**
   * Resuelve el avatar a una URL visible.
   * @returns {Promise<string|null>}
   */
  const resolveAvatarUrl = useCallback(async () => {
    const value = profile?.avatar_url;
    if (!value) {
      return null;
    }
    if (String(value).startsWith('http')) {
      return value;
    }

    const { data, error } = await supabase.storage
      .from('avatars')
      .createSignedUrl(String(value), 60 * 60);

    if (error) {
      console.warn('[Avatar] signed url error:', error.message);
      return null;
    }

    return data?.signedUrl ?? null;
  }, [profile?.avatar_url]);

  useEffect(() => {
    let alive = true;

    const safeRefresh = async () => {
      const nextUrl = await resolveAvatarUrl();
      if (!alive) return;
      setAvatarDisplayUrl(nextUrl);
    };

    void safeRefresh();

    const intervalId = window.setInterval(() => {
      void safeRefresh();
    }, 45 * 60 * 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void safeRefresh();
      }
    };

    window.addEventListener('focus', handleVisibilityChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      alive = false;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleVisibilityChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [resolveAvatarUrl]);

  useEffect(() => {
    if (!user) return;
    const hoy = localIsoDate();

    const fetchStats = async () => {
      const { data } = await supabase
        .from('reservas')
        .select('fecha, instalaciones ( nombre )')
        .eq('user_id', user.id)
        .eq('payment_status', 'paid')
        .order('fecha', { ascending: false });

      if (!data) { setLoadingStats(false); return; }

      const proximas = data.filter(r => r.fecha >= hoy).length;

      const counts = {};
      data.forEach(r => {
        const n = r.instalaciones?.nombre;
        if (n) counts[n] = (counts[n] || 0) + 1;
      });
      const favorita = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

      setStats({ total: data.length, proximas, favorita });
      setLoadingStats(false);
    };

    fetchStats();
  }, [user]);

  /** Errores traducidos por campo (mismas reglas que el registro y que la BD). */
  const errors = useMemo(() => {
    const f = formData;
    const tr = (e) => (e ? t(`validation.${e.key}`, e.vars) : undefined);
    return {
      full_name: tr(validateName(f.full_name)),
      telefono: tr(validatePhone(f.telefono)),
      dni: tr(validateDni(f.dni)),
      fecha_nacimiento: tr(validateBirthDate(f.fecha_nacimiento)),
      direccion: tr(validateAddress(f.direccion)),
      codigo_postal: tr(validatePostalCode(f.codigo_postal)),
      municipio: tr(validateCity(f.municipio)),
      provincia: tr(validateProvince(f.provincia, f.codigo_postal)),
    };
  }, [formData, t]);
  const errorFor = (name) => ((touched[name] || submitted) ? errors[name] : undefined);

  const handleField = (e) => {
    const { name, value } = e.target;
    let v = value;
    if (name === 'dni') {
      const num = cleanDniNumber(v);
      const letter = dniLetterFor(num);
      v = letter ? num + letter : num;
    }
    if (name === 'codigo_postal') v = String(v).replace(/\D/g, '').slice(0, 5);
    setFormData((prev) => {
      const next = { ...prev, [name]: v };
      if (name === 'codigo_postal' && v.length === 5) {
        const prov = provinceFromPostalCode(v);
        if (prov) next.provincia = prov;
      }
      return next;
    });
  };
  const handleBlur = (e) => setTouched((p) => ({ ...p, [e.target.name]: true }));
  const field = (name) => ({ name, value: formData[name], onChange: handleField, onBlur: handleBlur, error: errorFor(name) });

  /**
   * Envía el formulario de perfil.
   * @param {import('react').FormEvent} e
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.values(errors).some(Boolean)) {
      toast.error(t('validation.fixErrors'));
      return;
    }
    await updateProfile(formData);
  };

  const handlePickAvatar = () => fileRef.current?.click();

  /**
   * Sube el avatar a Storage.
   * @param {import('react').ChangeEvent<HTMLInputElement>} e
   */
  const handleAvatarSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    setUploadingAvatar(true);
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 512;
      canvas.height = 512;

      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      const blobResize = await new Promise((resolve, reject) => {
        img.onload = () => {
          const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
          const drawWidth = img.width * scale;
          const drawHeight = img.height * scale;
          const x = (canvas.width - drawWidth) / 2;
          const y = (canvas.height - drawHeight) / 2;

          ctx.drawImage(img, x, y, drawWidth, drawHeight);
          URL.revokeObjectURL(objectUrl);
          canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.9);
        };
        img.onerror = () => reject(new Error('Error al cargar la imagen'));
        img.src = objectUrl;
      });

      const ext = 'jpg';
      const path = `${user.id}/avatar.${ext}`;

      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, blobResize, { upsert: true, contentType: 'image/jpeg' });

      if (upErr) throw upErr;

      const { error: dbErr } = await supabase
        .from('profiles')
        .update({ avatar_url: path })
        .eq('id', user.id);

      if (dbErr) throw dbErr;

      toast.success(t('profile.photoSuccess'));
      await refreshProfile();
    } catch (err) {
      toast.error(err?.message || t('profile.photoError'));
    } finally {
      setUploadingAvatar(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  if (loading) return <BrandLoader fullscreen={false} label={t('profile.loading')} />;

  const statsCards = [
    { 
      label: t('profile.stats.totalMatches'), 
      value: stats.total, 
      icon: Trophy, 
      color: 'text-brand-purple dark:text-brand-lime', 
      bg: 'bg-brand-purple/10 dark:bg-brand-lime/10 border border-brand-purple/15 dark:border-brand-lime/15' 
    },
    { 
      label: t('profile.stats.upcoming'), 
      value: stats.proximas, 
      icon: Calendar, 
      color: 'text-brand-purple dark:text-brand-lime', 
      bg: 'bg-brand-purple/10 dark:bg-brand-lime/10 border border-brand-purple/15 dark:border-brand-lime/15' 
    },
    { 
      label: t('profile.stats.favoriteCourt'), 
      value: stats.favorita, 
      icon: MapPin, 
      color: 'text-brand-purple dark:text-brand-lime', 
      bg: 'bg-brand-purple/10 dark:bg-brand-lime/10 border border-brand-purple/15 dark:border-brand-lime/15', 
      isText: true 
    },
  ];

  const dniLetter = /[A-Z]$/.test(formData.dni) && formData.dni.length === 9 ? formData.dni.slice(-1) : null;
  const dniNumberPart = dniLetter ? formData.dni.slice(0, -1) : formData.dni;
  return (
    <div className="max-w-7xl mx-auto space-y-8 bg-cueva-gradient -m-6 p-6 md:-m-8 md:p-8 rounded-[3rem]">
      {/* HEADER / COVER */}
      <div className="relative overflow-hidden theme-card p-6 md:p-8 anim-shine border-none bg-gradient-to-br from-brand-purple/25 via-transparent to-brand-lime/20 shadow-2xl">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-brand-purple/20 rounded-full blur-3xl pointer-events-none anim-floaty" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-brand-lime/12 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
          {/* Avatar slot */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-3xl theme-bg border theme-border flex items-center justify-center theme-faint shrink-0">
              {avatarDisplayUrl ? (
                <img src={avatarDisplayUrl} alt="Avatar" className="w-full h-full object-cover rounded-3xl" />
              ) : (
                <ImageIcon size={26} />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold theme-faint uppercase tracking-widest">{t('profile.myProfile')}</p>
              <h1 className="text-3xl md:text-4xl font-black theme-text truncate">
                {profile?.full_name || 'Usuario'}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full theme-elevated border theme-border text-xs font-black theme-text uppercase tracking-widest">
                  <ShieldCheck size={14} className="text-brand-purple dark:text-brand-lime" />
                  {roleName}
                </span>
                <span className="text-xs theme-faint font-semibold truncate">
                  {profile?.email}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mini Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statsCards.map(({ label, value, icon, color, bg, isText }) => {
          const Icon = icon;
          return (
            <div key={label} className="theme-card p-5 flex items-center gap-4 hover:border-brand-purple dark:hover:border-brand-lime transition-all duration-300 glow-purple hover:scale-[1.02] shadow-xl">
              <div className={`p-2.5 rounded-xl ${bg} ${color} shrink-0`}>
                <Icon size={18} />
              </div>
              <div className="min-w-0">
                <p className={`font-black tracking-tight ${isText ? 'text-sm truncate' : 'text-3xl'} ${color} mb-0.5`}>
                  {loadingStats ? '—' : value}
                </p>
                <p className="text-[10px] theme-muted font-extrabold uppercase tracking-widest">{label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* COLUMNA IZQUIERDA — Foto de perfil */}
        <div className="lg:col-span-1 space-y-6">
          <div className="theme-card p-6 text-center relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-lime/10 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10">
              <p className="text-xs font-black theme-faint uppercase tracking-widest mb-3">{t('profile.photoSection')}</p>
              <div className="w-44 h-44 rounded-3xl theme-elevated border theme-border mx-auto overflow-hidden flex items-center justify-center theme-faint mb-5 anim-shine">
                {avatarDisplayUrl ? (
                  <img src={avatarDisplayUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon size={28} />
                )}
              </div>
              <p className="text-sm font-bold theme-text mb-1">{t('profile.yourPhoto')}</p>
              <p className="text-xs theme-faint mb-5">
                {t('profile.photoDesc')}
              </p>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarSelected}
              />

              <Button type="button" variant="primary" className="w-full" isLoading={uploadingAvatar} onClick={handlePickAvatar}>
                <ImageIcon size={18} /> {t('profile.changePhoto')}
              </Button>
            </div>
          </div>

        </div>

        {/* COLUMNA DERECHA — Formulario */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="theme-card p-8 space-y-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-black theme-text">{t('profile.personalData')}</h3>
              <span className="text-[10px] font-bold uppercase tracking-widest theme-muted">{t('profile.editable')}</span>
            </div>

            <div>
              <label className="text-xs font-bold theme-muted uppercase ml-1 mb-2 block">
                {t('profile.email')}
              </label>
              <div className="flex items-center gap-3 theme-bg p-4 rounded-xl border theme-border opacity-70">
                <Mail className="theme-faint" size={20} />
                <span className="theme-text text-sm">{profile?.email}</span>
              </div>
            </div>

            <Input icon={User} id="pf-name" label={t('profile.fullName')} autoComplete="name" maxLength={80} placeholder={t('profile.fullNamePlaceholder')} {...field('full_name')} />
            <Input icon={Phone} id="pf-phone" type="tel" label={t('profile.phone')} autoComplete="tel" inputMode="tel" maxLength={20} placeholder={t('profile.phonePlaceholder')} {...field('telefono')} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:items-start">
              <Input
                icon={IdCard}
                id="pf-dni"
                label={t('profile.dni')}
                hint={t('register.dniHint')}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                inputMode={/^[XYZ]/.test(formData.dni) ? 'text' : 'numeric'}
                maxLength={9}
                {...field('dni')}
                value={dniNumberPart}
                trailing={(
                  <span aria-live="polite" className={`grid h-9 min-w-9 place-items-center rounded-lg px-2 font-display text-xl font-black transition-colors ${dniLetter ? 'bg-brand-purple text-white dark:bg-brand-lime dark:text-[#0F0F1A]' : 'theme-elevated theme-faint'}`}>
                    <span className="sr-only">{t('register.dniLetter')}: </span>{dniLetter ?? '?'}
                  </span>
                )}
              />
              <DatePicker
                id="profile-birth"
                name="fecha_nacimiento"
                label={t('profile.birthDate')}
                min="1900-01-01"
                max={maxBirthDate()}
                value={formData.fecha_nacimiento}
                onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value === 'invalid' ? '' : e.target.value })}
                onBlur={() => setTouched((p) => ({ ...p, fecha_nacimiento: true }))}
                error={errorFor('fecha_nacimiento')}
                required
              />
            </div>

            <Input icon={MapPin} id="pf-address" label={t('profile.address')} autoComplete="street-address" maxLength={120} placeholder={t('profile.addressPlaceholder')} {...field('direccion')} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:items-start">
              <Input icon={MapPin} id="pf-cp" label={t('profile.postalCode')} autoComplete="postal-code" inputMode="numeric" maxLength={5} placeholder={t('profile.postalCodePlaceholder')} {...field('codigo_postal')} />
              <Input icon={MapPin} id="pf-city" label={t('profile.city')} autoComplete="address-level2" maxLength={60} placeholder={t('profile.cityPlaceholder')} {...field('municipio')} />
              <div>
                <label htmlFor="pf-province" className="mb-2 block text-sm font-bold theme-text">{t('profile.province')}</label>
                <div className="relative">
                  <Map size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 theme-faint" />
                  <select
                    id="pf-province"
                    name="provincia"
                    value={formData.provincia}
                    onChange={handleField}
                    onBlur={handleBlur}
                    aria-invalid={!!errorFor('provincia')}
                    aria-describedby={errorFor('provincia') ? 'pf-province-error' : undefined}
                    className={`w-full appearance-none rounded-2xl border theme-bg theme-text py-3.5 pl-11 pr-4 outline-none transition-colors focus:border-brand-purple dark:focus:border-brand-lime ${errorFor('provincia') ? 'border-red-500' : 'theme-border'}`}
                  >
                    <option value="">—</option>
                    {PROVINCE_LIST.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                {errorFor('provincia') && <p id="pf-province-error" className="mt-1.5 text-xs font-bold text-red-600 dark:text-red-400" role="alert">{errorFor('provincia')}</p>}
              </div>
            </div>

            <Button type="submit" variant="primary" isLoading={updating} className="w-full">
              {!updating && <Save size={20} />}
              {updating ? t('profile.saving') : t('profile.save')}
            </Button>
          </form>

          {/* Legal / privacidad */}
          <div className="theme-card p-6">
            <p className="text-sm font-black theme-text mb-2">{t('profile.legal')}</p>
            <p className="text-xs theme-faint">
              {t('profile.legalDesc')}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link to="/legal/aviso-legal" className="text-sm font-bold theme-text opacity-90 hover:opacity-100 hover:text-brand-purple dark:hover:text-brand-lime transition-colors">
                {t('profile.legalNotice')}
              </Link>
              <Link to="/legal/privacidad" className="text-sm font-bold theme-text opacity-90 hover:opacity-100 hover:text-brand-purple dark:hover:text-brand-lime transition-colors">
                {t('profile.privacyPolicy')}
              </Link>
              <Link to="/legal/cookies" className="text-sm font-bold theme-text opacity-90 hover:opacity-100 hover:text-brand-purple dark:hover:text-brand-lime transition-colors">
                {t('profile.cookiesPolicy')}
              </Link>
              <Link to="/legal/terminos" className="text-sm font-bold theme-text opacity-90 hover:opacity-100 hover:text-brand-purple dark:hover:text-brand-lime transition-colors">
                {t('profile.terms')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
