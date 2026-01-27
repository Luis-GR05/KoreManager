import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, User, History, Bell, LogOut } from 'lucide-react';

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Función para determinar si el link está activo
  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    navigate('/login');
  };

  const menuItems = [
    { icon: Home, label: 'Inicio / Reservas', path: '/dashboard' },
    { icon: User, label: 'Mis Datos', path: '/profile' },
    { icon: History, label: 'Historial', path: '/history' },
    { icon: Bell, label: 'Notificaciones', path: '/notifications' },
  ];

  return (
    <div className="flex h-screen w-full bg-[#0F0F1A] overflow-hidden">
      
      {/* --- SIDEBAR --- */}
      <aside className="w-64 flex-shrink-0 border-r border-white/5 bg-[#1A1A2E] flex flex-col relative z-20">
        
        {/* Logo Sidebar */}
        <div className="p-8">
          <h1 className="text-2xl font-bold text-white leading-none tracking-tight">
            KORE<br />
            <span className="text-brand-lime">MANAGER</span>
          </h1>
        </div>

        {/* Menú de Navegación */}
        <nav className="flex-1 px-4 space-y-3 mt-4">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive(item.path)
                  ? 'bg-brand-purple text-white shadow-[0_0_15px_rgba(123,44,191,0.5)]' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon 
                size={20} 
                className={isActive(item.path) ? 'text-white' : 'text-gray-400 group-hover:text-brand-lime transition-colors'} 
              />
              <span className="font-medium text-sm">{item.label}</span>
              
              {/* Indicador activo */}
              {isActive(item.path) && (
                <div className="absolute left-0 w-1 h-8 bg-brand-lime rounded-r-full shadow-[0_0_10px_#CCFF00]"></div>
              )}
            </Link>
          ))}
        </nav>

        {/* Botón Cerrar Sesión */}
        <div className="p-4 border-t border-white/5 bg-[#151525]">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 text-brand-red hover:bg-brand-red/10 w-full rounded-lg transition-colors group"
          >
            <LogOut size={20} className="group-hover:scale-110 transition-transform"/>
            <span className="font-medium text-sm">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <main className="flex-1 overflow-y-auto relative">
         <div className="absolute top-0 left-0 w-full h-96 bg-brand-purple/5 blur-[100px] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto p-8 relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}