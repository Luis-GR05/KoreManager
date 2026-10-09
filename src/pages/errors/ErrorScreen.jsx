import { Link } from 'react-router-dom';
import { COURTS, VIEW_W, VIEW_H } from '../../components/landing/courts';
import Seo from '../../components/Seo';

function Action({ a, kind }) {
  if (!a) return null;
  const cls = kind === 'primary'
    ? 'inline-flex h-12 items-center justify-center rounded-full bg-brand-lime px-7 font-bold text-[#0F0F1A] transition-transform hover:-translate-y-0.5'
    : 'inline-flex h-12 items-center justify-center rounded-full px-7 font-bold ring-1 ring-current/20 theme-text ring-black/15 dark:ring-white/25 transition-colors hover:bg-black/5 dark:hover:bg-white/10';
  return a.to
    ? <Link to={a.to} className={cls}>{a.label}</Link>
    : <button type="button" onClick={a.onClick} className={cls}>{a.label}</button>;
}


/**
 * Plantilla común de las páginas de error: código enorme, pista dibujada y la
 * pelota fuera de las líneas (literalmente "fuera de pista").
 *
 * @param {{
 *  code: string, title: string, desc: string, court?: 0|1|2,
 *  primary?: { to?: string, onClick?: () => void, label: string },
 *  secondary?: { to?: string, onClick?: () => void, label: string },
 *  inApp?: boolean,
 * }} props
 */
export default function ErrorScreen({ code, title, desc, court = 2, primary, secondary, inApp = false }) {
  const c = COURTS[court];
  const { box } = c;
  return (
    <main
      id="contenido"
      className={`error-screen relative isolate flex w-full items-center overflow-hidden ${inApp ? 'min-h-[70vh]' : 'min-h-[100dvh] theme-bg'}`}
    >
      <Seo title={`${title} · KoreManager`} noindex />
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-6 py-16 lg:grid-cols-2">
        <div>
          <p className="error-screen__code font-display font-black leading-none tabular" aria-hidden="true">{code}</p>
          <h1 className="mt-2 font-display text-4xl sm:text-6xl font-black uppercase leading-[0.9] theme-text">{title}</h1>
          <p className="mt-4 max-w-md text-lg theme-faint">{desc}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Action a={primary} kind="primary" />
            <Action a={secondary} kind="secondary" />
          </div>
        </div>
        <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="error-screen__court w-full" aria-hidden="true">
          {c.lines.map((l, i) => (
            <path key={i} d={l.d} pathLength="1" className={l.weight === 'net' ? 'bl-net' : 'bl-line'} style={{ animationDelay: `${i * 0.08}s`, animationIterationCount: 1 }} />
          ))}
          {/* Pelota fuera de las líneas */}
          <ellipse cx={box.x0 + box.w + 26} cy={box.y0 + box.h + 26} rx="11" ry="4" fill="rgba(0,0,0,0.35)" />
          <circle className="error-screen__ball" cx={box.x0 + box.w + 26} cy={box.y0 + box.h + 14} r="10" />
        </svg>
      </div>
    </main>
  );
}
