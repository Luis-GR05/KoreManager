import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';
import {
  ShieldAlert, Users, Activity, Search, Bell, MapPin,
  Trash2, PlusCircle, CheckCircle2, XCircle, Edit3, Save,
  Calendar, Clock, Filter, BarChart2, TrendingUp, Trophy
} from 'lucide-react';
import toast from 'react-hot-toast';

function getTabs(t) {
  return [
    { id: 'usuarios',      label: t('admin.tabs.users'),    icon: Users },
    { id: 'reservas',      label: t('admin.tabs.bookings'), icon: Calendar },
    { id: 'instalaciones', label: t('admin.tabs.courts'),   icon: MapPin },
    { id: 'avisos',        label: t('admin.tabs.alerts'),   icon: Bell },
    { id: 'estadisticas',  label: t('admin.tabs.stats'),    icon: BarChart2 },
  ];
}

/**
 * Tab de gestión de usuarios:
 * - listado de perfiles
 * - edición de rol
 * - métricas básicas
 * @returns {import('react').JSX.Element}
 */
function TabUsuarios() {
  const [usuarios, setUsuarios]     = useState([]);
  const [roles, setRoles]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [reservasCount, setReservasCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      const [{ data: uData }, { data: rData }, { count }] = await Promise.all([
        supabase
          .from('profiles')
          .select(`id, email, full_name, telefono, created_at, rol_id, roles ( nombre )`)
          .order('created_at', { ascending: false }),
        supabase.from('roles').select('*'),
        supabase.from('reservas').select('*', { count: 'exact', head: true })
          .gte('fecha', new Date().toISOString().split('T')[0]),
      ]);
      setUsuarios(uData || []);
      setRoles(rData || []);
      setReservasCount(count || 0);
      setLoading(false);
    };
    load();
  }, []);

  const changeRole = async (userId, newRolId) => {
    const { error } = await supabase
      .from('profiles')
      .update({ rol_id: Number(newRolId) })
      .eq('id', userId);

    if (error) {
      toast.error('Error cambiando rol: ' + error.message);
    } else {
      toast.success('Rol actualizado.');
      setUsuarios(prev =>
        prev.map(u => u.id === userId
          ? { ...u, rol_id: Number(newRolId), roles: roles.find(r => r.id === Number(newRolId)) }
          : u
        )
      );
    }
  };

  const filtered = usuarios.filter(u =>
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const { t } = useTranslation();
  if (loading) return <p className="text-brand-lime animate-pulse">{t('admin.users.loading')}</p>;

  return (
    <div className="space-y-6">
      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: t('admin.users.totalUsers'),    value: usuarios.length,                              color: 'text-brand-purple dark:text-brand-lime',   bg: 'bg-brand-purple/10 dark:bg-brand-lime/10',    icon: Users },
          { label: t('admin.users.activeStaff'),   value: usuarios.filter(u => u.rol_id === 2).length, color: 'text-blue-500 dark:text-blue-400',     bg: 'bg-blue-500/10 dark:bg-blue-400/10',     icon: Activity },
          { label: t('admin.users.activeBookings'),    value: reservasCount,                               color: 'text-brand-purple dark:text-brand-lime', bg: 'bg-brand-purple/10 dark:bg-brand-lime/10',  icon: CheckCircle2 },
        ].map(({ label, value, color, bg, icon }) => {
          const Icon = icon;
          return (
            <div key={label} className="theme-card p-6 flex items-center gap-4 border-none shadow-md">
              <div className={`p-4 ${bg} rounded-2xl ${color}`}><Icon size={24} /></div>
              <div>
                <p className="text-xs theme-faint font-bold uppercase tracking-wider">{label}</p>
                <p className="text-2xl font-bold theme-text">{value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabla */}
      <div className="theme-card overflow-hidden">
        <div className="p-6 border-b theme-border flex flex-col md:flex-row justify-between items-center gap-4">
          <h2 className="text-lg font-bold theme-text">{t('admin.users.directory')}</h2>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 theme-faint" size={18} />
            <input
              type="text"
              placeholder={t('admin.users.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full theme-bg border theme-border rounded-xl py-2 pl-10 pr-4 theme-text focus:border-brand-purple dark:focus:border-brand-lime outline-none text-sm"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="theme-bg text-xs uppercase tracking-wider theme-faint border-b theme-border">
                <th className="p-4">{t('admin.users.table.user')}</th>
                <th className="p-4">{t('admin.users.table.contact')}</th>
                <th className="p-4">{t('admin.users.table.role')}</th>
                <th className="p-4">{t('admin.users.table.registered')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((user) => (
                <tr key={user.id} className="hover:bg-brand-purple/5 dark:hover:bg-white/5 transition-colors border-b theme-border">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-purple/10 dark:bg-white/10 flex items-center justify-center text-xs font-bold theme-text">
                        {(user.full_name || user.email || '?').charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium theme-text text-sm">{user.full_name || t('admin.users.noName')}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm theme-faint">
                    <div className="flex flex-col">
                      <span className="theme-text">{user.email}</span>
                      <span className="text-xs theme-faint">{user.telefono || '—'}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <select
                      value={user.rol_id}
                      onChange={(e) => changeRole(user.id, e.target.value)}
                      className="theme-bg border theme-border theme-text text-xs rounded-lg px-2 py-1 focus:border-brand-purple dark:focus:border-brand-lime outline-none cursor-pointer"
                    >
                      {roles.map(r => (
                        <option key={r.id} value={r.id}>{r.nombre}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-4 text-sm theme-faint">
                    {new Date(user.created_at).toLocaleDateString('es-ES')}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-500 text-sm">{t('admin.users.notFound')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/**
 * Tab de gestión de instalaciones:
 * - listado de instalaciones
 * - cambio de estado (staff)
 * @returns {import('react').JSX.Element}
 */
function TabInstalaciones() {
  const [instalaciones, setInstalaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState({ id: null, nombre: '', tipo: 'padel', estado: 'disponible' });
  const [saving, setSaving] = useState(false);

  const ESTADOS = ['disponible', 'mantenimiento', 'ocupada'];
  const TIPOS = ['padel', 'tenis', 'futbol', 'baloncesto', 'general'];

  const loadInst = async () => {
    const { data } = await supabase.from('instalaciones').select('*').order('id');
    setInstalaciones(data || []);
    setLoading(false);
  };

  useEffect(() => { loadInst(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return toast.error(t('admin.courts.nameRequired'));
    if (!form.tipo) return toast.error('El tipo es obligatorio');
    setSaving(true);

    if (form.id) {
       const { error } = await supabase.from('instalaciones').update({ nombre: form.nombre, tipo: form.tipo, estado: form.estado }).eq('id', form.id);
       if (error) toast.error(error.message);
       else { toast.success('Pista actualizada'); setIsFormOpen(false); loadInst(); }
    } else {
       const { error } = await supabase.from('instalaciones').insert([{ nombre: form.nombre, tipo: form.tipo, estado: form.estado }]);
       if (error) toast.error(error.message);
       else { toast.success('Pista creada'); setIsFormOpen(false); loadInst(); }
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
     if(!window.confirm('¿Seguro que deseas eliminar esta pista permanentemente? (Podría fallar si tiene referencias)')) return;
     const { error } = await supabase.from('instalaciones').delete().eq('id', id);
     if (error) {
       toast.error('PostgreSQL avisó: error al borrar. Puede que tenga reservas activas.');
     } else {
       toast.success('Instalación eliminada definitivamente.');
       loadInst();
     }
  };

  const openEdit = (inst) => { setForm(inst); setIsFormOpen(true); };
  const openNew = () => { setForm({ id: null, nombre: '', tipo: 'padel', estado: 'disponible' }); setIsFormOpen(true); };

  const { t } = useTranslation();
  if (loading) return <p className="text-brand-lime animate-pulse">{t('admin.courts.loading')}</p>;

  const colorEstado = (e) =>
    e === 'disponible'    ? 'text-brand-lime bg-brand-lime/10 border-brand-lime/20' :
    e === 'mantenimiento' ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' :
                            'text-red-400 bg-red-400/10 border-red-400/20';

  return (
    <div className="space-y-6">
      
      {/* Botón arriba a la derecha para crear */}
      <div className="flex justify-between items-center theme-card p-6">
        <div>
          <h2 className="text-lg font-bold theme-text">{t('admin.courts.title')}</h2>
          <p className="text-xs theme-faint">{t('admin.courts.desc')}</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-brand-purple dark:bg-brand-lime text-white dark:text-black font-bold rounded-xl hover:scale-105 transition-all text-sm shadow-md">
          <PlusCircle size={16} /> {t('admin.courts.newCourt')}
        </button>
      </div>

      {/* Formulario Modal si isFormOpen está true */}
      {isFormOpen && (
        <div className="theme-elevated p-6 rounded-3xl border theme-border space-y-4 mb-6">
          <h3 className="font-bold theme-text mb-2">{form.id ? t('admin.courts.editCourt') : t('admin.courts.createCourt')}</h3>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-bold theme-faint uppercase block mb-1">Nombre</label>
              <input type="text" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} className="w-full theme-bg border theme-border theme-text rounded-xl px-4 py-2 focus:border-brand-purple dark:focus:border-brand-lime outline-none text-sm" placeholder="Ej: Pista 1 Centro" required />
            </div>
            
            <div>
              <label className="text-xs font-bold theme-faint uppercase block mb-1">Tipo</label>
              <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})} className="w-full theme-bg border theme-border theme-text rounded-xl px-4 py-2 focus:border-brand-purple dark:focus:border-brand-lime outline-none text-sm capitalize cursor-pointer">
                {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold theme-faint uppercase block mb-1">Estado</label>
              <select value={form.estado} onChange={e => setForm({...form, estado: e.target.value})} className="w-full theme-bg border theme-border theme-text rounded-xl px-4 py-2 focus:border-brand-purple dark:focus:border-brand-lime outline-none text-sm capitalize cursor-pointer">
                {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="md:col-span-4 flex justify-end gap-3 mt-2">
              <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 rounded-xl text-sm font-bold theme-faint hover:theme-text hover:theme-elevated transition-colors">Cancelar</button>
              <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-purple dark:bg-brand-lime text-white dark:text-black text-sm font-bold disabled:opacity-50 hover:scale-105 transition-all shadow-md">
                <Save size={16} /> {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid de Pistas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {instalaciones.map(inst => (
          <div key={inst.id} className="theme-card p-6 border theme-border space-y-4 hover:border-brand-purple/30 dark:hover:border-brand-lime/30 transition-colors group">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold theme-text text-lg">{inst.nombre}</h3>
                <p className="text-xs theme-faint uppercase mt-0.5">Tipo: {inst.tipo || 'general'}</p>
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase ${colorEstado(inst.estado)} shrink-0 shadow-sm`}>
                {inst.estado}
              </span>
            </div>

            <div className="flex gap-2 pt-2 border-t theme-border opacity-80 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => openEdit(inst)}
                className="flex items-center justify-center flex-1 gap-2 py-2 text-xs font-bold theme-faint border theme-border rounded-xl hover:text-brand-purple dark:hover:text-brand-lime hover:border-brand-purple/30 dark:hover:border-brand-lime/30 transition-colors"
                title="Editar pista"
              >
                <Edit3 size={14} /> Editar
              </button>
              <button
                onClick={() => handleDelete(inst.id)}
                className="flex items-center justify-center flex-none px-3 py-2 text-xs font-bold theme-faint border theme-border rounded-xl hover:text-red-400 hover:border-red-400/30 transition-colors"
                title="Borrar pista"
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

/**
 * Tab de avisos:
 * - creación de avisos (admin)
 * - listado y activación/desactivación
 * @returns {import('react').JSX.Element}
 */
function TabAvisos() {
  const [avisos, setAvisos]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm]       = useState({ titulo: '', mensaje: '' });
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.from('avisos').select('*').order('created_at', { ascending: false });
      if (!alive) return;
      setAvisos(data || []);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  const toggleAviso = async (id, activo) => {
    const { error } = await supabase.from('avisos').update({ activo: !activo }).eq('id', id);
    if (error) toast.error('Error: ' + error.message);
    else setAvisos(prev => prev.map(a => a.id === id ? { ...a, activo: !activo } : a));
  };

  const deleteAviso = async (id) => {
    if (!confirm('¿Eliminar este aviso permanentemente?')) return;
    const { error } = await supabase.from('avisos').delete().eq('id', id);
    if (error) toast.error('Error: ' + error.message);
    else { toast.success('Aviso eliminado.'); setAvisos(prev => prev.filter(a => a.id !== id)); }
  };

  const createAviso = async (e) => {
    e.preventDefault();
    if (!form.titulo.trim()) { toast.error(t('admin.alerts.titleRequired')); return; }
    if (!form.mensaje.trim()) { toast.error('El mensaje no puede estar vacío.'); return; }
    setSaving(true);
    const { error } = await supabase.from('avisos').insert([{ titulo: form.titulo, mensaje: form.mensaje, activo: true }]);
    if (error) {
      toast.error('Error al crear: ' + error.message);
    } else {
      toast.success('Aviso publicado.');
      setForm({ titulo: '', mensaje: '' });
      // refrescar lista
      const { data } = await supabase.from('avisos').select('*').order('created_at', { ascending: false });
      setAvisos(data || []);
    }
    setSaving(false);
  };

  const { t } = useTranslation();
  if (loading) return <p className="text-brand-lime animate-pulse">{t('admin.alerts.loading')}</p>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Formulario */}
      <div>
        <h3 className="text-lg font-bold theme-text mb-4">{t('admin.alerts.newAlert')}</h3>
        <form onSubmit={createAviso} className="theme-card p-6 space-y-4">
          <div>
            <label className="text-xs font-bold theme-faint uppercase block mb-2">Título</label>
            <input
              type="text"
              value={form.titulo}
              onChange={e => setForm({ ...form, titulo: e.target.value })}
              placeholder="Título del aviso"
              className="w-full theme-bg border theme-border theme-text rounded-xl px-4 py-3 focus:border-brand-purple dark:focus:border-brand-lime outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-bold theme-faint uppercase block mb-2">Mensaje</label>
            <textarea
              value={form.mensaje}
              onChange={e => setForm({ ...form, mensaje: e.target.value })}
              placeholder="Descripción detallada..."
              rows={4}
              className="w-full theme-bg border theme-border theme-text rounded-xl px-4 py-3 focus:border-brand-purple dark:focus:border-brand-lime outline-none resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 bg-brand-purple dark:bg-brand-lime text-white dark:text-black font-bold rounded-xl hover:scale-[1.02] transition-all disabled:opacity-50 shadow-md"
          >
            <PlusCircle size={18} /> {saving ? 'Publicando...' : 'Publicar Aviso'}
          </button>
        </form>
      </div>

      {/* Lista */}
      <div>
        <h3 className="text-lg font-bold theme-text mb-4">{t('admin.alerts.published', { count: avisos.length })}</h3>
        <div className="space-y-4">
          {avisos.length === 0 && <p className="text-gray-500 text-sm">{t('admin.alerts.noAlerts')}</p>}
          {avisos.map(aviso => (
            <div
              key={aviso.id}
              className={`p-5 rounded-2xl border transition-all ${aviso.activo
                ? 'bg-brand-purple/5 dark:bg-brand-lime/5 border-brand-purple/20 dark:border-brand-lime/20'
                : 'theme-elevated opacity-50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-bold theme-text text-sm">{aviso.titulo}</h4>
                  <p className="text-xs theme-faint mt-1 leading-relaxed">{aviso.mensaje}</p>
                  <p className="text-[10px] theme-faint mt-2">
                    {new Date(aviso.created_at).toLocaleDateString('es-ES')}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleAviso(aviso.id, aviso.activo)}
                    title={aviso.activo ? 'Desactivar' : 'Activar'}
                    className="p-2 rounded-lg hover:theme-elevated transition-colors"
                  >
                    {aviso.activo
                      ? <CheckCircle2 size={18} className="text-brand-purple dark:text-brand-lime" />
                      : <XCircle size={18} className="theme-faint" />
                    }
                  </button>
                  <button
                    onClick={() => deleteAviso(aviso.id)}
                    className="p-2 rounded-lg hover:bg-red-500/10 theme-faint hover:text-red-500 transition-colors"
                  >
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

/**
 * Tab de reservas globales:
 * - listado paginado (evita límites PostgREST)
 * - búsqueda y filtro por fecha
 * - cancelación de reservas futuras
 * @returns {import('react').JSX.Element}
 */
function TabReservas() {
  const [reservas, setReservas]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [loadingMore, setLoadingMore]   = useState(false);
  const [totalCount, setTotalCount]     = useState(null);
  const [hasMore, setHasMore]           = useState(true);
  const [searchTerm, setSearchTerm]     = useState('');
  const [filtroFecha, setFiltroFecha]   = useState('proximas'); // 'proximas' | 'pasadas' | 'todas'
  const [confirmId, setConfirmId]       = useState(null);
  const [cancelling, setCancelling]     = useState(false);

  const PAGE_SIZE = 500;

  const fetchPage = async ({ reset = false } = {}) => {
    const offset = reset ? 0 : reservas.length;
    const limit = PAGE_SIZE;

    const { data, error, count } = await supabase
      .from('reservas')
      .select(
        `
          id, fecha, hora, created_at, user_id,
          instalaciones ( nombre, tipo ),
          reserva_material (
            cantidad,
            inventario ( nombre )
          )
        `,
        { count: 'exact' }
      )
      .order('fecha', { ascending: true })
      .order('hora', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      toast.error('Error cargando reservas: ' + error.message);
      return;
    }

    const { data: perfilesData } = await supabase.from('profiles').select('id, full_name, email, telefono');
    const mappedData = (data || []).map(r => ({
      ...r,
      profiles: perfilesData?.find(p => p.id === r.user_id) || null
    }));

    const next = mappedData;
    setTotalCount(typeof count === 'number' ? count : null);
    setReservas(prev => (reset ? next : [...prev, ...next]));

    const loaded = (reset ? next.length : reservas.length + next.length);
    const total = typeof count === 'number' ? count : null;
    setHasMore(total == null ? next.length === limit : loaded < total);
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!alive) return;
      await fetchPage({ reset: true });
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  const handleCancel = async () => {
    if (!confirmId) return;
    setCancelling(true);
    const { error } = await supabase.from('reservas').delete().eq('id', confirmId);
    if (error) {
      toast.error('Error al cancelar: ' + error.message);
    } else {
      toast.success('Reserva cancelada.');
      setReservas(prev => prev.filter(r => r.id !== confirmId));
    }
    setConfirmId(null);
    setCancelling(false);
  };

  const hoy = new Date().toISOString().split('T')[0];

  const filtradas = reservas
    .filter(r => {
      if (filtroFecha === 'proximas') return r.fecha >= hoy;
      if (filtroFecha === 'pasadas')  return r.fecha <  hoy;
      return true;
    })
    .filter(r => {
      const term = searchTerm.toLowerCase();
      if (!term) return true;
      return (
        r.profiles?.full_name?.toLowerCase().includes(term) ||
        r.profiles?.email?.toLowerCase().includes(term)     ||
        r.instalaciones?.nombre?.toLowerCase().includes(term)
      );
    });

  const total    = totalCount ?? reservas.length;
  const proximas = reservas.filter(r => r.fecha >= hoy).length;
  const pasadas  = reservas.filter(r => r.fecha <  hoy).length;

  const { t } = useTranslation();
  if (loading) return <p className="text-brand-lime animate-pulse">{t('admin.bookings.loading')}</p>;

  return (
    <div className="space-y-6">

      {/* Modal de confirmación */}
      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="theme-card border theme-border p-8 max-w-sm w-full mx-4 shadow-2xl">
            <h3 className="text-xl font-bold theme-text mb-2">{t('admin.bookings.cancelModal.title')}</h3>
            <p className="theme-faint text-sm mb-6">
              {t('admin.bookings.cancelModal.desc')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmId(null)}
                className="flex-1 py-3 rounded-xl border theme-border theme-faint font-bold hover:theme-elevated transition-colors"
              >
                {t('admin.bookings.cancelModal.back')}
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 font-bold hover:bg-red-500/30 transition-colors disabled:opacity-40"
              >
                {cancelling ? t('admin.bookings.cancelModal.cancelling') : t('admin.bookings.cancelModal.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: t('admin.bookings.totalBookings'), value: total,    color: 'text-brand-purple dark:text-brand-lime',        bg: 'bg-brand-purple/10 dark:bg-brand-lime/10',          icon: Calendar },
          { label: t('admin.bookings.upcoming'),        value: proximas, color: 'text-brand-purple dark:text-brand-lime',   bg: 'bg-brand-purple/10 dark:bg-brand-lime/10',    icon: Clock },
          { label: t('admin.bookings.completed'),       value: pasadas,  color: 'text-brand-purple dark:text-brand-lime', bg: 'bg-brand-purple/10 dark:bg-brand-lime/10',  icon: CheckCircle2 },
        ].map(({ label, value, color, bg, icon }) => {
          const Icon = icon;
          return (
            <div key={label} className="theme-card p-6 flex items-center gap-4">
              <div className={`p-4 ${bg} rounded-2xl ${color}`}><Icon size={24} /></div>
              <div>
                <p className="text-xs theme-faint font-bold uppercase tracking-wider">{label}</p>
                <p className="text-2xl font-bold theme-text">{value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Controles: búsqueda + filtro fecha */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 theme-faint" size={18} />
          <input
            type="text"
            placeholder="Buscar usuario o pista..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full theme-bg border theme-border rounded-xl py-2 pl-10 pr-4 theme-text focus:border-brand-purple dark:focus:border-brand-lime outline-none text-sm"
          />
        </div>

        <div className="flex gap-2 theme-elevated p-1 rounded-2xl border theme-border">
          {[
            { id: 'proximas', label: 'Próximas' },
            { id: 'pasadas',  label: 'Pasadas'  },
            { id: 'todas',    label: 'Todas'    },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setFiltroFecha(id)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                filtroFecha === id
                  ? 'bg-brand-purple dark:bg-brand-lime text-white dark:text-black shadow-sm'
                  : 'theme-faint hover:theme-text'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
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
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtradas.map(r => {
                const isUpcoming = r.fecha >= hoy;
                const mat = Array.isArray(r.reserva_material) ? r.reserva_material : [];
                return (
                  <tr key={r.id} className="hover:bg-white/5 transition-colors">

                    {/* Usuario */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full theme-elevated flex items-center justify-center text-xs font-bold theme-text shrink-0 border theme-border">
                          {(r.profiles?.full_name || r.profiles?.email || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium theme-text">
                            {r.profiles?.full_name || 'Sin nombre'}
                          </p>
                          <p className="text-xs theme-faint">{r.profiles?.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Instalación */}
                    <td className="p-4">
                      <p className="text-sm theme-text">{r.instalaciones?.nombre || '—'}</p>
                      <p className="text-xs theme-faint capitalize">{r.instalaciones?.tipo || ''}</p>
                    </td>

                    {/* Fecha */}
                    <td className="p-4 text-sm theme-text">
                      {new Date(r.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
                        weekday: 'short', day: 'numeric', month: 'short'
                      })}
                    </td>

                    {/* Hora */}
                    <td className="p-4">
                      <span className="flex items-center gap-1.5 text-sm theme-text">
                        <Clock size={14} className="text-brand-purple dark:text-brand-lime" />
                        {r.hora?.slice(0, 5)}h
                      </span>
                    </td>

                    {/* Material */}
                    <td className="p-4 text-sm text-gray-400">
                      {mat.length === 0 ? (
                        <span className="text-gray-600">—</span>
                      ) : (
                        <div className="space-y-1">
                          {mat.slice(0, 3).map((m, idx) => (
                            <div key={idx} className="text-xs">
                              <span className="theme-text font-bold">{m.cantidad}×</span>{' '}
                              <span className="theme-faint">{m.inventario?.nombre || 'Material'}</span>
                            </div>
                          ))}
                          {mat.length > 3 && (
                            <div className="text-[11px] text-gray-600">
                              +{mat.length - 3} más
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Estado */}
                    <td className="p-4">
                      {isUpcoming ? (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-brand-purple/10 dark:bg-brand-lime/10 text-brand-purple dark:text-brand-lime border border-brand-purple/20 dark:border-brand-lime/20 shadow-sm">
                          {t('admin.bookings.status.upcoming')}
                        </span>
                      ) : (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full theme-elevated theme-faint border theme-border">
                          {t('admin.bookings.status.completed')}
                        </span>
                      )}
                    </td>

                    {/* Acción */}
                    <td className="p-4">
                      {isUpcoming && (
                        <button
                          onClick={() => setConfirmId(r.id)}
                          className="p-2 rounded-lg theme-faint hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Cancelar reserva"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filtradas.length === 0 && (
                <tr>
                  <td colSpan="7" className="p-10 text-center text-gray-500 text-sm">
                    {searchTerm ? t('admin.bookings.noResultsSearch') : t('admin.bookings.noResults')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer con conteo */}
        {filtradas.length > 0 && (
          <div className="px-4 py-3 border-t border-white/5 text-xs text-gray-600 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <span>
              Mostrando {filtradas.length} de {total} reservas
              {totalCount != null && reservas.length < totalCount ? ` (cargadas ${reservas.length})` : ''}
            </span>

            {hasMore && (
              <button
                onClick={async () => {
                  setLoadingMore(true);
                  try {
                    await fetchPage({ reset: false });
                  } finally {
                    setLoadingMore(false);
                  }
                }}
                disabled={loadingMore}
                className="px-4 py-2 rounded-xl theme-bg border theme-border theme-text font-bold hover:theme-elevated transition-colors disabled:opacity-50 w-fit"
              >
                {loadingMore ? 'Cargando...' : 'Cargar más'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Tab de estadísticas globales del sistema (admin).
 * @returns {import('react').JSX.Element}
 */
function TabEstadisticasAdmin() {
  const [loading, setLoading]   = useState(true);
  const [reservas, setReservas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);

  useEffect(() => {
    const load = async () => {
      const [{ data: rData }, { data: uData }] = await Promise.all([
        supabase
          .from('reservas')
          .select('id, fecha, hora, user_id, instalaciones ( nombre, tipo )'),
        supabase
          .from('profiles')
          .select('id, full_name, email'),
      ]);
      const reservasMapped = (rData || []).map(r => ({
        ...r,
        profiles: (uData || []).find(p => p.id === r.user_id) || null
      }));
      setReservas(reservasMapped);
      setUsuarios(uData || []);
      setLoading(false);
    };
    load();
  }, []);

  const { t } = useTranslation();
  if (loading) return <p className="text-brand-lime animate-pulse">{t('admin.adminStats.loading')}</p>;

  const hoy = new Date().toISOString().split('T')[0];
  const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // Por día de la semana
  const porDia = Array(7).fill(0);
  reservas.forEach(r => {
    const d = new Date(r.fecha + 'T00:00:00').getDay();
    porDia[d]++;
  });
  const maxDia = Math.max(...porDia, 1);

  // Instalación más reservada
  const porInst = {};
  reservas.forEach(r => {
    const n = r.instalaciones?.nombre;
    if (n) porInst[n] = (porInst[n] || 0) + 1;
  });
  const instRanking = Object.entries(porInst).sort((a, b) => b[1] - a[1]);
  const maxInst = instRanking[0]?.[1] || 1;

  // Por tipo de pista
  const porTipo = {};
  reservas.forEach(r => {
    const t = r.instalaciones?.tipo || 'otro';
    porTipo[t] = (porTipo[t] || 0) + 1;
  });

  // Top 5 usuarios más activos
  const actividadUser = {};
  reservas.forEach(r => {
    const email = r.profiles?.email || 'desconocido';
    const name  = r.profiles?.full_name || email;
    if (!actividadUser[email]) actividadUser[email] = { name, count: 0 };
    actividadUser[email].count++;
  });
  const topUsers = Object.values(actividadUser).sort((a, b) => b.count - a.count).slice(0, 5);
  const maxUser  = topUsers[0]?.count || 1;

  // Métricas rápidas
  const proximas = reservas.filter(r => r.fecha >= hoy).length;
  const pasadas  = reservas.filter(r => r.fecha <  hoy).length;
  const mediaOcupacion = usuarios.length > 0
    ? (pasadas / usuarios.length).toFixed(1)
    : '0';

  return (
    <div className="space-y-8">

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Reservas',      value: reservas.length, color: 'text-brand-purple dark:text-brand-lime',        bg: 'bg-brand-purple/10 dark:bg-brand-lime/10',          icon: Calendar },
          { label: 'Próximas',            value: proximas,        color: 'text-brand-purple dark:text-brand-lime',   bg: 'bg-brand-purple/10 dark:bg-brand-lime/10',    icon: Clock },
          { label: 'Completadas',         value: pasadas,         color: 'text-brand-purple dark:text-brand-lime', bg: 'bg-brand-purple/10 dark:bg-brand-lime/10',  icon: CheckCircle2 },
          { label: 'Media por usuario',   value: mediaOcupacion,  color: 'text-blue-500 dark:text-blue-400',     bg: 'bg-blue-500/10 dark:bg-blue-400/10',      icon: TrendingUp },
        ].map(({ label, value, color, bg, icon }) => {
          const Icon = icon;
          return (
            <div key={label} className="theme-card p-5 border theme-border shadow-sm flex items-center gap-3">
              <div className={`p-3 ${bg} rounded-xl ${color}`}><Icon size={20} /></div>
              <div>
                <p className="text-xs theme-faint font-bold uppercase tracking-wider">{label}</p>
                <p className="text-2xl font-bold theme-text">{value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Reservas por día de la semana */}
        <div className="theme-card p-6">
          <h3 className="text-base font-bold theme-text mb-6 flex items-center gap-2">
            <BarChart2 size={18} className="text-brand-purple dark:text-brand-lime" />
            Reservas por día de la semana
          </h3>
          <div className="flex items-end gap-2 h-40">
            {DIAS.map((dia, i) => {
              const val = porDia[i];
              const pct = Math.round((val / maxDia) * 100);
              return (
                <div key={dia} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] theme-faint font-bold">{val > 0 ? val : ''}</span>
                  <div className="w-full flex items-end" style={{ height: '112px' }}>
                    <div className="w-full relative" style={{ height: '112px' }}>
                      <div
                        className="absolute bottom-0 left-0 right-0 rounded-t-lg bg-brand-purple/80 dark:bg-brand-lime/80 hover:bg-brand-purple dark:hover:bg-brand-lime transition-colors duration-300"
                        style={{ height: `${Math.max(pct, val > 0 ? 4 : 0)}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-[10px] theme-faint font-medium">{dia}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Instalación más reservada */}
        <div className="theme-card p-6 border theme-border">
          <h3 className="text-base font-bold theme-text mb-6 flex items-center gap-2">
            <MapPin size={18} className="text-brand-purple dark:text-brand-lime" /> Ranking de instalaciones
          </h3>
          <div className="space-y-4">
            {instRanking.length === 0 && <p className="theme-faint text-sm">Sin datos aún.</p>}
            {instRanking.map(([nombre, count], idx) => {
              const pct = Math.round((count / maxInst) * 100);
              return (
                <div key={nombre}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="theme-text font-medium flex items-center gap-2">
                      {idx === 0 && <Trophy size={12} className="text-brand-purple dark:text-brand-lime" />}
                      {nombre}
                    </span>
                    <span className="theme-faint">{count} reservas</span>
                  </div>
                  <div className="h-2 theme-bg rounded-full overflow-hidden border theme-border">
                    <div
                      className="h-full rounded-full bg-brand-purple dark:bg-brand-lime transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top usuarios más activos */}
        <div className="theme-card p-6 border theme-border">
          <h3 className="text-base font-bold theme-text mb-6 flex items-center gap-2">
            <Trophy size={18} className="text-brand-purple dark:text-brand-lime" /> Top 5 Usuarios Activos
          </h3>
          {topUsers.length === 0 && <p className="theme-faint text-sm">Sin actividad aún.</p>}
          <div className="space-y-3">
            {topUsers.map(({ name, count }, idx) => {
              const pct = Math.round((count / maxUser) * 100);
              const medals = ['🥇', '🥈', '🥉', '4º', '5º'];
              return (
                <div key={name} className="flex items-center gap-3">
                  <span className="text-xl w-8 text-center">{medals[idx]}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="theme-text font-medium truncate max-w-[140px]">{name}</span>
                      <span className="theme-faint shrink-0">{count} partidos</span>
                    </div>
                    <div className="h-1.5 theme-bg rounded-full overflow-hidden border theme-border">
                      <div
                        className="h-full rounded-full bg-brand-purple dark:bg-brand-lime transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Distribución por tipo de pista */}
        <div className="theme-card p-6 border theme-border">
          <h3 className="text-base font-bold theme-text mb-6 flex items-center gap-2">
            <TrendingUp size={18} className="theme-faint" /> Distribución por tipo
          </h3>
          {Object.keys(porTipo).length === 0 && <p className="theme-faint text-sm">Sin datos aún.</p>}
          <div className="space-y-4">
            {Object.entries(porTipo)
              .sort((a, b) => b[1] - a[1])
              .map(([tipo, count]) => {
                const pct = Math.round((count / (reservas.length || 1)) * 100);
                const COLORES = { padel: 'bg-brand-lime', futbol: 'bg-blue-400', baloncesto: 'bg-orange-400' };
                const color = COLORES[tipo] || 'bg-brand-purple';
                return (
                  <div key={tipo}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="theme-text capitalize font-medium">{tipo}</span>
                      <span className="theme-faint">{pct}% — {count} reservas</span>
                    </div>
                    <div className="h-2.5 theme-bg rounded-full overflow-hidden border theme-border">
                      <div
                        className={`h-full rounded-full ${color} transition-all duration-700 shadow-sm`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PANEL PRINCIPAL
// ─────────────────────────────────────────────
export default function AdminPanel() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('usuarios');
  const TABS = getTabs(t);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">

      {/* Cabecera */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b theme-border pb-6">
        <div>
          <h1 className="text-3xl font-bold theme-text flex items-center gap-3">
            <ShieldAlert className="text-red-500" size={32} />
            {t('admin.title')}
          </h1>
          <p className="theme-faint text-sm mt-1">{t('admin.subtitle')}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 theme-card p-1 border theme-border w-fit shadow-sm">
        {TABS.map(({ id, label, icon }) => {
          const Icon = icon;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeTab === id
                  ? 'bg-brand-purple dark:bg-brand-lime text-white dark:text-black shadow-sm'
                  : 'theme-faint hover:theme-text'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          );
        })}
      </div>

      {/* Contenido */}
      {activeTab === 'usuarios'      && <TabUsuarios />}
      {activeTab === 'reservas'      && <TabReservas />}
      {activeTab === 'instalaciones' && <TabInstalaciones />}
      {activeTab === 'avisos'        && <TabAvisos />}
      {activeTab === 'estadisticas'  && <TabEstadisticasAdmin />}
    </div>
  );
}