import { useRef, useState, useEffect, useCallback } from 'react';
import { User, Mail, Phone, Save, Trophy, Calendar, MapPin, TrendingUp, Image as ImageIcon, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useProfile } from '../hooks/useprofile';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/useAuth';
import toast from 'react-hot-toast';

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
   * Resuelve el avatar a una URL visible:
   * - si ya es http(s), se usa tal cual
   * - si es path de bucket privado, genera signed URL
   *
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

  // Resolver avatar si el bucket es privado (signed URL) y renovarlo antes de expirar.
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

    /**
     * Carga resumen de reservas del usuario (total / próximas / favorita).
     * @returns {Promise<void>}
     */
    const fetchStats = async () => {
      const { data } = await supabase
        .from('reservas')
        .select('fecha, instalaciones ( nombre )')
        .eq('user_id', user.id)
        .order('fecha', { ascending: false });

      if (!data) { setLoadingStats(false); return; }

      const proximas = data.filter(r => r.fecha >= hoy).length;

      // Instalación más reservada
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
   * @returns {Promise<void>}
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    await updateProfile(formData);
  };

  /**
   * Abre el selector de fichero para avatar.
   * @returns {void}
   */
  const handlePickAvatar = () => fileRef.current?.click();

  /**
   * Sube el avatar a Storage y guarda el path en `profiles.avatar_url`.
   * @param {import('react').ChangeEvent<HTMLInputElement>} e
   * @returns {Promise<void>}
   */
  const handleAvatarSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    setUploadingAvatar(true);
    try {
      // Bucket requerido en Supabase Storage: `avatars` (público o con policy de lectura para el propio usuario)
      const ext = (file.name.split('.').pop() || 'png').toLowerCase();
      const path = `${user.id}/avatar.${ext}`;

      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type });

      if (upErr) throw upErr;

      const { error: dbErr } = await supabase
        .from('profiles')
        // Guardamos el path (bucket privado). La UI lo resuelve con signed URL.
        .update({ avatar_url: path })
        .eq('id', user.id);

      if (dbErr) throw dbErr;

      toast.success('Foto de perfil actualizada.');
      await refreshProfile();
    } catch (err) {
      toast.error(err?.message || 'No se pudo subir la imagen.');
    } finally {
      setUploadingAvatar(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  if (loading) return <div className="p-8 text-brand-lime animate-pulse">Cargando ficha de jugador...</div>;

  const statsCards = [
    { label: 'Partidos Totales', value: stats.total,    icon: Trophy,   color: 'text-brand-lime',   bg: 'bg-brand-lime/10' },
    { label: 'Próximos',         value: stats.proximas, icon: Calendar, color: 'text-brand-purple', bg: 'bg-brand-purple/10' },
    { label: 'Pista Favorita',   value: stats.favorita, icon: MapPin,   color: 'text-blue-400',     bg: 'bg-blue-400/10', isText: true },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* HEADER / COVER */}
      <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-brand-purple/12 via-white/0 to-brand-lime/10 p-6 md:p-8 anim-shine">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-brand-purple/12 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-brand-lime/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
          {/* Avatar slot */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 shrink-0">
              {avatarDisplayUrl ? (
                <img src={avatarDisplayUrl} alt="Avatar" className="w-full h-full object-cover rounded-3xl" />
              ) : (
                <ImageIcon size={26} />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Mi perfil</p>
              <h1 className="text-3xl md:text-4xl font-black text-white truncate">
                {profile?.full_name || 'Usuario'}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-black text-gray-200 uppercase tracking-widest">
                  <ShieldCheck size={14} className="text-brand-lime" />
                  {roleName}
                </span>
                <span className="text-xs text-gray-500 font-semibold truncate">
                  {profile?.email}
                </span>
              </div>
            </div>
          </div>

          <div className="md:ml-auto flex gap-3">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarSelected}
            />
            <Button type="button" variant="secondary" className="anim-popin" isLoading={uploadingAvatar} onClick={handlePickAvatar}>
              <ImageIcon size={18} /> Subir foto
            </Button>
          </div>
        </div>
      </div>

      {/* Mini Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statsCards.map(({ label, value, icon, color, bg, isText }) => {
          const Icon = icon;
          return (
            <div key={label} className="bg-[#1A1A2E] rounded-3xl p-5 border border-white/5 flex items-center gap-4 hover:border-white/10 transition-colors">
              <div className={`p-2.5 rounded-xl ${bg} ${color} shrink-0`}>
                <Icon size={18} />
              </div>
              <div className="min-w-0">
                <p className={`font-bold ${isText ? 'text-sm truncate' : 'text-2xl'} ${color}`}>
                  {loadingStats ? '—' : value}
                </p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* COLUMNA IZQUIERDA — Foto de perfil (sin duplicar nombre) */}
        <div className="lg:col-span-1">
          <div className="bg-[#1F1F2E] p-6 rounded-3xl border border-white/5 text-center relative overflow-hidden">
            {/* Glow decorativo */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-lime/10 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Foto de perfil</p>
              <div className="w-44 h-44 rounded-3xl bg-white/5 border border-white/10 mx-auto overflow-hidden flex items-center justify-center text-gray-400 mb-5 anim-shine">
                {avatarDisplayUrl ? (
                  <img src={avatarDisplayUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon size={28} />
                )}
              </div>
              <p className="text-sm font-bold text-white mb-1">Sube tu foto</p>
              <p className="text-xs text-gray-500 mb-5">
                Se guardará en tu perfil y se verá en el menú lateral.
              </p>
              <div className="flex flex-col gap-3">
                <Button type="button" variant="primary" className="w-full" isLoading={uploadingAvatar} onClick={handlePickAvatar}>
                  <ImageIcon size={18} /> Cambiar foto
                </Button>
                <Button type="button" variant="secondary" className="w-full" isLoading={uploadingAvatar} onClick={handlePickAvatar}>
                  <ImageIcon size={18} /> Añadir imagen
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA — Formulario */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="bg-[#1A1A2E] p-8 rounded-3xl border border-white/5 space-y-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-black text-white">Datos personales</h3>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Editable</span>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-2 block">
                Correo Electrónico
              </label>
              <div className="flex items-center gap-3 bg-[#0F0F1A] p-4 rounded-xl border border-white/5 opacity-70">
                <Mail className="text-gray-400" size={20} />
                <span className="text-gray-300 text-sm">{profile?.email}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-2 block">
                Nombre Completo
              </label>
              <Input
                icon={User}
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Tu nombre real"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-2 block">Teléfono</label>
              <Input
                icon={Phone}
                type="tel"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="+34 600 000 000"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-2 block">DNI/NIE</label>
                <Input
                  icon={User}
                  type="text"
                  value={formData.dni}
                  onChange={(e) => setFormData({ ...formData, dni: e.target.value.toUpperCase() })}
                  placeholder="12345678Z"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-2 block">Fecha de nacimiento</label>
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
              <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-2 block">Dirección</label>
              <Input
                icon={MapPin}
                type="text"
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                placeholder="Calle Ejemplo 12, 2ºB"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-2 block">Código postal</label>
                <Input
                  icon={MapPin}
                  type="text"
                  value={formData.codigo_postal}
                  onChange={(e) => setFormData({ ...formData, codigo_postal: e.target.value })}
                  placeholder="28001"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-2 block">Municipio</label>
                <Input
                  icon={MapPin}
                  type="text"
                  value={formData.municipio}
                  onChange={(e) => setFormData({ ...formData, municipio: e.target.value })}
                  placeholder="Madrid"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-2 block">Provincia</label>
                <Input
                  icon={MapPin}
                  type="text"
                  value={formData.provincia}
                  onChange={(e) => setFormData({ ...formData, provincia: e.target.value })}
                  placeholder="Madrid"
                  required
                />
              </div>
            </div>

            <Button type="submit" variant="primary" isLoading={updating} className="w-full">
              {!updating && <Save size={20} />}
              {updating ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </form>

          {/* Legal / privacidad */}
          <div className="bg-[#1A1A2E] p-6 rounded-3xl border border-white/5">
            <p className="text-sm font-black text-white mb-2">Privacidad y legal</p>
            <p className="text-xs text-gray-500">
              Consulta la información legal del servicio y cómo tratamos tus datos.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link to="/legal/aviso-legal" className="text-sm font-bold text-gray-300 hover:text-brand-lime transition-colors">
                Aviso legal
              </Link>
              <Link to="/legal/privacidad" className="text-sm font-bold text-gray-300 hover:text-brand-lime transition-colors">
                Política de privacidad
              </Link>
              <Link to="/legal/cookies" className="text-sm font-bold text-gray-300 hover:text-brand-lime transition-colors">
                Política de cookies
              </Link>
              <Link to="/legal/terminos" className="text-sm font-bold text-gray-300 hover:text-brand-lime transition-colors">
                Términos de uso
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
