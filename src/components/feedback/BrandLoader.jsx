import { COURTS, VIEW_W, VIEW_H } from '../landing/courts';

/**
 * Pantalla de carga de KoreManager: el logo late mientras las líneas de una
 * pista de pádel se dibujan en bucle y una pelota cruza la red.
 * No depende de i18n (puede mostrarse antes de que cargue nada).
 *
 * @param {{ fullscreen?: boolean, label?: string }} props
 */
export default function BrandLoader({ fullscreen = true, label = 'Cargando…' }) {
  const court = COURTS[0];
  const { box } = court;
  return (
    <div
      role="status"
      aria-live="polite"
      className={`brand-loader ${fullscreen ? 'brand-loader--full' : ''}`}
    >
      <div className="brand-loader__stage" aria-hidden="true">
        <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="brand-loader__court">
          {court.walls.map((d, i) => <path key={`w${i}`} d={d} pathLength="1" className="bl-wall" />)}
          {court.lines.map((l, i) => (
            <path key={i} d={l.d} pathLength="1" className={l.weight === 'net' ? 'bl-net' : 'bl-line'} style={{ animationDelay: `${i * 0.12}s` }} />
          ))}
          <circle className="bl-ball" r="7" cx={box.x0 + box.w * 0.18} cy={box.y0 + box.h * 0.7} />
        </svg>
        <img src="/images/logo-96.webp" alt="" width="96" height="109" className="brand-loader__logo" />
      </div>
      <span className="brand-loader__label">{label}</span>
    </div>
  );
}
