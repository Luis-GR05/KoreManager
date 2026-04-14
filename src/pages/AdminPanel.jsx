// src/pages/AdminPanel.jsx
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import {
  ShieldAlert, Users, Activity, Search, Bell, MapPin,
  Trash2, PlusCircle, CheckCircle2, XCircle, Edit3, Save,
  Calendar, Clock, Filter, BarChart2, TrendingUp, Trophy
} from 'lucide-react';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'usuarios',      label: 'Usuarios',      icon: Users },
  { id: 'reservas',      label: 'Reservas',       icon: Calendar },
  { id: 'instalaciones', label: 'Instalaciones',  icon: MapPin },
  { id: 'avisos',        label: 'Avisos',         icon: Bell },
  { id: 'estadisticas',  label: 'Estadísticas',   icon: BarChart2 },
];

// ─────────────────────────────────────────────
// TAB 1: Usuarios
// ─────────────────────────────────────────────
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

  if (loading) return <p className="text-brand-lime animate-pulse">Cargando usuarios...</p>;

  return (
    <div className="space-y-6">
      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Usuarios',      value: usuarios.length,                              color: 'text-brand-lime',   bg: 'bg-brand-lime/10',    icon: Users },
          { label: 'Conserjes Activos',   value: usuarios.filter(u => u.rol_id === 2).length, color: 'text-blue-400',     bg: 'bg-blue-500/10',     icon: Activity },
          { label: 'Reservas Activas',    value: reservasCount,                               color: 'text-brand-purple', bg: 'bg-brand-purple/10',  icon: CheckCircle2 },
        ].map(({ label, value, color, bg, icon }) => {
          const Icon = icon;
          return (
            <div key={label} className="bg-[#1A1A2E] p-6 rounded-3xl border border-white/5 flex items-center gap-4">
              <div className={`p-4 ${bg} rounded-2xl ${color}`}><Icon size={24} /></div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{label}</p>
                <p className="text-2xl font-bold text-white">{value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabla */}
      <div className="bg-[#1A1A2E] rounded-3xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <h2 className="text-lg font-bold text-white">Directorio de Usuarios</h2>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Buscar nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0F0F1A] border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white focus:border-brand-lime outline-none text-sm"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#0F0F1A] text-xs uppercase tracking-wider text-gray-500 border-b border-white/5">
                <th className="p-4">Usuario</th>
                <th className="p-4">Contacto</th>
                <th className="p-4">Rol</th>
                <th className="p-4">Registro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((user) => (
                <tr key={user.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white">
                        {(user.full_name || user.email || '?').charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-white text-sm">{user.full_name || 'Sin nombre'}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-400">
                    <div className="flex flex-col">
                      <span>{user.email}</span>
                      <span className="text-xs text-gray-600">{user.telefono || '—'}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <select
                      value={user.rol_id}
                      onChange={(e) => changeRole(user.id, e.target.value)}
                      className="bg-[#0F0F1A] border border-white/10 text-white text-xs rounded-lg px-2 py-1 focus:border-brand-lime outline-none cursor-pointer"
                    >
                      {roles.map(r => (
                        <option key={r.id} value={r.id}>{r.nombre}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-4 text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString('es-ES')}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-500 text-sm">No se encontraron usuarios.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// TAB 2: Instalaciones
// ─────────────────────────────────────────────
function TabInstalaciones() {
  const [instalaciones, setInstalaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);

  const ESTADOS = ['disponible', 'mantenimiento', 'ocupada'];

  useEffect(() => {
    supabase.from('instalaciones').select('*').order('id')
      .then(({ data }) => { setInstalaciones(data || []); setLoading(false); });
  }, []);

  const updateEstado = async (id, nuevoEstado) => {
    const { error } = await supabase
      .from('instalaciones')
      .update({ estado: nuevoEstado })
      .eq('id', id);

    if (error) {
      toast.error('Error: ' + error.message);
    } else {
      toast.success('Estado actualizado.');
      setInstalaciones(prev => prev.map(i => i.id === id ? { ...i, estado: nuevoEstado } : i));
      setEditingId(null);
    }
  };

  if (loading) return <p className="text-brand-lime animate-pulse">Cargando instalaciones...</p>;

  const colorEstado = (e) =>
    e === 'disponible'    ? 'text-brand-lime bg-brand-lime/10 border-brand-lime/20' :
    e === 'mantenimiento' ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' :
                            'text-red-400 bg-red-400/10 border-red-400/20';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {instalaciones.map(inst => (
        <div key={inst.id} className="bg-[#1A1A2E] p-6 rounded-3xl border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-lg">{inst.nombre}</h3>
            <span className={`text-xs font-bold px-3 py-1 rounded-full border uppercase ${colorEstado(inst.estado)}`}>
              {inst.estado}
            </span>
          </div>
          <p className="text-xs text-gray-500 uppercase">Tipo: {inst.tipo || 'general'}</p>

          {editingId === inst.id ? (
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-400 uppercase">Cambiar estado:</p>
              <div className="flex gap-2 flex-wrap">
                {ESTADOS.map(e => (
                  <button
                    key={e}
                    onClick={() => updateEstado(inst.id, e)}
                    className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all ${
                      inst.estado === e ? colorEstado(e) : 'border-white/10 text-gray-400 hover:border-white/30'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
              <button onClick={() => setEditingId(null)} className="text-xs text-gray-500 hover:text-white">Cancelar</button>
            </div>
          ) : (
            <button
              onClick={() => setEditingId(inst.id)}
              className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-brand-lime transition-colors"
            >
              <Edit3 size={14} /> Cambiar estado
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// TAB 3: Avisos
// ─────────────────────────────────────────────
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
    if (!form.titulo.trim()) { toast.error('El título es obligatorio.'); return; }
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

  if (loading) return <p className="text-brand-lime animate-pulse">Cargando avisos...</p>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Formulario */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4">Nuevo Aviso</h3>
        <form onSubmit={createAviso} className="bg-[#1A1A2E] p-6 rounded-3xl border border-white/5 space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Título</label>
            <input
              type="text"
              value={form.titulo}
              onChange={e => setForm({ ...form, titulo: e.target.value })}
              placeholder="Título del aviso"
              className="w-full bg-[#0F0F1A] border border-white/10 text-white rounded-xl px-4 py-3 focus:border-brand-lime outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Mensaje</label>
            <textarea
              value={form.mensaje}
              onChange={e => setForm({ ...form, mensaje: e.target.value })}
              placeholder="Descripción detallada..."
              rows={4}
              className="w-full bg-[#0F0F1A] border border-white/10 text-white rounded-xl px-4 py-3 focus:border-brand-lime outline-none resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 bg-brand-lime text-black font-bold rounded-xl hover:scale-[1.02] transition-all disabled:opacity-50"
          >
            <PlusCircle size={18} /> {saving ? 'Publicando...' : 'Publicar Aviso'}
          </button>
        </form>
      </div>

      {/* Lista */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4">Avisos Publicados ({avisos.length})</h3>
        <div className="space-y-4">
          {avisos.length === 0 && <p className="text-gray-500 text-sm">No hay avisos aún.</p>}
          {avisos.map(aviso => (
            <div
              key={aviso.id}
              className={`p-5 rounded-2xl border transition-all ${aviso.activo
                ? 'bg-brand-purple/5 border-brand-purple/20'
                : 'bg-white/2 border-white/5 opacity-50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-bold text-white text-sm">{aviso.titulo}</h4>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">{aviso.mensaje}</p>
                  <p className="text-[10px] text-gray-600 mt-2">
                    {new Date(aviso.created_at).toLocaleDateString('es-ES')}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleAviso(aviso.id, aviso.activo)}
                    title={aviso.activo ? 'Desactivar' : 'Activar'}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    {aviso.activo
                      ? <CheckCircle2 size={18} className="text-brand-lime" />
                      : <XCircle size={18} className="text-gray-500" />
                    }
                  </button>
                  <button
                    onClick={() => deleteAviso(aviso.id)}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-500 transition-colors"
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

// ─────────────────────────────────────────────
// TAB 4: Reservas (vista global del sistema)
// ─────────────────────────────────────────────
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
          id, fecha, hora, created_at,
          instalaciones ( nombre, tipo ),
          profiles ( full_name, email, telefono ),
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

    const next = data || [];
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

  if (loading) return <p className="text-brand-lime animate-pulse">Cargando reservas del sistema...</p>;

  return (
    <div className="space-y-6">

      {/* Modal de confirmación */}
      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1A1A2E] border border-white/10 rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">¿Cancelar esta reserva?</h3>
            <p className="text-gray-400 text-sm mb-6">
              Se eliminará permanentemente y el usuario perderá su franja horaria.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmId(null)}
                className="flex-1 py-3 rounded-xl border border-white/10 text-gray-300 font-bold hover:bg-white/5 transition-colors"
              >
                Volver
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 font-bold hover:bg-red-500/30 transition-colors disabled:opacity-40"
              >
                {cancelling ? 'Cancelando...' : 'Sí, cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total reservas',   value: total,    color: 'text-white',        bg: 'bg-white/5',          icon: Calendar },
          { label: 'Próximas',         value: proximas, color: 'text-brand-lime',   bg: 'bg-brand-lime/10',    icon: Clock },
          { label: 'Completadas',      value: pasadas,  color: 'text-brand-purple', bg: 'bg-brand-purple/10',  icon: CheckCircle2 },
        ].map(({ label, value, color, bg, icon }) => {
          const Icon = icon;
          return (
            <div key={label} className="bg-[#1A1A2E] p-6 rounded-3xl border border-white/5 flex items-center gap-4">
              <div className={`p-4 ${bg} rounded-2xl ${color}`}><Icon size={24} /></div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{label}</p>
                <p className="text-2xl font-bold text-white">{value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Controles: búsqueda + filtro fecha */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="text"
            placeholder="Buscar usuario o pista..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-[#1A1A2E] border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white focus:border-brand-lime outline-none text-sm"
          />
        </div>

        <div className="flex gap-2 bg-[#1A1A2E] p-1 rounded-2xl border border-white/5">
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
                  ? 'bg-brand-lime text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-[#1A1A2E] rounded-3xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#0F0F1A] text-xs uppercase tracking-wider text-gray-500 border-b border-white/5">
                <th className="p-4">Usuario</th>
                <th className="p-4">Instalación</th>
                <th className="p-4">Fecha</th>
                <th className="p-4">Hora</th>
                <th className="p-4">Material</th>
                <th className="p-4">Estado</th>
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
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white shrink-0">
                          {(r.profiles?.full_name || r.profiles?.email || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            {r.profiles?.full_name || 'Sin nombre'}
                          </p>
                          <p className="text-xs text-gray-500">{r.profiles?.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Instalación */}
                    <td className="p-4">
                      <p className="text-sm text-white">{r.instalaciones?.nombre || '—'}</p>
                      <p className="text-xs text-gray-500 capitalize">{r.instalaciones?.tipo || ''}</p>
                    </td>

                    {/* Fecha */}
                    <td className="p-4 text-sm text-gray-300">
                      {new Date(r.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
                        weekday: 'short', day: 'numeric', month: 'short'
                      })}
                    </td>

                    {/* Hora */}
                    <td className="p-4">
                      <span className="flex items-center gap-1.5 text-sm text-gray-300">
                        <Clock size={14} className="text-brand-purple" />
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
                              <span className="text-gray-300 font-bold">{m.cantidad}×</span>{' '}
                              <span className="text-gray-400">{m.inventario?.nombre || 'Material'}</span>
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
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-brand-lime/10 text-brand-lime border border-brand-lime/20">
                          Próxima
                        </span>
                      ) : (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/5 text-gray-500 border border-white/10">
                          Completada
                        </span>
                      )}
                    </td>

                    {/* Acción */}
                    <td className="p-4">
                      {isUpcoming && (
                        <button
                          onClick={() => setConfirmId(r.id)}
                          className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
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
                    {searchTerm ? 'No se encontraron reservas con ese criterio.' : 'No hay reservas en este período.'}
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
                className="px-4 py-2 rounded-xl bg-[#0F0F1A] border border-white/10 text-gray-300 font-bold hover:bg-white/5 hover:border-white/20 transition-colors disabled:opacity-50 w-fit"
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

// ─────────────────────────────────────────────
// TAB 5: Estadísticas Globales del sistema
// ─────────────────────────────────────────────
function TabEstadisticasAdmin() {
  const [loading, setLoading]   = useState(true);
  const [reservas, setReservas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);

  useEffect(() => {
    const load = async () => {
      const [{ data: rData }, { data: uData }] = await Promise.all([
        supabase
          .from('reservas')
          .select('id, fecha, hora, instalaciones ( nombre, tipo ), profiles ( full_name, email )'),
        supabase
          .from('profiles')
          .select('id, full_name, email'),
      ]);
      setReservas(rData || []);
      setUsuarios(uData || []);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <p className="text-brand-lime animate-pulse">Cargando estadísticas...</p>;

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
          { label: 'Total Reservas',      value: reservas.length, color: 'text-white',        bg: 'bg-white/5',          icon: Calendar },
          { label: 'Próximas',            value: proximas,        color: 'text-brand-lime',   bg: 'bg-brand-lime/10',    icon: Clock },
          { label: 'Completadas',         value: pasadas,         color: 'text-brand-purple', bg: 'bg-brand-purple/10',  icon: CheckCircle2 },
          { label: 'Media por usuario',   value: mediaOcupacion,  color: 'text-blue-400',     bg: 'bg-blue-400/10',      icon: TrendingUp },
        ].map(({ label, value, color, bg, icon }) => {
          const Icon = icon;
          return (
            <div key={label} className="bg-[#1A1A2E] p-5 rounded-3xl border border-white/5 flex items-center gap-3">
              <div className={`p-3 ${bg} rounded-xl ${color}`}><Icon size={20} /></div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{label}</p>
                <p className="text-2xl font-bold text-white">{value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Reservas por día de la semana */}
        <div className="bg-[#1A1A2E] rounded-3xl p-6 border border-white/5">
          <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
            <BarChart2 size={18} className="text-brand-lime" />
            Reservas por día de la semana
          </h3>
          <div className="flex items-end gap-2 h-40">
            {DIAS.map((dia, i) => {
              const val = porDia[i];
              const pct = Math.round((val / maxDia) * 100);
              return (
                <div key={dia} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-gray-500 font-bold">{val > 0 ? val : ''}</span>
                  <div className="w-full flex items-end" style={{ height: '112px' }}>
                    <div className="w-full relative" style={{ height: '112px' }}>
                      <div
                        className="absolute bottom-0 left-0 right-0 rounded-t-lg bg-brand-lime/80 hover:bg-brand-lime transition-colors duration-300"
                        style={{ height: `${Math.max(pct, val > 0 ? 4 : 0)}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-600 font-medium">{dia}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Instalación más reservada */}
        <div className="bg-[#1A1A2E] rounded-3xl p-6 border border-white/5">
          <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
            <MapPin size={18} className="text-brand-purple" /> Ranking de instalaciones
          </h3>
          <div className="space-y-4">
            {instRanking.length === 0 && <p className="text-gray-500 text-sm">Sin datos aún.</p>}
            {instRanking.map(([nombre, count], idx) => {
              const pct = Math.round((count / maxInst) * 100);
              return (
                <div key={nombre}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-white font-medium flex items-center gap-2">
                      {idx === 0 && <Trophy size={12} className="text-brand-lime" />}
                      {nombre}
                    </span>
                    <span className="text-gray-500">{count} reservas</span>
                  </div>
                  <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-brand-purple transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top usuarios más activos */}
        <div className="bg-[#1A1A2E] rounded-3xl p-6 border border-white/5">
          <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
            <Trophy size={18} className="text-yellow-400" /> Top 5 Usuarios Activos
          </h3>
          {topUsers.length === 0 && <p className="text-gray-500 text-sm">Sin actividad aún.</p>}
          <div className="space-y-3">
            {topUsers.map(({ name, count }, idx) => {
              const pct = Math.round((count / maxUser) * 100);
              const medals = ['🥇', '🥈', '🥉', '4º', '5º'];
              return (
                <div key={name} className="flex items-center gap-3">
                  <span className="text-xl w-8 text-center">{medals[idx]}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white font-medium truncate max-w-[140px]">{name}</span>
                      <span className="text-gray-500 shrink-0">{count} partidos</span>
                    </div>
                    <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand-lime transition-all duration-700"
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
        <div className="bg-[#1A1A2E] rounded-3xl p-6 border border-white/5">
          <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
            <TrendingUp size={18} className="text-blue-400" /> Distribución por tipo
          </h3>
          {Object.keys(porTipo).length === 0 && <p className="text-gray-500 text-sm">Sin datos aún.</p>}
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
                      <span className="text-white capitalize font-medium">{tipo}</span>
                      <span className="text-gray-500">{pct}% — {count} reservas</span>
                    </div>
                    <div className="h-2.5 bg-black/30 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${color} transition-all duration-700`}
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
  const [activeTab, setActiveTab] = useState('usuarios');

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">

      {/* Cabecera */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <ShieldAlert className="text-brand-red" size={32} />
            Panel de Administración
          </h1>
          <p className="text-gray-400 text-sm mt-1">Gestión global del sistema KORE MANAGER.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-[#1A1A2E] p-1 rounded-2xl border border-white/5 w-fit">
        {TABS.map(({ id, label, icon }) => {
          const Icon = icon;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeTab === id
                  ? 'bg-brand-lime text-black shadow-sm'
                  : 'text-gray-400 hover:text-white'
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