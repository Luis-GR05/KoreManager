import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X } from 'lucide-react';

/**
 * Logotipo + marca. Imagen optimizada (WebP) con tamaño explícito para evitar CLS.
 * @param {{ size?: 'sm'|'md' }} props
 */
export function Brand({ size = 'md' }) {
  const box = size === 'sm' ? 'w-9 h-9 rounded-xl' : 'w-10 h-10 sm:w-11 sm:h-11 rounded-2xl';
  return (
    <span className="flex items-center gap-2.5 select-none">
      <span className={`${box} grid place-items-center bg-[#0F0F1A] ring-1 ring-white/10 overflow-hidden`}>
        <img
          src="/images/logo-96.webp"
          alt=""
          width="96"
          height="109"
          className="w-full h-full object-contain p-1.5"
          decoding="async"
        />
      </span>
      <span className="font-display text-xl sm:text-2xl font-black uppercase tracking-wide text-white leading-none">
        Kore<span className="text-brand-lime">Manager</span>
      </span>
    </span>
  );
}

/**
 * Selector de idioma accesible (botones con aria-pressed).
 */
export function LangSwitch({ className = '', tone = 'dark' }) {
  const { t, i18n } = useTranslation();
  const current = i18n.resolvedLanguage || i18n.language;
  const dark = tone === 'dark';
  return (
    <div role="group" aria-label={t('common.language')} className={`flex items-center rounded-full p-1 ring-1 ${dark ? 'ring-white/15' : 'ring-black/10 dark:ring-white/15'} ${className}`}>
      {['es', 'en'].map((lng) => (
        <button
          key={lng}
          type="button"
          lang={lng}
          aria-pressed={current === lng}
          onClick={() => i18n.changeLanguage(lng)}
          className={`h-7 min-w-[2.25rem] rounded-full px-2 text-[11px] font-bold uppercase transition-colors ${
            current === lng
              ? (dark ? 'bg-brand-lime text-[#0F0F1A]' : 'bg-brand-purple text-white dark:bg-brand-lime dark:text-[#0F0F1A]')
              : (dark ? 'text-white/60 hover:text-white' : 'theme-faint hover:theme-text')
          }`}
        >
          {lng}
        </button>
      ))}
    </div>
  );
}

/**
 * Navegación de la landing:
 * - se oculta al bajar y reaparece al subir (más espacio para el contenido)
 * - fondo sólido cuando ya no estamos sobre el hero
 * - menú móvil a pantalla completa con foco gestionado y cierre con Escape
 */
export default function LandingNav() {
  const { t } = useTranslation();
  const [hidden, setHidden] = useState(false);
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const menuBtnRef = useRef(null);
  const firstLinkRef = useRef(null);

  useEffect(() => {
    let lastY = window.scrollY;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const y = window.scrollY;
        setSolid(y > 40);
        setHidden(y > 240 && y > lastY + 4);
        if (y < lastY - 4 || y < 240) setHidden(false);
        lastY = y;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  // Menú móvil: bloqueo de scroll, foco y tecla Escape
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    firstLinkRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    const btn = menuBtnRef.current;
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
      btn?.focus();
    };
  }, [open]);

  const links = [
    { href: '#deportes', label: t('landing.nav.sports') },
    { href: '#funciones', label: t('landing.nav.features') },
    { href: '#sobre', label: t('landing.nav.about') },
  ];

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[transform,background-color,box-shadow] duration-500 ease-out-expo ${
          hidden && !open ? '-translate-y-full' : 'translate-y-0'
        } ${solid ? 'bg-[#0F0F1A]/85 backdrop-blur-xl shadow-[0_1px_0_rgba(255,255,255,0.06)]' : 'bg-transparent'}`}
      >
        <nav aria-label="Principal" className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 sm:px-8 h-16 sm:h-20">
          <a href="#top" aria-label={t('landing.nav.home')} className="rounded-xl">
            <Brand />
          </a>

          <ul className="hidden md:flex items-center gap-8 text-sm font-medium text-white/70">
            {links.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="nav-link py-2 hover:text-white transition-colors">{l.label}</a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2 sm:gap-3">
            <LangSwitch className="hidden sm:flex" />
            <Link
              to="/login"
              className="hidden sm:inline-flex h-10 items-center rounded-full px-5 text-sm font-bold text-white ring-1 ring-white/20 transition-colors hover:bg-white/10"
            >
              {t('landing.nav.loginBtn')}
            </Link>
            <Link
              to="/register"
              className="hidden lg:inline-flex h-10 items-center rounded-full bg-brand-lime px-5 text-sm font-bold text-[#0F0F1A] transition-transform duration-300 ease-out-expo hover:-translate-y-0.5"
            >
              {t('landing.nav.register')}
            </Link>
            <button
              ref={menuBtnRef}
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? t('common.closeMenu') : t('common.openMenu')}
              className="md:hidden grid h-10 w-10 place-items-center rounded-full text-white ring-1 ring-white/20"
            >
              {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
            </button>
          </div>
        </nav>
      </header>

      {/* Menú móvil */}
      <div
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label={t('common.openMenu')}
        className={`md:hidden fixed inset-0 z-40 flex flex-col bg-[#0F0F1A] px-6 pt-24 pb-10 transition-[opacity,visibility] duration-300 ${
          open ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
      >
        <ul className="space-y-2">
          {links.map((l, i) => (
            <li key={l.href} style={{ transitionDelay: open ? `${80 + i * 60}ms` : '0ms' }} className={`transition-all duration-500 ease-out-expo ${open ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
              <a
                ref={i === 0 ? firstLinkRef : undefined}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block font-display text-6xl font-black uppercase leading-none text-white"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="mt-auto space-y-4">
          <LangSwitch className="w-max" />
          <div className="grid grid-cols-2 gap-3">
            <Link to="/login" className="grid h-12 place-items-center rounded-full font-bold text-white ring-1 ring-white/20">
              {t('landing.nav.loginBtn')}
            </Link>
            <Link to="/register" className="grid h-12 place-items-center rounded-full bg-brand-lime font-bold text-[#0F0F1A]">
              {t('landing.nav.register')}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
