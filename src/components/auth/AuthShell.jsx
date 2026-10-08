import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Check } from 'lucide-react';
import { COURTS, VIEW_W, VIEW_H } from '../landing/courts';
import { LangSwitch } from '../landing/LandingNav';

/**
 * Estructura común de las pantallas de acceso (login, registro, recuperación):
 * panel de marca a la izquierda (escritorio) y formulario a la derecha.
 *
 * @param {{
 *  title: string, subtitle?: string, children: import('react').ReactNode,
 *  backTo?: string, backLabel?: string, footer?: import('react').ReactNode,
 *  wide?: boolean
 * }} props
 */
export default function AuthShell({ title, subtitle, children, backTo = '/', backLabel, footer, wide = false }) {
  const { t } = useTranslation();
  const padel = COURTS[0];
  const points = t('auth.panelPoints', { returnObjects: true });

  return (
    <div className="min-h-[100dvh] w-full lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] theme-bg">
      {/* ── Panel de marca ── */}
      <aside className="auth-panel relative hidden overflow-hidden bg-[#0A071B] lg:flex lg:flex-col lg:justify-between p-10 xl:p-14 text-white">
        <picture className="absolute inset-0 -z-0" aria-hidden="true">
          <source type="image/avif" srcSet="/images/fondoHero-960.avif" />
          <img src="/images/fondoHero-960.webp" alt="" className="h-full w-full object-cover object-[22%_50%] opacity-70" />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A071B] via-[#0A071B]/70 to-[#0A071B]/30" aria-hidden="true" />

        <Link to="/" className="relative z-10 flex w-max items-center gap-3 rounded-xl">
          <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-2xl bg-[#0F0F1A] ring-1 ring-white/10">
            <img src="/images/logo-96.webp" alt="" width="96" height="109" className="h-full w-full object-contain p-1.5" />
          </span>
          <span className="font-display text-2xl font-black uppercase tracking-wide">
            Kore<span className="text-brand-lime">Manager</span>
          </span>
        </Link>

        <div className="relative z-10">
          <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="mb-8 w-full max-w-md opacity-90" aria-hidden="true">
            {padel.lines.map((l, i) => (
              <path
                key={i}
                d={l.d}
                pathLength="1"
                className="auth-court-line"
                style={{ animationDelay: `${0.2 + i * 0.12}s` }}
                stroke={l.weight === 'net' ? '#fff' : '#CCFF00'}
              />
            ))}
            {padel.walls.map((d, i) => (
              <path key={`w${i}`} d={d} pathLength="1" className="auth-court-line auth-court-wall" style={{ animationDelay: '0.9s' }} />
            ))}
          </svg>
          <h2 className="font-display text-6xl xl:text-7xl font-black uppercase leading-[0.85]">{t('auth.panelTitle')}</h2>
          <p className="mt-5 max-w-md text-white/75 leading-relaxed">{t('auth.panelDesc')}</p>
          {Array.isArray(points) && (
            <ul className="mt-8 space-y-3">
              {points.map((p) => (
                <li key={p} className="flex items-center gap-3 text-sm font-medium">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-lime text-[#0F0F1A]">
                    <Check size={14} strokeWidth={3} aria-hidden="true" />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="relative z-10 text-xs text-white/40">{t('footer.copyright')}</p>
      </aside>

      {/* ── Formulario ── */}
      <main className="relative flex min-h-[100dvh] flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between gap-4">
          <Link
            to={backTo}
            className="inline-flex items-center gap-2 rounded-lg py-2 text-sm font-semibold theme-faint transition-colors hover:theme-text"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            {backLabel ?? t('landing.login.back')}
          </Link>
          <LangSwitch tone="auto" />
        </div>

        <div className={`mx-auto flex w-full flex-1 flex-col justify-center py-10 ${wide ? 'max-w-xl' : 'max-w-md'}`}>
          <Link to="/" className="mb-8 flex w-max items-center gap-3 lg:hidden" aria-label="KoreManager">
            <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-2xl bg-[#0F0F1A] ring-1 ring-white/10">
              <img src="/images/logo-96.webp" alt="" width="96" height="109" className="h-full w-full object-contain p-1.5" />
            </span>
            <span className="font-display text-2xl font-black uppercase tracking-wide theme-text">
              Kore<span className="text-brand-purple dark:text-brand-lime">Manager</span>
            </span>
          </Link>

          <h1 className="font-display text-5xl sm:text-6xl font-black uppercase leading-[0.9] theme-text">{title}</h1>
          {subtitle && <p className="mt-3 theme-faint">{subtitle}</p>}

          <div className="mt-8">{children}</div>

          {footer && <div className="mt-8 border-t theme-border pt-6 text-sm theme-faint">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
