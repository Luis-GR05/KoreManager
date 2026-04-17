// src/pages/Inventory.jsx
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/useAuth';
import { Package, Plus, Minus, Box, Search, PlusCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Página de inventario:
 * - lista items (con fallback si la BD aún no tiene `tipo_pista`)
 * - alta de material (solo admin)
 * - ajuste de stock (optimista) con revert si falla
 * @returns {import('react').JSX.Element}
 */
export default function Inventory() {
  const { roleName } = useAuth();
  const isAdmin = roleName === 'admin';

  const [items, setItems]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadError, setLoadError]   = useState(null);
  const [hasTipoPista, setHasTipoPista] = useState(true);

  const [showForm, setShowForm]     = useState(false);
  const [newItem, setNewItem]       = useState({ nombre: '', cantidad: 0, tipo_pista: 'padel' });
  const [saving, setSaving]         = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      let res = await supabase
        .from('inventario')
        .select('id, nombre, cantidad, estado, tipo_pista')
        .order('id', { ascending: true });

      if (res?.error && String(res.error.message || '').toLowerCase().includes('tipo_pista')) {
        setHasTipoPista(false);
        res = await supabase
          .from('inventario')
          .select('id, nombre, cantidad, estado')
          .order('id', { ascending: true });
      } else {
        setHasTipoPista(true);
      }

      if (!alive) return;
      if (res?.error) {
        setLoadError(res.error.message);
        toast.error('Error al cargar inventario: ' + res.error.message);
      } else {
        setLoadError(null);
      }
      setItems(res?.data || []);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  /**
   * Recarga el inventario desde Supabase (con fallback si falta `tipo_pista`).
   * @returns {Promise<void>}
   */
  const fetchInventory = async () => {
    setLoading(true);
    let res = await supabase
      .from('inventario')
      .select('id, nombre, cantidad, estado, tipo_pista')
      .order('id', { ascending: true });

    if (res?.error && String(res.error.message || '').toLowerCase().includes('tipo_pista')) {
      setHasTipoPista(false);
      res = await supabase
        .from('inventario')
        .select('id, nombre, cantidad, estado')
        .order('id', { ascending: true });
    } else {
      setHasTipoPista(true);
    }

    if (res?.error) {
      setLoadError(res.error.message);
      toast.error('Error al cargar inventario: ' + res.error.message);
    } else {
      setLoadError(null);
    }
    setItems(res?.data || []);
    setLoading(false);
  };

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') {
        void fetchInventory();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('focus', onVis);
    };
  }, []);

  /**
   * Ajusta el stock del item en BD y en UI (optimista).
   * @param {number} id
   * @param {number} currentQty
   * @param {number} change +1 / -1
   * @returns {Promise<void>}
   */
  const updateStock = async (id, currentQty, change) => {
    const newQty = Math.max(0, currentQty + change);
    setItems(prev => prev.map(item => item.id === id ? { ...item, cantidad: newQty } : item));

    const { error } = await supabase
      .from('inventario')
      .update({ cantidad: newQty })
      .eq('id', id);

    if (error) {
      toast.error('Error actualizando stock.');
      fetchInventory();
    }
  };

  /**
   * Crea un nuevo item de inventario.
   * @param {import('react').FormEvent} e
   * @returns {Promise<void>}
   */
  const addItem = async (e) => {
    e.preventDefault();
    if (!newItem.nombre.trim()) { toast.error('El nombre es obligatorio.'); return; }
    if (!newItem.tipo_pista) { toast.error('Selecciona un tipo de pista.'); return; }
    setSaving(true);

    const payload = {
      nombre: newItem.nombre.trim(),
      cantidad: Number(newItem.cantidad),
      estado: 'activo',
      ...(hasTipoPista ? { tipo_pista: String(newItem.tipo_pista).toLowerCase() } : {}),
    };

    const { error } = await supabase.from('inventario').insert([payload]);

    if (error) {
      toast.error('Error al añadir artículo: ' + error.message);
    } else {
      toast.success('Artículo añadido al inventario.');
      setNewItem({ nombre: '', cantidad: 0, tipo_pista: 'padel' });
      setShowForm(false);
      fetchInventory();
    }
    setSaving(false);
  };

  const filteredItems = items.filter(item => {
    const term = searchTerm.toLowerCase();
    if (!term) return true;
    const nombre = String(item?.nombre || '').toLowerCase();
    const tipo = String(item?.tipo_pista || '').toLowerCase();
    return nombre.includes(term) || tipo.includes(term);
  });

  /**
   * Determina si un item está en stock bajo (umbral visual).
   * @param {number} qty
   * @returns {boolean}
   */
  const isLowStock = (qty) => qty > 0 && qty < 5;

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Box className="text-brand-lime" size={32} />
            Control de Material
          </h1>
          <p className="text-gray-400 text-sm mt-1">Gestión de stock en tiempo real.</p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1A1A2E] border border-white/10 rounded-full py-2 pl-10 pr-4 text-white focus:border-brand-lime outline-none text-sm"
            />
          </div>
          <button
            onClick={fetchInventory}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-[#1A1A2E] border border-white/10 text-white rounded-full font-bold text-sm hover:bg-white/5 hover:border-white/20 transition-colors"
            title="Actualizar inventario"
          >
            <RefreshCw size={16} /> Actualizar
          </button>
          {isAdmin && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-brand-lime text-black rounded-full font-bold text-sm hover:scale-105 transition-all"
            >
              <PlusCircle size={18} /> Añadir
            </button>
          )}
        </div>
      </div>

      {/* Formulario nuevo artículo */}
      {showForm && isAdmin && (
        <form onSubmit={addItem} className="bg-[#1A1A2E] p-6 rounded-2xl border border-brand-lime/20 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Nombre del artículo</label>
            <input
              type="text"
              value={newItem.nombre}
              onChange={e => setNewItem({ ...newItem, nombre: e.target.value })}
              placeholder="Ej: Conos de entrenamiento"
              className="w-full bg-[#0F0F1A] border border-white/10 text-white rounded-xl px-4 py-3 focus:border-brand-lime outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Tipo de pista</label>
              <select
                value={newItem.tipo_pista}
                onChange={e => setNewItem({ ...newItem, tipo_pista: e.target.value })}
                className="w-full bg-[#0F0F1A] border border-white/10 text-white rounded-xl px-4 py-3 focus:border-brand-lime outline-none"
              >
                <option value="padel">Pádel</option>
                <option value="tenis">Tenis</option>
                <option value="futbol">Fútbol</option>
                <option value="baloncesto">Baloncesto</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Cantidad</label>
              <input
                type="number"
                min="0"
                value={newItem.cantidad}
                onChange={e => setNewItem({ ...newItem, cantidad: e.target.value })}
                className="w-full bg-[#0F0F1A] border border-white/10 text-white rounded-xl px-4 py-3 focus:border-brand-lime outline-none"
              />
            </div>
          </div>
          <div className="md:col-span-3 flex gap-3 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-400 hover:text-white text-sm">Cancelar</button>
            <button type="submit" disabled={saving} className="px-6 py-2 bg-brand-lime text-black rounded-xl font-bold text-sm disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-brand-lime animate-pulse">Cargando inventario...</div>
      ) : loadError ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-300 text-sm">
          <p className="font-bold mb-1">No se pudo cargar el inventario</p>
          <p className="text-xs text-red-200/80 break-words">{loadError}</p>
          <button
            onClick={fetchInventory}
            className="mt-3 px-4 py-2 rounded-xl bg-[#0F0F1A] border border-white/10 text-gray-200 font-bold hover:bg-white/5 transition-colors"
          >
            Reintentar
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-[#1F1F2E] p-6 rounded-3xl border border-white/5 relative">

              {/* Badge de stock bajo */}
              {isLowStock(item.cantidad) && (
                <span className="absolute top-4 right-4 flex items-center gap-1 text-[10px] font-bold text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 px-2 py-1 rounded-full">
                  <AlertTriangle size={10} /> Stock Bajo
                </span>
              )}
              {item.cantidad === 0 && (
                <span className="absolute top-4 right-4 flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-full">
                  <AlertTriangle size={10} /> Sin Stock
                </span>
              )}

              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-[#0F0F1A] rounded-xl flex items-center justify-center text-brand-purple">
                  <Package size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{item.nombre}</h3>
                  <p className="text-xs text-gray-500">
                    {(hasTipoPista ? (item.tipo_pista || 'general') : 'sin-tipo')} • {item.estado || 'activo'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between bg-[#0F0F1A] p-2 rounded-2xl border border-white/5">
                <button
                  onClick={() => updateStock(item.id, item.cantidad, -1)}
                  disabled={item.cantidad === 0}
                  className="w-10 h-10 rounded-xl bg-[#1F1F2E] text-white hover:bg-red-500/20 hover:text-red-500 flex items-center justify-center disabled:opacity-30 transition-colors"
                >
                  <Minus size={18} />
                </button>
                <span className={`text-2xl font-mono font-bold ${item.cantidad === 0 ? 'text-red-500' : isLowStock(item.cantidad) ? 'text-yellow-500' : 'text-white'}`}>
                  {item.cantidad}
                </span>
                <button
                  onClick={() => updateStock(item.id, item.cantidad, 1)}
                  className="w-10 h-10 rounded-xl bg-[#1F1F2E] text-white hover:bg-brand-lime hover:text-black flex items-center justify-center transition-colors"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>
          ))}
          {filteredItems.length === 0 && (
            <div className="sm:col-span-2 lg:col-span-3 text-center py-12 text-gray-500">
              No hay material con ese filtro.
            </div>
          )}
        </div>
      )}
    </div>
  );
}