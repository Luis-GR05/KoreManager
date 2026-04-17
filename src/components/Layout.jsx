import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { Home, Package, User, LogOut, ShieldAlert, Calendar, Clock, BarChart2, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../supabaseClient';
import LegalFooter from './LegalFooter';

/**
 * Layout autenticado:
 * - sidebar + topbar responsive
 * - menú filtrado por rol
 * - avatar desde Storage (signed URL) con autorenovación
 *
 * @param {{children: import('react').ReactNode}} props
 * @returns {import('react').JSX.Element}
 */
export default function Layout({ children }) {
  const location = useLocation();
  const { roleName, signOut, profile } = useAuth();

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
  const activeItem = visibleMenu.find(i => i.path === location.pathname);
  const displayName =
    profile?.full_name?.trim() ||
    profile?.email?.split('@')?.[0] ||
    'Usuario';

  const avatarUrl = profile?.avatar_url || null;
  const [avatarDisplayUrl, setAvatarDisplayUrl] = useState(null);

  /**
   * Resuelve `profile.avatar_url` a URL utilizable:
   * - si ya es http(s), se usa tal cual
   * - si es un path de Storage privado, genera signed URL
   *
   * @returns {Promise<string|null>}
   */
  const resolveAvatarUrl = useCallback(async () => {
    if (!avatarUrl) {
      return null;
    }
    if (String(avatarUrl).startsWith('http')) {
      return avatarUrl;
    }

    const { data, error } = await supabase.storage
      .from('avatars')
      .createSignedUrl(String(avatarUrl), 60 * 60);

    if (error) {
      console.warn('[Avatar] signed url error:', error.message);
      return null;
    }

    return data?.signedUrl ?? null;
  }, [avatarUrl]);

  useEffect(() => {
    let alive = true;

    const safeRefresh = async () => {
      const nextUrl = await resolveAvatarUrl();
      if (!alive) return;
      setAvatarDisplayUrl(nextUrl);
    };

    void safeRefresh();

    const intervalId = window.setInterval(() => {
      void safeRefresh();
    }, 45 * 60 * 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void safeRefresh();
      }
    };

    window.addEventListener('focus', handleVisibilityChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      alive = false;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleVisibilityChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [resolveAvatarUrl]);

  return (
    <div className="min-h-screen bg-[#0F0F1A] text-white">

      {/* SIDEBAR — escritorio */}
      <aside className="w-72 bg-[#121222] border-r border-white/5 flex-col hidden md:flex fixed left-0 top-0 h-[100dvh] overflow-y-auto z-50">
        <div className="h-20 flex items-center px-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-3xl bg-[#0F0F1A] border border-white/0 flex items-center justify-center overflow-hidden">
              <img
                src="/images/logo.png"
                alt="Kore Manager"
                className="w-full h-full object-contain p-2"
                style={{ filter: 'drop-shadow(0 0 10px rgba(204,255,0,.22)) drop-shadow(0 0 18px rgba(138,43,226,.12)) brightness(1.08)' }}
              />
            </div>
            <div className="leading-tight">
              <h1 className="text-xl font-black tracking-tight">
                KORE<span className="text-brand-lime">MANAGER</span>
              </h1>
              <p className="text-[11px] text-gray-500 font-semibold tracking-wider uppercase">
                Gestión deportiva
              </p>
            </div>
          </div>
        </div>

        {/* Indicador de rol */}
        <div className="px-6 py-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            {/* Slot de avatar (pon aquí tu imagen más adelante) */}
            <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
              {avatarDisplayUrl ? (
                <img src={avatarDisplayUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="text-gray-500"><ImageIcon size={18} /></div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">{displayName}</p>
              <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                {roleName === 'admin'     && <div className="w-2 h-2 rounded-full bg-brand-red animate-pulse" />}
                {roleName === 'conserje'  && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                {roleName === 'ciudadano' && <div className="w-2 h-2 rounded-full bg-brand-lime" />}
                {roleName}
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {visibleMenu.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-semibold ${
                  isActive
                    ? 'bg-brand-lime text-black shadow-[0_0_15px_rgba(204,255,0,0.22)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={20} />
                {item.label}
                {isActive && <ChevronRight className="ml-auto" size={18} />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-2xl text-gray-400 hover:text-brand-red hover:bg-brand-red/10 transition-colors font-semibold"
          >
            <LogOut size={20} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="relative md:pl-72">
        {/* Topbar (sticky) */}
        <div className="sticky top-0 z-40 bg-[#0F0F1A]/75 backdrop-blur-xl border-b border-white/5">
          <div className="px-6 md:px-8 py-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">
                Kore Manager
              </p>
              <p className="text-base md:text-lg font-black text-white truncate">
                {activeItem?.label || 'Panel'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Slot imagen/escudo municipal */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-2xl bg-[#0F0F1A] border border-white/0 text-gray-400 overflow-hidden">
                <img
                  src="/images/logo.png"
                  alt="Logo"
                  className="w-9 h-9 object-contain"
                  style={{ filter: 'drop-shadow(0 0 10px rgba(204,255,0,.18)) brightness(1.06)' }}
                />
                <span className="text-xs font-bold">Kore</span>
              </div>
              <button
                onClick={signOut}
                className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-gray-300 hover:text-brand-red hover:border-brand-red/40 hover:bg-brand-red/10 transition-all font-bold"
              >
                Salir
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 pb-24 md:pb-8 anim-popin">{children}</div>
        <div className="pb-24 md:pb-0">
          <LegalFooter />
        </div>
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