import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Package, Plus, Minus, Box, Search } from 'lucide-react';

export default function Inventory() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchInventory = async () => {
        const { data, error } = await supabase
            .from('inventario')
            .select('*')
            .order('id', { ascending: true });

        if (error) console.error("Error cargando inventario:", error);
        setItems(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchInventory();
    }, []);

    const updateStock = async (id, currentQty, change) => {
        const newQty = Math.max(0, currentQty + change);

        // UI Optimista
        setItems(items.map(item => item.id === id ? { ...item, cantidad: newQty } : item));

        const { error } = await supabase
            .from('inventario')
            .update({ cantidad: newQty })
            .eq('id', id);

        if (error) {
            console.error('Error actualizando:', error);
            fetchInventory(); // Revertir si falla
        }
    };

    const filteredItems = items.filter(item =>
        item.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Box className="text-brand-lime" size={32} />
                        Control de Material
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Gestión de stock en tiempo real.</p>
                </div>
                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[#1A1A2E] border border-white/10 rounded-full py-2 pl-10 pr-4 text-white focus:border-brand-lime outline-none"
                    />
                </div>
            </div>

            {loading ? (
                <div className="text-brand-lime animate-pulse">Cargando...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {filteredItems.map((item) => (
                        <div key={item.id} className="bg-[#1F1F2E] p-6 rounded-3xl border border-white/5 relative">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 bg-[#0F0F1A] rounded-xl flex items-center justify-center text-brand-purple">
                                    <Package size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">{item.nombre}</h3>
                                    <p className="text-xs text-gray-500">{item.estado}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between bg-[#0F0F1A] p-2 rounded-2xl border border-white/5">
                                <button onClick={() => updateStock(item.id, item.cantidad, -1)} className="w-10 h-10 rounded-xl bg-[#1F1F2E] text-white hover:bg-red-500/20 hover:text-red-500 flex items-center justify-center">
                                    <Minus size={18} />
                                </button>
                                <span className={`text-2xl font-mono font-bold ${item.cantidad === 0 ? 'text-red-500' : 'text-white'}`}>
                                    {item.cantidad}
                                </span>
                                <button onClick={() => updateStock(item.id, item.cantidad, 1)} className="w-10 h-10 rounded-xl bg-[#1F1F2E] text-white hover:bg-brand-lime hover:text-black flex items-center justify-center">
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