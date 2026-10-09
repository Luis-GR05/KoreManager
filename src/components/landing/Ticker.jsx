import { useTranslation } from 'react-i18next';

/**
 * Banda lima tipo valla LED de estadio. Decorativa: el texto se repite para
 * el bucle infinito y se oculta a lectores de pantalla (hay una versión sr-only).
 */
export default function Ticker() {
  const { t } = useTranslation();
  const items = t('landing.ticker', { returnObjects: true });
  const list = Array.isArray(items) ? items : [];
  const row = (
    <ul className="ticker__row">
      {list.map((it) => (
        <li key={it} className="flex items-center gap-8">
          <span>{it}</span>
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><circle cx="9" cy="9" r="7" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M3 6.5c3 1.5 9 1.5 12 0M3 11.5c3-1.5 9-1.5 12 0" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>
        </li>
      ))}
    </ul>
  );
  return (
    <div className="ticker">
      <p className="sr-only">{list.join(', ')}</p>
      <div className="ticker__track" aria-hidden="true">
        {row}
        {row}
      </div>
    </div>
  );
}
