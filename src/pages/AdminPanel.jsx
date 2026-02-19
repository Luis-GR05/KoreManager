import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { ShieldAlert, Users, Activity, Search } from 'lucide-react';

export default function AdminPanel() {
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchUsuarios = async () => {
            // Traemos todos los perfiles con el nombre de su rol
            const { data, error } = await supabase
                .from('profiles')
                .select(`
          id,
          email,
          full_name,
          telefono,
          created_at,
          rol_id,
          roles ( nombre )
        `)
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error cargando usuarios:", error);
            } else {
                setUsuarios(data || []);
            }
            setLoading(false);
        };

        fetchUsuarios();
    }, []);

    const filteredUsers = usuarios.filter(user =>
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-8 text-brand-lime animate-pulse">Cargando base de datos central...</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">

            {/* CABECERA */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <ShieldAlert className="text-brand-red" size={32} />
                        Panel de Administración
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Gestión global de usuarios y permisos del sistema.</p>
                </div>
            </div>

            {/* MÉTRICAS RÁPIDAS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#1A1A2E] p-6 rounded-3xl border border-white/5 flex items-center gap-4">
                    <div className="p-4 bg-brand-lime/10 rounded-2xl text-brand-lime"><Users size={24} /></div>
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Total Usuarios</p>
                        <p className="text-2xl font-bold text-white">{usuarios.length}</p>
                    </div>
                </div>
                <div className="bg-[#1A1A2E] p-6 rounded-3xl border border-white/5 flex items-center gap-4">
                    <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-500"><Activity size={24} /></div>
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Conserjes Activos</p>
                        <p className="text-2xl font-bold text-white">{usuarios.filter(u => u.rol_id === 2).length}</p>
                    </div>
                </div>
            </div>

            {/* TABLA DE USUARIOS */}
            <div className="bg-[#1A1A2E] rounded-3xl border border-white/5 overflow-hidden">
                <div className="p-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                    <h2 className="text-lg font-bold text-white">Directorio de Usuarios</h2>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#0F0F1A] border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white focus:border-brand-lime outline-none text-sm"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#0F0F1A] text-xs uppercase tracking-wider text-gray-500 border-b border-white/5">
                                <th className="p-4 font-bold">Usuario</th>
                                <th className="p-4 font-bold">Contacto</th>
                                <th className="p-4 font-bold">Rol</th>
                                <th className="p-4 font-bold">Fecha Registro</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white">
                                                {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="font-medium text-white text-sm">{user.full_name || 'Sin nombre'}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm text-gray-400">
                                        <div className="flex flex-col">
                                            <span>{user.email}</span>
                                            <span className="text-xs text-gray-600">{user.telefono || 'Sin teléfono'}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-full tracking-wider ${user.rol_id === 1 ? 'bg-brand-red/20 text-brand-red border border-brand-red/20' :
                                            user.rol_id === 2 ? 'bg-blue-500/20 text-blue-500 border border-blue-500/20' :
                                                'bg-white/5 text-gray-400 border border-white/10'
                                            }`}>
                                            {user.roles?.nombre || 'desconocido'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-gray-500">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="p-8 text-center text-gray-500 text-sm">
                                        No se encontraron usuarios.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}