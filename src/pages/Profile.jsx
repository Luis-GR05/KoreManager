import { useRef, useState, useEffect, useCallback } from 'react';
import {
  User, Mail, Phone, Save, Trophy, Calendar, MapPin,
  TrendingUp, Image as ImageIcon, ShieldCheck, Sparkles,
  Wand2, Loader2, AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useProfile } from '../hooks/useprofile';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/useAuth';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

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
  const [stats, setStats] = useState({ total: 0, proximas: 0, favorita: '—' });
  const [loadingStats, setLoadingStats] = useState(true);

  // IA Avatar state
  const [aiPrompt, setAiPrompt] = useState('Style Pixar, detailed, professional athlete photo');
  const [generatingIA, setGeneratingIA] = useState(false);
  const [iaStatus, setIaStatus] = useState('');

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
    const hoy = new Date().toISOString().split('T')[0];

    const fetchStats = async () => {
      const { data } = await supabase
        .from('reservas')
        .select('fecha, instalaciones ( nombre )')
        .eq('user_id', user.id)
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

  /**
   * Envía el formulario de perfil.
   * @param {import('react').FormEvent} e
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // VALIDACIONES DE SEGURIDAD
    const phoneRegex = /^[0-9+]{9,15}$/;
    if (formData.telefono && !phoneRegex.test(formData.telefono)) {
      toast.error(t('register.errorPhone'));
      return;
    }

    const dniRegex = /^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/i;
    const nieRegex = /^[XYZ][0-9]{7}[TRWAGMYFPDXBNJZSQVHLCKE]$/i;
    if (formData.dni && !dniRegex.test(formData.dni) && !nieRegex.test(formData.dni)) {
      toast.error(t('register.errorDni'));
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

  /**
   * Dispara el flujo de generación de Avatar con IA.
   */
  const handleGenerateAIAvatar = async () => {
    if (!user || !aiPrompt.trim()) return;

    if (!profile?.avatar_url) {
      toast.error(t('profile.aiNeedPhoto'));
      return;
    }

    setGeneratingIA(true);
    setIaStatus(t('profile.aiStatus.starting'));

    try {
      const { data: tarea, error: errorInsert } = await supabase
        .from('tareas_ia')
        .insert({
          id_usuario: user.id,
          ruta_imagen_base: profile.avatar_url,
          prompt_estilo: aiPrompt
        })
        .select()
        .single();

      if (errorInsert) throw errorInsert;

      const channel = supabase.channel(`tarea-${tarea.id}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'tareas_ia', filter: `id=eq.${tarea.id}` },
          async (payload) => {
            const estado = payload.new.estado;
            if (estado === 'procesando') {
              setIaStatus(t('profile.aiStatus.analyzing'));
            } else if (estado === 'completado') {
              await supabase
                .from('profiles')
                .update({ avatar_url: payload.new.ruta_resultado })
                .eq('id', user.id);

              toast.success(t('profile.aiSuccess'));
              await refreshProfile();
              setGeneratingIA(false);
              setIaStatus('');
              supabase.removeChannel(channel);
            } else if (estado === 'error') {
              toast.error(payload.new.mensaje_error || t('profile.aiError'));
              setGeneratingIA(false);
              setIaStatus('');
              supabase.removeChannel(channel);
            }
          }
        )
        .subscribe();

      const { data: { session } } = await supabase.auth.getSession();
      supabase.functions.invoke('generate-avatar', {
        body: { id_tarea: tarea.id },
        headers: { Authorization: `Bearer ${session?.access_token}` }
      }).catch(async (err) => {
        console.error('Fallo en la red o servidor:', err);
        setGeneratingIA(false);
        setIaStatus('');
        toast.error(t('profile.aiServerError'));

        await supabase.from('tareas_ia').update({
          estado: 'error',
          mensaje_error: 'Timeout o fallo de invocación desde el cliente'
        }).eq('id', tarea.id);
      });

    } catch (err) {
      toast.error(err.message || t('profile.aiError'));
      setGeneratingIA(false);
      setIaStatus('');
    }
  };

  if (loading) return <div className="p-8 text-brand-lime animate-pulse">{t('profile.loading')}</div>;

  const statsCards = [
    { label: t('profile.stats.totalMatches'), value: stats.total, icon: Trophy, color: 'text-brand-purple dark:text-brand-lime', bg: 'bg-brand-purple/25 dark:bg-brand-lime/25' },
    { label: t('profile.stats.upcoming'), value: stats.proximas, icon: Calendar, color: 'text-brand-purple dark:text-brand-lime', bg: 'bg-brand-purple/25 dark:bg-brand-lime/25' },
    { label: t('profile.stats.favoriteCourt'), value: stats.favorita, icon: MapPin, color: 'text-brand-purple dark:text-brand-lime', bg: 'bg-brand-purple/25 dark:bg-brand-lime/25', isText: true },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* HEADER / COVER */}
      <div className="relative overflow-hidden theme-card p-6 md:p-8 anim-shine border-none bg-gradient-to-br from-brand-purple/25 via-transparent to-brand-lime/20">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-brand-purple/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-brand-lime/15 rounded-full blur-3xl pointer-events-none" />

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
            <div key={label} className="theme-card p-5 flex items-center gap-4 hover:border-brand-purple dark:hover:border-brand-lime transition-colors">
              <div className={`p-2.5 rounded-xl ${bg} ${color} shrink-0`}>
                <Icon size={18} />
              </div>
              <div className="min-w-0">
                <p className={`font-bold ${isText ? 'text-sm truncate' : 'text-2xl'} ${color}`}>
                  {loadingStats ? '—' : value}
                </p>
                <p className="text-[10px] theme-muted font-bold uppercase tracking-wider">{label}</p>
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

          {/* Generación con IA */}
          <div className="theme-card p-6 border-brand-purple/20 dark:border-brand-lime/20 text-center relative overflow-hidden group">
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-brand-purple/10 dark:bg-brand-lime/10 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Sparkles size={18} className="text-brand-purple dark:text-brand-lime" />
                <p className="text-xs font-black theme-faint uppercase tracking-widest">{t('profile.aiAvatar')}</p>
              </div>

              <div className="space-y-4">
                <div className="text-left">
                  <label className="text-[10px] font-bold theme-faint uppercase tracking-wider ml-1 mb-1.5 block">
                    {t('profile.aiStyleLabel')}
                  </label>
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder={t('profile.aiPlaceholder')}
                    className="w-full theme-bg border theme-border rounded-xl px-3 py-2 text-xs theme-text focus:border-brand-purple dark:focus:border-brand-lime outline-none resize-none transition-colors"
                    rows={2}
                  />
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  className="w-full bg-gradient-to-r from-brand-purple/35 to-brand-lime/20 border-brand-purple/40 dark:border-brand-lime/40 theme-text hover:border-brand-purple/60 dark:hover:border-brand-lime/60 shadow-sm"
                  isLoading={generatingIA}
                  onClick={handleGenerateAIAvatar}
                >
                  {generatingIA ? (
                    <><Loader2 className="animate-spin mr-2" size={16} /> {t('profile.aiProcessing')}</>
                  ) : (
                    <><Wand2 size={16} className="mr-2" /> {t('profile.aiGenerate')}</>
                  )}
                </Button>

                {iaStatus && (
                  <div className="mt-3 flex items-center justify-center gap-2 text-brand-purple dark:text-brand-lime animate-pulse" aria-live="polite">
                    <Loader2 size={12} className="animate-spin" />
                    <span className="text-[10px] font-bold uppercase">{iaStatus}</span>
                  </div>
                )}

                <p className="text-[10px] theme-faint mt-4 leading-relaxed italic">
                  {t('profile.aiNote')}
                </p>
              </div>
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

            <div>
              <label className="text-xs font-bold theme-faint uppercase ml-1 mb-2 block">
                {t('profile.fullName')}
              </label>
              <Input
                icon={User}
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder={t('profile.fullNamePlaceholder')}
              />
            </div>

            <div>
              <label className="text-xs font-bold theme-faint uppercase ml-1 mb-2 block">{t('profile.phone')}</label>
              <Input
                icon={Phone}
                type="tel"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder={t('profile.phonePlaceholder')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold theme-muted uppercase ml-1 mb-2 block">{t('profile.dni')}</label>
                <Input
                  icon={User}
                  type="text"
                  value={formData.dni}
                  onChange={(e) => setFormData({ ...formData, dni: e.target.value.toUpperCase() })}
                  placeholder={t('profile.dniPlaceholder')}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold theme-muted uppercase ml-1 mb-2 block">{t('profile.birthDate')}</label>
                <Input
                  icon={Calendar}
                  type="date"
                  value={formData.fecha_nacimiento}
                  onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold theme-faint uppercase ml-1 mb-2 block">{t('profile.address')}</label>
              <Input
                icon={MapPin}
                type="text"
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                placeholder={t('profile.addressPlaceholder')}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold theme-muted uppercase ml-1 mb-2 block">{t('profile.postalCode')}</label>
                <Input
                  icon={MapPin}
                  type="text"
                  value={formData.codigo_postal}
                  onChange={(e) => setFormData({ ...formData, codigo_postal: e.target.value })}
                  placeholder={t('profile.postalCodePlaceholder')}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold theme-muted uppercase ml-1 mb-2 block">{t('profile.city')}</label>
                <Input
                  icon={MapPin}
                  type="text"
                  value={formData.municipio}
                  onChange={(e) => setFormData({ ...formData, municipio: e.target.value })}
                  placeholder={t('profile.cityPlaceholder')}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold theme-muted uppercase ml-1 mb-2 block">{t('profile.province')}</label>
                <Input
                  icon={MapPin}
                  type="text"
                  value={formData.provincia}
                  onChange={(e) => setFormData({ ...formData, provincia: e.target.value })}
                  placeholder={t('profile.provincePlaceholder')}
                  required
                />
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
