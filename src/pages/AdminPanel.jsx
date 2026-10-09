import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ShieldAlert, Users, Activity, Search, Bell, MapPin,
  Trash2, PlusCircle, CheckCircle2, XCircle, Edit3, Save,
  Calendar, Clock, BarChart2, TrendingUp, Trophy, Euro, RotateCcw, CreditCard,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/useAuth';
import BrandLoader from '../components/feedback/BrandLoader';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { describeSport } from '../lib/sports';
import {
  DEFAULT_PRICE_CENTS, cancelReserva, cancelErrorMessage, formatEuros, groupReservas, localIsoDate, pricePerSlot, slotStartMs,
} from '../lib/bookings';

function getTabs(t) {
  return [
    { id: 'usuarios', label: t('admin.tabs.users'), icon: Users },
    { id: 'reservas', label: t('admin.tabs.bookings'), icon: Calendar },
    { id: 'instalaciones', label: t('admin.tabs.courts'), icon: MapPin },
    { id: 'avisos', label: t('admin.tabs.alerts'), icon: Bell },
    { id: 'estadisticas', label: t('admin.tabs.stats'), icon: BarChart2 },
  ];
}

const inputCls = 'w-full theme-bg border theme-border theme-text rounded-xl px-4 py-2.5 focus:border-brand-purple dark:focus:border-brand-lime outline-none text-sm';

/** Tarjeta de métrica reutilizable. */
function Kpi({ label, value, icon, tone = 'brand' }) {
  const Icon = icon;
  const tones = {
    brand: 'text-brand-purple dark:text-brand-lime bg-brand-purple/15 dark:bg-brand-lime/15',
    blue: 'text-blue-600 dark:text-blue-400 bg-blue-500/15',
    amber: 'text-amber-700 dark:text-amber-300 bg-amber-500/15',
  };
  return (
    <div className="theme-card p-5 flex items-center gap-4">
      <div className={`p-3.5 rounded-2xl ${tones[tone]}`}><Icon size={22} /></div>
      <div className="min-w-0">
        <p className="text-xs theme-faint font-bold uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-black theme-text tabular-nums">{value}</p>
      </div>
    </div>
  );
}

/* ═════════════════════════════ USUARIOS ═════════════════════════════ */

/**
 * Gestión de usuarios: directorio y cambio de rol.
 * La base de datos impide que un no-admin cambie roles (trigger).
 */
function TabUsuarios() {
  const { t, i18n } = useTranslation();
  const { user: me } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [{ data: uData, error }, { data: rData }, { count }] = await Promise.all([
        supabase.from('profiles').select('id, email, full_name, telefono, created_at, rol_id').order('created_at', { ascending: false }),
        supabase.from('roles').select('id, nombre').order('id'),
        supabase.from('reservas').select('id', { count: 'exact', head: true })
          .gte('fecha', localIsoDate()).in('payment_status', ['pending', 'paid']).eq('currency', 'eur'),
      ]);
      if (!alive) return;
      if (error) toast.error(error.message);
      setUsuarios(uData || []);
      setRoles(rData || []);
      setActiveCount(count || 0);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  const roleName = useCallback((id) => roles.find((r) => r.id === id)?.nombre?.toLowerCase() ?? '', [roles]);

  const changeRole = async (userId, newRolId) => {
    const id = Number(newRolId);
    const { error } = await supabase.from('profiles').update({ rol_id: id }).eq('id', userId);
    if (error) {
      toast.error(t('admin.users.roleError', { msg: error.message }));
    } else {
      toast.success(t('admin.users.roleUpdated'));
      setUsuarios((prev) => prev.map((u) => (u.id === userId ? { ...u, rol_id: id } : u)));
    }
  };

  const term = searchTerm.trim().toLowerCase();
  const filtered = usuarios.filter((u) =>
    !term || u.email?.toLowerCase().includes(term) || u.full_name?.toLowerCase().includes(term));

  if (loading) return <BrandLoader fullscreen={false} label={t('admin.users.loading')} />;

  const staff = usuarios.filter((u) => ['admin', 'conserje'].includes(roleName(u.rol_id))).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Kpi label={t('admin.users.totalUsers')} value={usuarios.length} icon={Users} />
        <Kpi label={t('admin.users.activeStaff')} value={staff} icon={Activity} tone="blue" />
        <Kpi label={t('admin.users.activeBookings')} value={activeCount} icon={CheckCircle2} />
      </div>

      <div className="theme-card overflow-hidden">
        <div className="p-5 border-b theme-border flex flex-col md:flex-row justify-between items-center gap-4">
          <h2 className="text-lg font-bold theme-text">{t('admin.users.directory')}</h2>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 theme-faint" size={18} />
            <input
              type="search"
              aria-label={t('admin.users.searchPlaceholder')}
              placeholder={t('admin.users.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`${inputCls} pl-10`}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="theme-elevated text-xs uppercase tracking-wider theme-muted border-b theme-border">
                <th className="p-4">{t('admin.users.table.user')}</th>
                <th className="p-4">{t('admin.users.table.contact')}</th>
                <th className="p-4">{t('admin.users.table.role')}</th>
                <th className="p-4">{t('admin.users.table.registered')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-brand-purple/10 dark:hover:bg-white/5 transition-colors border-b theme-border">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-purple/10 dark:bg-white/10 flex items-center justify-center text-xs font-bold theme-text">
                        {(u.full_name || u.email || '?').charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium theme-text text-sm">{u.full_name || t('admin.users.noName')}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm">
                    <span className="block theme-text font-medium">{u.email}</span>
                    <span className="text-xs theme-muted">{u.telefono || '—'}</span>
                  </td>
                  <td className="p-4">
                    <select
                      value={u.rol_id ?? ''}
                      onChange={(e) => changeRole(u.id, e.target.value)}
                      disabled={u.id === me?.id}
                      title={u.id === me?.id ? t('admin.users.selfRole') : undefined}
                      aria-label={t('admin.users.table.role')}
                      className="theme-bg border theme-border theme-text text-xs rounded-lg px-2 py-1.5 outline-none cursor-pointer capitalize disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {roles.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                    </select>
                  </td>
                  <td className="p-4 text-sm theme-muted">{new Date(u.created_at).toLocaleDateString(i18n.language)}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="4" className="p-8 text-center theme-faint text-sm">{t('admin.users.notFound')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ═════════════════════════════ INSTALACIONES ═════════════════════════════ */

const ESTADOS = ['disponible', 'mantenimiento', 'ocupada'];
const BASE_TIPOS = ['padel', 'tenis', 'futbol sala', 'baloncesto'];
const emptyCourt = { id: null, nombre: '', tipo: '', estado: 'disponible', precio: (DEFAULT_PRICE_CENTS / 100).toFixed(2) };

/**
 * Gestión de pistas. El deporte (`tipo`) es texto libre: el admin puede crear
 * deportes nuevos y la web los muestra solos (landing, reservas, material).
 */
function TabInstalaciones() {
  const { t, i18n } = useTranslation();
  const [instalaciones, setInstalaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadInst = useCallback(async () => {
    const { data } = await supabase.from('instalaciones').select('*').order('tipo').order('nombre');
    setInstalaciones(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial
    loadInst();
  }, [loadInst]);

  const tipos = useMemo(() => {
    const set = new Set(BASE_TIPOS);
    instalaciones.forEach((i) => i.tipo && set.add(String(i.tipo).toLowerCase()));
    return [...set].sort();
  }, [instalaciones]);

  const handleSave = async (e) => {
    e.preventDefault();
    const nombre = form.nombre.trim();
    const tipo = form.tipo.trim().toLowerCase().replace(/\s+/g, ' ');
    const cents = Math.round(Number(String(form.precio).replace(',', '.')) * 100);
    if (nombre.length < 2) return toast.error(t('admin.courts.nameRequired'));
    if (tipo.length < 2 || tipo.length > 40) return toast.error(t('admin.courts.typeRequired'));
    if (!Number.isFinite(cents) || cents < 0 || cents > 100000) return toast.error(t('admin.courts.priceInvalid'));

    setSaving(true);
    const row = { nombre, tipo, estado: form.estado, precio_hora_cents: cents };
    const { error } = form.id
      ? await supabase.from('instalaciones').update(row).eq('id', form.id)
      : await supabase.from('instalaciones').insert([row]);
    setSaving(false);

    if (error) {
      toast.error(/precio_hora_cents/.test(error.message) ? t('booking.errors.migration') : error.message);
      return;
    }
    toast.success(form.id ? t('admin.courts.updateSuccess') : t('admin.courts.createSuccess'));
    setForm(null);
    loadInst();
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    const { error } = await supabase.from('instalaciones').delete().eq('id', toDelete.id);
    setDeleting(false);
    if (error) {
      toast.error(t('admin.courts.deleteError'));
    } else {
      toast.success(t('admin.courts.deleteSuccess'));
      loadInst();
    }
    setToDelete(null);
  };

  if (loading) return <BrandLoader fullscreen={false} label={t('admin.courts.loading')} />;

  const colorEstado = (e) =>
    e === 'disponible' ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border-emerald-500/30'
      : e === 'mantenimiento' ? 'text-amber-700 dark:text-amber-300 bg-amber-500/15 border-amber-500/30'
        : 'text-red-600 dark:text-red-400 bg-red-500/15 border-red-500/30';

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={!!toDelete}
        title={t('admin.courts.deleteTitle', { name: toDelete?.nombre ?? '' })}
        desc={t('admin.courts.deleteConfirm')}
        confirmLabel={t('admin.courts.delete')}
        cancelLabel={t('admin.courts.cancel')}
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />

      <div className="flex flex-wrap justify-between items-center gap-4 theme-card p-6">
        <div>
          <h2 className="text-lg font-bold theme-text">{t('admin.courts.title')}</h2>
          <p className="text-xs theme-faint">{t('admin.courts.desc')}</p>
        </div>
        <button type="button" onClick={() => setForm({ ...emptyCourt })} className="flex items-center gap-2 px-4 py-2.5 bg-brand-purple dark:bg-brand-lime text-white dark:text-black font-bold rounded-xl hover:-translate-y-0.5 transition-all text-sm shadow-md">
          <PlusCircle size={16} /> {t('admin.courts.newCourt')}
        </button>
      </div>

      {form && (
        <div className="theme-elevated p-6 rounded-3xl border theme-border">
          <h3 className="font-bold theme-text mb-4">{form.id ? t('admin.courts.editCourt') : t('admin.courts.createCourt')}</h3>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="court-name" className="text-xs font-bold theme-faint uppercase block mb-1">{t('admin.courts.name')}</label>
              <input id="court-name" type="text" maxLength={60} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className={inputCls} placeholder={t('admin.courts.namePlaceholder')} required />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="court-type" className="text-xs font-bold theme-faint uppercase block mb-1">{t('admin.courts.type')}</label>
              <input id="court-type" list="court-types" type="text" maxLength={40} value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className={`${inputCls} capitalize`} placeholder={t('admin.courts.typePlaceholder')} required />
              <datalist id="court-types">{tipos.map((x) => <option key={x} value={x} />)}</datalist>
              <p className="mt-1 text-[11px] theme-faint">{t('admin.courts.typeHint')}</p>
            </div>
            <div>
              <label htmlFor="court-price" className="text-xs font-bold theme-faint uppercase block mb-1">{t('admin.courts.price')}</label>
              <div className="relative">
                <input id="court-price" type="number" min="0" max="1000" step="0.5" inputMode="decimal" value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })} className={`${inputCls} pr-8`} required />
                <Euro size={14} className="absolute right-3 top-1/2 -translate-y-1/2 theme-faint" />
              </div>
            </div>
            <div>
              <label htmlFor="court-state" className="text-xs font-bold theme-faint uppercase block mb-1">{t('admin.courts.status')}</label>
              <select id="court-state" value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} className={`${inputCls} capitalize cursor-pointer`}>
                {ESTADOS.map((s) => <option key={s} value={s}>{t(`booking.status.${s}`, { defaultValue: s })}</option>)}
              </select>
            </div>
            <div className="md:col-span-6 flex justify-end gap-3 mt-2">
              <button type="button" onClick={() => setForm(null)} className="px-4 py-2 rounded-xl text-sm font-bold theme-faint hover:theme-text transition-colors">{t('admin.courts.cancel')}</button>
              <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-purple dark:bg-brand-lime text-white dark:text-black text-sm font-bold disabled:opacity-50 shadow-md">
                <Save size={16} /> {saving ? t('admin.courts.saving') : t('admin.courts.save')}
              </button>
            </div>
          </form>
        </div>
      )}

      {instalaciones.length === 0 && (
        <p className="theme-card p-8 text-center theme-faint">{t('admin.courts.empty')}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {instalaciones.map((inst) => (
          <div key={inst.id} className="theme-card p-6 border theme-border space-y-4 hover:border-brand-purple/30 dark:hover:border-brand-lime/30 transition-colors">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-wider text-brand-purple dark:text-brand-lime">{describeSport({ tipo: inst.tipo || 'general' }, t).name}</p>
                <h3 className="font-bold theme-text text-lg truncate">{inst.nombre}</h3>
                <p className="text-sm theme-muted tabular-nums">{formatEuros(pricePerSlot(inst), i18n.language)} / h</p>
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase ${colorEstado(inst.estado)} shrink-0`}>
                {t(`booking.status.${inst.estado}`, { defaultValue: inst.estado })}
              </span>
            </div>
            <div className="flex gap-2 pt-3 border-t theme-border">
              <button
                type="button"
                onClick={() => setForm({ id: inst.id, nombre: inst.nombre ?? '', tipo: inst.tipo ?? '', estado: inst.estado ?? 'disponible', precio: (pricePerSlot(inst) / 100).toFixed(2) })}
                className="flex items-center justify-center flex-1 gap-2 py-2 text-xs font-bold theme-muted border theme-border rounded-xl hover:text-brand-purple dark:hover:text-brand-lime transition-colors"
              >
                <Edit3 size={14} /> {t('admin.courts.edit')}
              </button>
              <button
                type="button"
                onClick={() => setToDelete(inst)}
                className="flex items-center justify-center px-3 py-2 text-xs font-bold theme-muted border theme-border rounded-xl hover:text-red-500 hover:border-red-400/40 transition-colors"
                aria-label={t('admin.courts.deleteTitle', { name: inst.nombre })}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═════════════════════════════ AVISOS ═════════════════════════════ */

function TabAvisos() {
  const { t, i18n } = useTranslation();
  const [avisos, setAvisos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ titulo: '', mensaje: '' });
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from('avisos').select('*').order('created_at', { ascending: false });
    setAvisos(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial
    load();
  }, [load]);

  const toggleAviso = async (id, activo) => {
    const { error } = await supabase.from('avisos').update({ activo: !activo }).eq('id', id);
    if (error) toast.error(error.message);
    else setAvisos((prev) => prev.map((a) => (a.id === id ? { ...a, activo: !activo } : a)));
  };

  const deleteAviso = async () => {
    const id = toDelete;
    setToDelete(null);
    const { error } = await supabase.from('avisos').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success(t('admin.alerts.deleteSuccess')); setAvisos((prev) => prev.filter((a) => a.id !== id)); }
  };

  const createAviso = async (e) => {
    e.preventDefault();
    if (!form.titulo.trim()) return toast.error(t('admin.alerts.titleRequired'));
    if (!form.mensaje.trim()) return toast.error(t('admin.alerts.messageRequired'));
    setSaving(true);
    const { error } = await supabase.from('avisos').insert([{ titulo: form.titulo.trim(), mensaje: form.mensaje.trim(), activo: true }]);
    setSaving(false);
    if (error) return toast.error(t('admin.alerts.createError') + error.message);
    toast.success(t('admin.alerts.publishSuccess'));
    setForm({ titulo: '', mensaje: '' });
    load();
  };

  if (loading) return <BrandLoader fullscreen={false} label={t('admin.alerts.loading')} />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <ConfirmDialog
        open={toDelete != null}
        title={t('admin.alerts.deleteConfirm')}
        confirmLabel={t('admin.courts.delete')}
        cancelLabel={t('admin.courts.cancel')}
        onConfirm={deleteAviso}
        onCancel={() => setToDelete(null)}
      />
      <div>
        <h3 className="text-lg font-bold theme-text mb-4">{t('admin.alerts.newAlert')}</h3>
        <form onSubmit={createAviso} className="theme-card p-6 space-y-4">
          <div>
            <label htmlFor="alert-title" className="text-xs font-bold theme-faint uppercase block mb-2">{t('admin.alerts.titleLabel')}</label>
            <input id="alert-title" type="text" maxLength={120} value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder={t('admin.alerts.titlePlaceholder')} className={inputCls} />
          </div>
          <div>
            <label htmlFor="alert-msg" className="text-xs font-bold theme-faint uppercase block mb-2">{t('admin.alerts.messageLabel')}</label>
            <textarea id="alert-msg" maxLength={1000} value={form.mensaje} onChange={(e) => setForm({ ...form, mensaje: e.target.value })} placeholder={t('admin.alerts.messagePlaceholder')} rows={4} className={`${inputCls} resize-none`} />
          </div>
          <button type="submit" disabled={saving} className="w-full flex items-center justify-center gap-2 py-3 bg-brand-purple dark:bg-brand-lime text-white dark:text-black font-bold rounded-xl transition-all disabled:opacity-50 shadow-md">
            <PlusCircle size={18} /> {saving ? t('admin.alerts.publishing') : t('admin.alerts.publishBtn')}
          </button>
        </form>
      </div>

      <div>
        <h3 className="text-lg font-bold theme-text mb-4">{t('admin.alerts.published', { count: avisos.length })}</h3>
        <div className="space-y-4">
          {avisos.length === 0 && <p className="theme-faint text-sm">{t('admin.alerts.noAlerts')}</p>}
          {avisos.map((aviso) => (
            <div key={aviso.id} className={`p-5 rounded-2xl border transition-all ${aviso.activo ? 'bg-brand-purple/10 dark:bg-brand-lime/10 border-brand-purple/30 dark:border-brand-lime/30' : 'theme-elevated theme-border opacity-70'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="font-bold theme-text text-sm">{aviso.titulo}</h4>
                  <p className="text-xs theme-faint mt-1 leading-relaxed">{aviso.mensaje}</p>
                  <p className="text-[10px] theme-faint mt-2">{new Date(aviso.created_at).toLocaleDateString(i18n.language)}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button type="button" onClick={() => toggleAviso(aviso.id, aviso.activo)} aria-label={aviso.activo ? t('admin.alerts.deactivate') : t('admin.alerts.activate')} className="p-2 rounded-lg transition-colors">
                    {aviso.activo ? <CheckCircle2 size={18} className="text-brand-purple dark:text-brand-lime" /> : <XCircle size={18} className="theme-faint" />}
                  </button>
                  <button type="button" onClick={() => setToDelete(aviso.id)} aria-label={t('admin.courts.delete')} className="p-2 rounded-lg hover:bg-red-500/10 theme-faint hover:text-red-500 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═════════════════════════════ RESERVAS ═════════════════════════════ */

const PAY_STYLE = {
  paid: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
  pending: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
  refunded: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20',
  failed: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
  cancelled: 'bg-zinc-500/10 theme-muted border-zinc-500/20',
};
const PAGE_SIZE = 500;

/**
 * Reservas de todo el centro. La cancelación pasa por el servidor:
 * pendiente → se libera; pagada → reembolso automático con Stripe.
 */
function TabReservas() {
  const { t, i18n } = useTranslation();
  const [rows, setRows] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('proximas');
  const [soloActivas, setSoloActivas] = useState(true);
  const [toCancel, setToCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchPage = useCallback(async (offset) => {
    const { data, error, count } = await supabase
      .from('reservas')
      .select('id, fecha, hora, created_at, user_id, currency, payment_status, precio_cents, instalaciones ( nombre, tipo ), reserva_material ( cantidad, inventario ( nombre ) )', { count: 'exact' })
      .order('fecha', { ascending: false })
      .order('hora', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) {
      toast.error(error.message);
      return;
    }
    const ids = [...new Set((data || []).map((r) => r.user_id))];
    if (ids.length) {
      const { data: perf } = await supabase.from('profiles').select('id, full_name, email, telefono').in('id', ids);
      setProfiles((prev) => ({ ...prev, ...Object.fromEntries((perf || []).map((p) => [p.id, p])) }));
    }
    setTotalCount(typeof count === 'number' ? count : null);
    setRows((prev) => (offset === 0 ? data || [] : [...prev, ...(data || [])]));
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      await supabase.rpc('expire_pending_reservas').then(() => {}, () => {});
      await fetchPage(0);
      if (alive) setLoading(false);
    })();
    return () => { alive = false; };
  }, [fetchPage]);

  const handleCancel = async () => {
    if (!toCancel) return;
    setCancelling(true);
    try {
      const result = await cancelReserva(toCancel);
      const status = result === 'refunded' ? 'refunded' : 'cancelled';
      setRows((prev) => prev.map((r) => (r.id === toCancel.id || r.currency === `linked_${toCancel.id}` ? { ...r, payment_status: status } : r)));
      toast.success(result === 'refunded' ? t('history.refundSuccess') : t('admin.bookings.cancelSuccess'));
      setToCancel(null);
    } catch (err) {
      toast.error(cancelErrorMessage(err, t));
    } finally {
      setCancelling(false);
    }
  };

  const hoy = localIsoDate();
  const grouped = groupReservas(rows);
  const isActive = (r) => r.payment_status === 'pending' || r.payment_status === 'paid';
  const term = searchTerm.trim().toLowerCase();

  const filtradas = grouped
    .filter((r) => (filtroFecha === 'proximas' ? r.fecha >= hoy : filtroFecha === 'pasadas' ? r.fecha < hoy : true))
    .filter((r) => !soloActivas || isActive(r))
    .filter((r) => {
      if (!term) return true;
      const p = profiles[r.user_id];
      return p?.full_name?.toLowerCase().includes(term) || p?.email?.toLowerCase().includes(term) || r.instalaciones?.nombre?.toLowerCase().includes(term);
    })
    .sort((a, b) => (filtroFecha === 'proximas' ? slotStartMs(a.fecha, a.franjas[0]) - slotStartMs(b.fecha, b.franjas[0]) : 0));

  const proximas = grouped.filter((r) => r.fecha >= hoy && isActive(r)).length;
  const ingresos = grouped.filter((r) => r.payment_status === 'paid').reduce((s, r) => s + (Number(r.precio_cents) || 0), 0);

  if (loading) return <BrandLoader fullscreen={false} label={t('admin.bookings.loading')} />;

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={!!toCancel}
        title={t('admin.bookings.cancelModal.title')}
        desc={toCancel?.payment_status === 'paid'
          ? t('admin.bookings.cancelModal.descPaid', { amount: formatEuros(toCancel.precio_cents, i18n.language) })
          : t('admin.bookings.cancelModal.desc')}
        confirmLabel={cancelling ? t('admin.bookings.cancelModal.cancelling') : t('admin.bookings.cancelModal.confirm')}
        cancelLabel={t('admin.bookings.cancelModal.back')}
        busy={cancelling}
        onConfirm={handleCancel}
        onCancel={() => setToCancel(null)}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Kpi label={t('admin.bookings.totalBookings')} value={grouped.length} icon={Calendar} />
        <Kpi label={t('admin.bookings.upcoming')} value={proximas} icon={Clock} tone="blue" />
        <Kpi label={t('admin.bookings.revenue')} value={formatEuros(ingresos, i18n.language)} icon={Euro} tone="amber" />
      </div>

      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center flex-wrap">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 theme-faint" size={18} />
          <input type="search" aria-label={t('admin.bookings.searchPlaceholder')} placeholder={t('admin.bookings.searchPlaceholder')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`${inputCls} pl-10`} />
        </div>
        <div className="flex gap-1 theme-elevated p-1 rounded-2xl border theme-border" role="group">
          {['proximas', 'pasadas', 'todas'].map((id) => (
            <button key={id} type="button" aria-pressed={filtroFecha === id} onClick={() => setFiltroFecha(id)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filtroFecha === id ? 'bg-brand-purple dark:bg-brand-lime text-white dark:text-black shadow-sm' : 'theme-faint hover:theme-text'}`}>
              {t(`admin.bookings.filters.${id === 'proximas' ? 'upcoming' : id === 'pasadas' ? 'past' : 'all'}`)}
            </button>
          ))}
        </div>
        <label className="inline-flex items-center gap-2 text-sm font-bold theme-muted cursor-pointer select-none">
          <input type="checkbox" checked={soloActivas} onChange={(e) => setSoloActivas(e.target.checked)} className="h-4 w-4 accent-[#8A2BE2]" />
          {t('admin.bookings.onlyActive')}
        </label>
      </div>

      <div className="theme-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="theme-bg text-xs uppercase tracking-wider theme-faint border-b theme-border">
                <th className="p-4">{t('admin.bookings.table.user')}</th>
                <th className="p-4">{t('admin.bookings.table.court')}</th>
                <th className="p-4">{t('admin.bookings.table.date')}</th>
                <th className="p-4">{t('admin.bookings.table.time')}</th>
                <th className="p-4">{t('admin.bookings.table.material')}</th>
                <th className="p-4">{t('admin.bookings.table.status')}</th>
                <th className="p-4"><span className="sr-only">{t('history.cancel')}</span></th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((r) => {
                const p = profiles[r.user_id];
                const mat = Array.isArray(r.reserva_material) ? r.reserva_material : [];
                const future = slotStartMs(r.fecha, r.franjas[0]) > Date.now();
                return (
                  <tr key={r.id} className="border-b theme-border hover:bg-brand-purple/5 dark:hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <p className="text-sm font-medium theme-text">{p?.full_name || t('admin.bookings.noName')}</p>
                      <p className="text-xs theme-faint">{p?.email}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm theme-text">{r.instalaciones?.nombre || '—'}</p>
                      <p className="text-xs theme-faint capitalize">{r.instalaciones?.tipo || ''}</p>
                    </td>
                    <td className="p-4 text-sm theme-text capitalize whitespace-nowrap">
                      {new Date(`${r.fecha}T00:00:00`).toLocaleDateString(i18n.language, { weekday: 'short', day: 'numeric', month: 'short' })}
                    </td>
                    <td className="p-4 text-sm theme-text tabular-nums">{r.franjas.join(', ')}</td>
                    <td className="p-4 text-xs">
                      {mat.length === 0 ? <span className="theme-faint">—</span> : mat.slice(0, 3).map((m, i) => (
                        <div key={i}><span className="theme-text font-bold">{m.cantidad}×</span> <span className="theme-faint">{m.inventario?.nombre}</span></div>
                      ))}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${PAY_STYLE[r.payment_status] ?? PAY_STYLE.cancelled}`}>
                        {r.payment_status === 'refunded' ? <RotateCcw size={11} /> : <CreditCard size={11} />}
                        {t(`history.status.${r.payment_status}`, { defaultValue: r.payment_status })}
                      </span>
                      <p className="mt-1 text-xs theme-faint tabular-nums">{formatEuros(r.precio_cents, i18n.language)}</p>
                    </td>
                    <td className="p-4">
                      {future && isActive(r) && (
                        <button type="button" onClick={() => setToCancel(r)} className="p-2 rounded-lg theme-faint hover:text-red-500 hover:bg-red-500/10 transition-colors" aria-label={t('history.cancel')}>
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtradas.length === 0 && (
                <tr><td colSpan="7" className="p-10 text-center theme-faint text-sm">{term ? t('admin.bookings.noResultsSearch') : t('admin.bookings.noResults')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {totalCount != null && rows.length < totalCount && (
          <div className="px-4 py-3 border-t theme-border text-xs theme-faint flex items-center justify-between gap-2">
            <span>{t('admin.bookings.loaded', { count: rows.length })}</span>
            <button
              type="button"
              onClick={async () => { setLoadingMore(true); await fetchPage(rows.length); setLoadingMore(false); }}
              disabled={loadingMore}
              className="px-4 py-2 rounded-xl theme-bg border theme-border theme-text font-bold disabled:opacity-50"
            >
              {loadingMore ? t('admin.bookings.loading2') : t('admin.bookings.loadMore')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═════════════════════════════ ESTADÍSTICAS ═════════════════════════════ */

function Bars({ items, total }) {
  const max = Math.max(1, ...items.map(([, v]) => v));
  return (
    <div className="space-y-4">
      {items.map(([label, value], idx) => (
        <div key={label}>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="theme-text font-medium flex items-center gap-2 capitalize truncate">
              {idx === 0 && <Trophy size={12} className="text-brand-purple dark:text-brand-lime" />}{label}
            </span>
            <span className="theme-faint shrink-0 tabular-nums">{total ? `${Math.round((value / total) * 100)}% · ` : ''}{value}</span>
          </div>
          <div className="h-2 theme-bg rounded-full overflow-hidden border theme-border">
            <div className="h-full rounded-full bg-brand-purple dark:bg-brand-lime transition-all duration-700" style={{ width: `${Math.round((value / max) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function TabEstadisticasAdmin() {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [reservas, setReservas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [{ data: rData }, { data: uData }] = await Promise.all([
        supabase.from('reservas').select('id, fecha, hora, user_id, precio_cents, currency, payment_status, instalaciones ( nombre, tipo )').eq('payment_status', 'paid'),
        supabase.from('profiles').select('id, full_name, email'),
      ]);
      if (!alive) return;
      setReservas(rData || []);
      setUsuarios(uData || []);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  if (loading) return <BrandLoader fullscreen={false} label={t('admin.adminStats.loading')} />;

  // Cada fila pagada es una hora de pista ocupada
  const hoy = localIsoDate();
  const dias = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 7 + i).toLocaleDateString(i18n.language, { weekday: 'short' }));
  const porDia = Array(7).fill(0);
  const porInst = {};
  const porTipo = {};
  const porUser = {};
  for (const r of reservas) {
    porDia[new Date(`${r.fecha}T00:00:00`).getDay()]++;
    const n = r.instalaciones?.nombre;
    if (n) porInst[n] = (porInst[n] || 0) + 1;
    const tp = describeSport({ tipo: r.instalaciones?.tipo || 'general' }, t).name;
    porTipo[tp] = (porTipo[tp] || 0) + 1;
    porUser[r.user_id] = (porUser[r.user_id] || 0) + 1;
  }
  const maxDia = Math.max(...porDia, 1);
  const userName = (id) => { const u = usuarios.find((x) => x.id === id); return u?.full_name || u?.email || '—'; };
  const topUsers = Object.entries(porUser).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, c]) => [userName(id), c]);
  const ingresos = reservas.reduce((s, r) => s + (Number(r.precio_cents) || 0), 0);
  const proximas = reservas.filter((r) => r.fecha >= hoy).length;
  const media = usuarios.length ? (reservas.length / usuarios.length).toFixed(1) : '0';

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi label={t('admin.adminStats.hoursBooked')} value={reservas.length} icon={Calendar} />
        <Kpi label={t('admin.adminStats.upcoming')} value={proximas} icon={Clock} tone="blue" />
        <Kpi label={t('admin.bookings.revenue')} value={formatEuros(ingresos, i18n.language)} icon={Euro} tone="amber" />
        <Kpi label={t('admin.adminStats.avgPerUser')} value={media} icon={TrendingUp} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="theme-card p-6">
          <h3 className="text-base font-bold theme-text mb-6 flex items-center gap-2"><BarChart2 size={18} className="text-brand-purple dark:text-brand-lime" />{t('admin.adminStats.byDay')}</h3>
          <div className="flex items-end gap-2 h-40">
            {dias.map((dia, i) => (
              <div key={dia + i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] theme-faint font-bold">{porDia[i] || ''}</span>
                <div className="w-full relative h-28">
                  <div className="absolute bottom-0 inset-x-0 rounded-t-lg bg-brand-purple/80 dark:bg-brand-lime/80" style={{ height: `${Math.max(Math.round((porDia[i] / maxDia) * 100), porDia[i] ? 4 : 0)}%` }} />
                </div>
                <span className="text-[10px] theme-faint font-medium capitalize">{dia}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="theme-card p-6">
          <h3 className="text-base font-bold theme-text mb-6 flex items-center gap-2"><MapPin size={18} className="text-brand-purple dark:text-brand-lime" />{t('admin.adminStats.courtRanking')}</h3>
          {Object.keys(porInst).length === 0 ? <p className="theme-faint text-sm">{t('admin.adminStats.noData')}</p> : <Bars items={Object.entries(porInst).sort((a, b) => b[1] - a[1])} />}
        </div>
        <div className="theme-card p-6">
          <h3 className="text-base font-bold theme-text mb-6 flex items-center gap-2"><Trophy size={18} className="text-brand-purple dark:text-brand-lime" />{t('admin.adminStats.topUsers')}</h3>
          {topUsers.length === 0 ? <p className="theme-faint text-sm">{t('admin.adminStats.noActivity')}</p> : <Bars items={topUsers} />}
        </div>
        <div className="theme-card p-6">
          <h3 className="text-base font-bold theme-text mb-6 flex items-center gap-2"><TrendingUp size={18} className="theme-faint" />{t('admin.adminStats.byType')}</h3>
          {Object.keys(porTipo).length === 0 ? <p className="theme-faint text-sm">{t('admin.adminStats.noData')}</p> : <Bars items={Object.entries(porTipo).sort((a, b) => b[1] - a[1])} total={reservas.length} />}
        </div>
      </div>
    </div>
  );
}

/* ═════════════════════════════ PANEL ═════════════════════════════ */

export default function AdminPanel() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('usuarios');
  const TABS = getTabs(t);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b theme-border pb-6">
        <div>
          <h1 className="text-3xl font-black theme-text flex items-center gap-3">
            <ShieldAlert className="text-brand-purple dark:text-brand-lime" size={32} />
            {t('admin.title')}
          </h1>
          <p className="theme-faint text-sm mt-1">{t('admin.subtitle')}</p>
        </div>
      </header>

      <div className="flex flex-wrap gap-2 theme-card p-1 border theme-border w-fit shadow-sm" role="tablist" aria-label={t('admin.title')}>
        {TABS.map(({ id, label, icon }) => {
          const Icon = icon;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={activeTab === id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === id ? 'bg-brand-purple dark:bg-brand-lime text-white dark:text-black shadow-sm' : 'theme-faint hover:theme-text'}`}
            >
              <Icon size={16} />{label}
            </button>
          );
        })}
      </div>

      <div role="tabpanel">
        {activeTab === 'usuarios' && <TabUsuarios />}
        {activeTab === 'reservas' && <TabReservas />}
        {activeTab === 'instalaciones' && <TabInstalaciones />}
        {activeTab === 'avisos' && <TabAvisos />}
        {activeTab === 'estadisticas' && <TabEstadisticasAdmin />}
      </div>
    </div>
  );
}
