import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Home, Package, User, LogOut, ShieldAlert, Loader2 } from 'lucide-react';

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // Buscar el rol del usuario en la tabla profiles
      const { data } = await supabase
        .from('profiles')
        .select('rol')
        .eq('id', user.id)
        .single();

      setRole(data?.rol || 'deportista');
      setLoading(false);
    };

    checkUserRole();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F1A] flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-lime" size={40} />
      </div>
    );
  }

  // Definición del menú dinámico
  const menuItems = [
    { icon: Home, label: 'Inicio', path: '/dashboard', allowed: ['deportista', 'conserje', 'admin'] },
    { icon: User, label: 'Mi Perfil', path: '/profile', allowed: ['deportista', 'conserje', 'admin'] },
    // Rutas restringidas
    { icon: Package, label: 'Inventario', path: '/inventario', allowed: ['conserje', 'admin'] },
    { icon: ShieldAlert, label: 'Panel Admin', path: '/admin', allowed: ['admin'] },
  ];

  // Filtrar el menú según el rol actual
  const visibleMenu = menuItems.filter(item => item.allowed.includes(role));

  return (
    <div className="flex min-h-screen bg-[#0F0F1A] text-white">

      {/* SIDEBAR */}
      <aside className="w-64 bg-[#1A1A2E] border-r border-white/5 flex flex-col hidden md:flex">
        <div className="h-20 flex items-center px-8 border-b border-white/5">
          <h1 className="text-2xl font-bold tracking-tighter">
            KORE<span className="text-brand-lime">MANAGER</span>
          </h1>
        </div>

        <div className="p-4 text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
          {role === 'admin' && <div className="w-2 h-2 rounded-full bg-brand-red animate-pulse"></div>}
          {role === 'conserje' && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
          Modo: {role}
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {visibleMenu.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${isActive
                    ? 'bg-brand-lime text-black shadow-[0_0_15px_rgba(204,255,0,0.2)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-gray-400 hover:text-brand-red hover:bg-brand-red/10 transition-colors font-medium"
          >
            <LogOut size={20} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 relative overflow-y-auto">
        <div className="p-8 pb-24 md:pb-8">
          {children}
        </div>
      </main>

    </div>
  );
}