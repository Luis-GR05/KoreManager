// src/pages/Inventory.jsx
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Package, Plus, Minus, Box, Search, PlusCircle, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Inventory() {
  const { roleName } = useAuth();
  const isAdmin = roleName === 'admin';

  const [items, setItems]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Formulario para nuevo artículo (solo admin)
  const [showForm, setShowForm]     = useState(false);
  const [newItem, setNewItem]       = useState({ nombre: '', cantidad: 0 });
  const [saving, setSaving]         = useState(false);

  const fetchInventory = async () => {
    const { data, error } = await supabase
      .from('inventario')
      .select('*')
      .order('id', { ascending: true });

    if (error) toast.error('Error al cargar inventario.');
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchInventory(); }, []);

  const updateStock = async (id, currentQty, change) => {
    const newQty = Math.max(0, currentQty + change);
    // UI optimista
    setItems(prev => prev.map(item => item.id === id ? { ...item, cantidad: newQty } : item));

    const { error } = await supabase
      .from('inventario')
      .update({ cantidad: newQty })
      .eq('id', id);

    if (error) {
      toast.error('Error actualizando stock.');
      fetchInventory(); // Revertir
    }
  };

  const addItem = async (e) => {
    e.preventDefault();
    if (!newItem.nombre.trim()) { toast.error('El nombre es obligatorio.'); return; }
    setSaving(true);

    const { error } = await supabase
      .from('inventario')
      .insert([{ nombre: newItem.nombre.trim(), cantidad: Number(newItem.cantidad) }]);

    if (error) {
      toast.error('Error al añadir artículo: ' + error.message);
    } else {
      toast.success('Artículo añadido al inventario.');
      setNewItem({ nombre: '', cantidad: 0 });
      setShowForm(false);
      fetchInventory();
    }
    setSaving(false);
  };

  const filteredItems = items.filter(item =>
    item.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div className="flex items-center gap-3">
          <div className="relative w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1A1A2E] border border-white/10 rounded-full py-2 pl-10 pr-4 text-white focus:border-brand-lime outline-none text-sm"
            />
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2 bg-brand-lime text-black rounded-full font-bold text-sm hover:scale-105 transition-all"
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
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Cantidad inicial</label>
            <input
              type="number"
              min="0"
              value={newItem.cantidad}
              onChange={e => setNewItem({ ...newItem, cantidad: e.target.value })}
              className="w-full bg-[#0F0F1A] border border-white/10 text-white rounded-xl px-4 py-3 focus:border-brand-lime outline-none"
            />
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  <p className="text-xs text-gray-500">{item.estado || 'activo'}</p>
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
        </div>
      )}
    </div>
  );
}