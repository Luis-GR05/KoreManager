import { useCallback, useEffect, useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/useAuth';
import { useTheme } from '../context/ThemeContext';
import { Home, Package, User, LogOut, ShieldAlert, Calendar, Clock, BarChart2, ChevronRight, Image as ImageIcon, Menu, X, Settings, Globe, Moon, Sun, Key } from 'lucide-react';
import { supabase } from '../supabaseClient';
import LegalFooter from './LegalFooter';
import ChangePasswordModal from './ChangePasswordModal';

/**
 * Layout autenticado:
 * - sidebar + topbar responsive
 * - menú filtrado por rol
 * - avatar desde Storage (signed URL) con autorenovación
 * - drawer lateral animado en móvil (reemplaza bottom nav)
 *
 * @param {{children: import('react').ReactNode}} props
 * @returns {import('react').JSX.Element}
 */
export default function Layout({ children }) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { roleName, signOut, profile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const settingsRef = useRef(null);

  // Cerrar menú de ajustes si se hace clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setSettingsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('app_language', lng);
    setSettingsOpen(false);
  };

  const menuItems = [
    { icon: Home,       label: t('menu.dashboard'),        path: '/dashboard',    allowed: ['ciudadano', 'conserje', 'admin'] },
    { icon: Calendar,   label: t('menu.book'),      path: '/reservar',     allowed: ['ciudadano', 'conserje', 'admin'] },
    { icon: Clock,      label: t('menu.history'),     path: '/historial',    allowed: ['ciudadano', 'conserje', 'admin'] },
    { icon: BarChart2,  label: t('menu.stats'),  path: '/estadisticas', allowed: ['ciudadano', 'conserje', 'admin'] },
    { icon: User,       label: t('menu.profile'),     path: '/profile',      allowed: ['ciudadano', 'conserje', 'admin'] },
    { icon: Package,    label: t('menu.inventory'),    path: '/inventario',   allowed: ['conserje', 'admin'] },
    { icon: ShieldAlert,label: t('menu.admin'),   path: '/admin',        allowed: ['admin'] },
  ];

  const visibleMenu = menuItems.filter(item => item.allowed.includes(roleName));
  const activeItem = visibleMenu.find(i => i.path === location.pathname);
  const displayName =
    profile?.full_name?.trim() ||
    profile?.email?.split('@')?.[0] ||
    'Usuario';

  const avatarUrl = profile?.avatar_url || null;
  const [avatarDisplayUrl, setAvatarDisplayUrl] = useState(null);

  // Cerrar drawer al cambiar de ruta
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Bloquear scroll del body cuando el drawer está abierto
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

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
    <div className="min-h-screen theme-bg theme-text transition-colors duration-300">

      {/* SIDEBAR — escritorio */}
      <aside className="w-72 theme-sidebar border-r theme-border flex-col hidden md:flex fixed left-0 top-0 h-[100dvh] overflow-y-auto z-50 transition-colors duration-300">
        <div className="h-20 flex items-center px-6 border-b theme-border">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-3xl bg-black dark:bg-[#0F0F1A] border theme-border flex items-center justify-center overflow-hidden">
              <img
                src="/images/logo.png"
                alt="Kore Manager"
                className="w-full h-full object-contain p-2 dark:drop-shadow-[0_0_12px_rgba(204,255,0,.3)] dark:drop-shadow-[0_0_20px_rgba(138,43,226,.2)] dark:brightness-110 drop-shadow-md"
              />
            </div>
            <div className="leading-tight">
              <h1 className="text-xl font-black tracking-tight theme-text">
                KORE<span className="text-brand-purple dark:text-brand-lime">MANAGER</span>
              </h1>
              <p className="text-[11px] theme-faint font-semibold tracking-wider uppercase">
                {t('layout.subtitle')}
              </p>
            </div>
          </div>
        </div>

        {/* Indicador de rol */}
        <div className="px-6 py-5 border-b theme-border">
          <div className="flex items-center gap-3">
            {/* Slot de avatar */}
            <div className="w-11 h-11 rounded-2xl theme-bg border theme-border flex items-center justify-center overflow-hidden">
              {avatarDisplayUrl ? (
                <img src={avatarDisplayUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="theme-faint"><ImageIcon size={18} /></div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold theme-text truncate">{displayName}</p>
              <div className="flex items-center gap-2 text-[10px] font-bold theme-faint uppercase tracking-widest">
                {roleName === 'admin'     && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                {roleName === 'conserje'  && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                {roleName === 'ciudadano' && <div className="w-2 h-2 rounded-full bg-brand-purple dark:bg-brand-lime" />}
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
                    ? 'bg-brand-purple dark:bg-brand-lime text-white dark:text-black shadow-lg dark:shadow-[0_0_15px_rgba(204,255,0,0.3)]'
                    : 'theme-text opacity-90 hover:opacity-100 hover:text-brand-purple dark:hover:text-white hover:bg-brand-purple/20 dark:hover:bg-white/10'
                }`}
              >
                <Icon size={20} />
                {item.label}
                {isActive && <ChevronRight className="ml-auto" size={18} />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t theme-border">
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-2xl theme-faint hover:text-red-500 hover:bg-red-500/10 transition-colors font-semibold"
          >
            <LogOut size={20} /> {t('layout.logout')}
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="relative md:pl-72 flex flex-col min-h-screen">
        {/* Topbar (sticky) */}
        <div className="sticky top-0 z-40 theme-bg/90 backdrop-blur-xl border-b theme-border transition-colors duration-300">
          <div className="px-6 md:px-8 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              {/* Botón hamburguesa — solo móvil */}
              <button
                onClick={() => setDrawerOpen(true)}
                aria-label="Abrir menú"
                className="md:hidden w-10 h-10 rounded-2xl theme-bg border theme-border flex items-center justify-center theme-text hover:theme-elevated transition-all"
              >
                <Menu size={20} />
              </button>
              <div className="min-w-0">
                <p className="text-[11px] theme-faint font-bold uppercase tracking-widest">
                  Kore Manager
                </p>
                <p className="text-base md:text-lg font-black theme-text truncate">
                  {activeItem?.label || 'Panel'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 relative" ref={settingsRef}>
              <button
                onClick={() => setSettingsOpen(!settingsOpen)}
                className={`p-2.5 rounded-xl border transition-all ${
                  settingsOpen 
                    ? 'bg-brand-purple dark:bg-brand-lime text-white dark:text-black border-brand-purple dark:border-brand-lime shadow-lg' 
                    : 'theme-bg theme-border theme-faint hover:theme-text hover:theme-elevated'
                }`}
                aria-label={t('layout.settings')}
              >
                <Settings size={20} className={settingsOpen ? 'animate-spin-slow' : ''} />
              </button>

              {/* Menú Desplegable de Ajustes */}
              {settingsOpen && (
                <div className="absolute top-[120%] right-0 w-64 theme-card border theme-border shadow-2xl p-2 z-50 animate-in slide-in-from-top-2 duration-200">
                  <div className="px-3 py-2 mb-2 border-b theme-border">
                    <p className="text-xs font-bold theme-faint uppercase tracking-widest">{t('layout.settings')}</p>
                  </div>
                  
                  {/* Idioma */}
                  <div className="mb-2">
                    <div className="px-3 py-1.5 flex items-center gap-2 text-sm theme-text font-semibold">
                      <Globe size={16} className="text-brand-purple dark:text-brand-lime" /> {t('layout.language')}
                    </div>
                    <div className="grid grid-cols-2 gap-1 px-1">
                      <button 
                        onClick={() => changeLanguage('es')}
                        className={`py-2 px-2 rounded-lg text-xs font-bold transition-colors ${i18n.language === 'es' ? 'theme-elevated theme-text' : 'theme-faint hover:theme-text hover:theme-elevated'}`}
                      >
                        🇪🇸 Español
                      </button>
                      <button 
                        onClick={() => changeLanguage('en')}
                        className={`py-2 px-2 rounded-lg text-xs font-bold transition-colors ${i18n.language === 'en' ? 'theme-elevated theme-text' : 'theme-faint hover:theme-text hover:theme-elevated'}`}
                      >
                        🇬🇧 English
                      </button>
                    </div>
                  </div>

                  {/* Tema */}
                  <div className="mb-2 border-t theme-border pt-2">
                    <button
                      onClick={toggleTheme}
                      className="w-full px-3 py-2 flex items-center justify-between text-sm theme-text font-semibold rounded-xl hover:theme-elevated transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {theme === 'dark' ? <Moon size={16} className="text-brand-lime" /> : <Sun size={16} className="text-amber-500" />}
                        {t('layout.theme')}
                      </div>
                      <div className="w-8 h-4 theme-elevated rounded-full relative transition-colors border theme-border">
                        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-all ${theme === 'dark' ? 'left-4' : 'left-0.5'}`} />
                      </div>
                    </button>
                  </div>

                  {/* Cambiar Contraseña */}
                  <div className="border-t theme-border pt-2">
                    <button
                      onClick={() => {
                        setSettingsOpen(false);
                        setPasswordModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold theme-faint hover:theme-text hover:theme-elevated transition-colors"
                    >
                      <Key size={16} /> {t('layout.changePassword')}
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={signOut}
                className="px-4 py-2 rounded-2xl theme-bg border theme-border theme-text hover:text-red-600 hover:border-red-500/60 hover:theme-elevated transition-all font-bold"
              >
                {t('layout.logout')}
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6 md:p-8 pb-8 anim-popin">{children}</div>
        <div className="mt-auto">
          <LegalFooter />
        </div>
      </main>

      {/* ══════════════════════════════════════════
          DRAWER LATERAL — móvil
      ══════════════════════════════════════════ */}

      {/* Overlay oscuro */}
      <div
        onClick={() => setDrawerOpen(false)}
        className={`md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      />

      {/* Panel lateral */}
      <div
        className={`md:hidden fixed left-0 top-0 h-[100dvh] w-72 z-50 theme-sidebar border-r theme-border
          flex flex-col shadow-2xl
          transition-transform duration-300 ease-out
          ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
        aria-label="Menú de navegación"
      >
        {/* Cabecera del drawer */}
        <div className="h-20 flex items-center justify-between px-5 border-b theme-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-black dark:bg-[#0F0F1A] flex items-center justify-center overflow-hidden border theme-border">
              <img
                src="/images/logo.png"
                alt="Kore Manager"
                className="w-full h-full object-contain p-1.5 dark:drop-shadow-[0_0_8px_rgba(204,255,0,.22)] dark:brightness-110 drop-shadow-sm"
              />
            </div>
            <span className="text-base font-black tracking-tight theme-text">
              KORE<span className="text-brand-purple dark:text-brand-lime">MANAGER</span>
            </span>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            aria-label="Cerrar menú"
            className="w-9 h-9 rounded-xl theme-bg border theme-border flex items-center justify-center theme-faint hover:theme-text hover:theme-elevated transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Info usuario */}
        <div className="px-5 py-4 border-b theme-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl theme-bg border theme-border flex items-center justify-center overflow-hidden">
              {avatarDisplayUrl ? (
                <img src={avatarDisplayUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="theme-faint"><ImageIcon size={16} /></div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold theme-text truncate">{displayName}</p>
              <div className="flex items-center gap-1.5 text-[10px] font-bold theme-faint uppercase tracking-widest">
                {roleName === 'admin'     && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                {roleName === 'conserje'  && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                {roleName === 'ciudadano' && <div className="w-2 h-2 rounded-full bg-brand-purple dark:bg-brand-lime" />}
                {roleName}
              </div>
            </div>
          </div>
        </div>

        {/* Navegación */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {visibleMenu.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-semibold ${
                  isActive
                    ? 'bg-brand-purple dark:bg-brand-lime text-white dark:text-black shadow-lg'
                    : 'theme-text opacity-90 hover:opacity-100 hover:theme-elevated'
                }`}
              >
                <Icon size={20} />
                {item.label}
                {isActive && <ChevronRight className="ml-auto" size={18} />}
              </Link>
            );
          })}
        </nav>

        {/* Cerrar sesión */}
        <div className="p-4 border-t theme-border">
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-2xl theme-faint hover:text-red-500 hover:bg-red-500/10 transition-colors font-semibold"
          >
            <LogOut size={20} /> {t('layout.logout')}
          </button>
        </div>
      </div>

      <ChangePasswordModal 
        isOpen={passwordModalOpen} 
        onClose={() => setPasswordModalOpen(false)} 
      />
    </div>
  );
}