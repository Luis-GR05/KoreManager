// src/components/Layout.jsx
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { Home, Package, User, LogOut, ShieldAlert, Calendar, Clock, BarChart2 } from 'lucide-react';

export default function Layout({ children }) {
  const location = useLocation();
  const { roleName, signOut } = useAuth();

  const menuItems = [
    { icon: Home,       label: 'Inicio',        path: '/dashboard',    allowed: ['ciudadano', 'conserje', 'admin'] },
    { icon: User,       label: 'Mi Perfil',     path: '/profile',      allowed: ['ciudadano', 'conserje', 'admin'] },
    { icon: Calendar,   label: 'Reservar',      path: '/reservar',     allowed: ['ciudadano', 'conserje', 'admin'] },
    { icon: Clock,      label: 'Historial',     path: '/historial',    allowed: ['ciudadano', 'conserje', 'admin'] },
    { icon: BarChart2,  label: 'Estadísticas',  path: '/estadisticas', allowed: ['ciudadano', 'conserje', 'admin'] },
    { icon: Package,    label: 'Inventario',    path: '/inventario',   allowed: ['conserje', 'admin'] },
    { icon: ShieldAlert,label: 'Panel Admin',   path: '/admin',        allowed: ['admin'] },
  ];

  const visibleMenu = menuItems.filter(item => item.allowed.includes(roleName));

  return (
    <div className="flex min-h-screen bg-[#0F0F1A] text-white">

      {/* SIDEBAR — escritorio */}
      <aside className="w-64 bg-[#1A1A2E] border-r border-white/5 flex-col hidden md:flex shrink-0">
        <div className="h-20 flex items-center px-8 border-b border-white/5">
          <h1 className="text-2xl font-bold tracking-tighter">
            KORE<span className="text-brand-lime">MANAGER</span>
          </h1>
        </div>

        {/* Indicador de rol */}
        <div className="p-4 text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
          {roleName === 'admin'     && <div className="w-2 h-2 rounded-full bg-brand-red animate-pulse" />}
          {roleName === 'conserje'  && <div className="w-2 h-2 rounded-full bg-blue-500" />}
          {roleName === 'ciudadano' && <div className="w-2 h-2 rounded-full bg-brand-lime" />}
          Modo: {roleName.toUpperCase()}
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {visibleMenu.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                  isActive
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
            onClick={signOut}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-gray-400 hover:text-brand-red hover:bg-brand-red/10 transition-colors font-medium"
          >
            <LogOut size={20} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 relative overflow-y-auto">
        <div className="p-6 md:p-8 pb-24 md:pb-8">{children}</div>
      </main>

      {/* BOTTOM NAV — móvil */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1A1A2E]/95 backdrop-blur-xl border-t border-white/5 flex items-center justify-around px-2 py-3 z-50">
        {visibleMenu.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all ${
                isActive ? 'text-brand-lime' : 'text-gray-500 hover:text-white'
              }`}
            >
              <Icon size={22} />
              <span className="text-[10px] font-bold">{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={signOut}
          className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl text-gray-500 hover:text-brand-red transition-all"
        >
          <LogOut size={22} />
          <span className="text-[10px] font-bold">Salir</span>
        </button>
      </nav>
    </div>
  );
}