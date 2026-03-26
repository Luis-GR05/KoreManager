// src/pages/AdminPanel.jsx
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import {
  ShieldAlert, Users, Activity, Search, Bell, MapPin,
  Trash2, PlusCircle, CheckCircle2, XCircle, Edit3, Save
} from 'lucide-react';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'usuarios',      label: 'Usuarios',      icon: Users },
  { id: 'instalaciones', label: 'Instalaciones',  icon: MapPin },
  { id: 'avisos',        label: 'Avisos',         icon: Bell },
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
          { label: 'Total Usuarios',      value: usuarios.length,                                        color: 'text-brand-lime',  bg: 'bg-brand-lime/10',   icon: Users },
          { label: 'Conserjes Activos',   value: usuarios.filter(u => u.rol_id === 2).length,           color: 'text-blue-400',    bg: 'bg-blue-500/10',    icon: Activity },
          { label: 'Reservas Activas',    value: reservasCount,                                         color: 'text-brand-purple',bg: 'bg-brand-purple/10', icon: CheckCircle2 },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className="bg-[#1A1A2E] p-6 rounded-3xl border border-white/5 flex items-center gap-4">
            <div className={`p-4 ${bg} rounded-2xl ${color}`}><Icon size={24} /></div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{label}</p>
              <p className="text-2xl font-bold text-white">{value}</p>
            </div>
          </div>
        ))}
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

  const fetchAvisos = async () => {
    const { data } = await supabase.from('avisos').select('*').order('created_at', { ascending: false });
    setAvisos(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAvisos(); }, []);

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
      fetchAvisos();
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
        {TABS.map(({ id, label, icon: Icon }) => (
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
        ))}
      </div>

      {/* Contenido */}
      {activeTab === 'usuarios'      && <TabUsuarios />}
      {activeTab === 'instalaciones' && <TabInstalaciones />}
      {activeTab === 'avisos'        && <TabAvisos />}
    </div>
  );
}