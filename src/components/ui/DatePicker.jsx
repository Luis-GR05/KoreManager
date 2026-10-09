import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

/* ───────────── utilidades de fecha (sin zonas horarias: YYYY-MM-DD) ───────────── */
const pad = (n) => String(n).padStart(2, '0');
const toIso = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
const parseIso = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  return m ? { y: +m[1], m: +m[2] - 1, d: +m[3] } : null;
};
const daysIn = (y, m) => new Date(y, m + 1, 0).getDate();
const isoToDisplay = (iso) => {
  const p = parseIso(iso);
  return p ? `${pad(p.d)}/${pad(p.m + 1)}/${p.y}` : '';
};
/** "22/08/2005" → "2005-08-22" (o null si no es una fecha real). */
const displayToIso = (txt) => {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(txt.trim());
  if (!m) return null;
  const d = +m[1];
  const mo = +m[2] - 1;
  const y = +m[3];
  if (mo < 0 || mo > 11 || d < 1 || d > daysIn(y, mo)) return null;
  return toIso(y, mo, d);
};
/** Autoformato mientras se escribe: 22082005 → 22/08/2005 */
const maskDate = (raw) => {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

/**
 * Selector de fecha con la estética de KoreManager.
 * - Se puede escribir (dd/mm/aaaa, con autoformato) o elegir en el calendario.
 * - Selectores de mes y año para saltar rápido (útil para fechas de nacimiento).
 * - Respeta `min` y `max` (YYYY-MM-DD).
 * - Teclado: flechas (día/semana), Re Pág/Av Pág (mes), Inicio/Fin (semana),
 *   Intro/Espacio (elegir), Escape (cerrar).
 *
 * El `onChange` recibe un evento sintético `{ target: { name, value } }` para
 * poder usarse igual que un <input>.
 */
export default function DatePicker({
  id, name, label, value, onChange, onBlur, min, max, error, hint, required, icon,
}) {
  const Icon = icon || Calendar;
  const { t, i18n } = useTranslation();
  const locale = (i18n.resolvedLanguage || i18n.language || 'es').startsWith('en') ? 'en-GB' : 'es-ES';
  const autoId = useId();
  const inputId = id ?? `dp-${autoId}`;
  const panelId = `${inputId}-panel`;
  const errorId = error ? `${inputId}-error` : undefined;
  const hintId = hint && !error ? `${inputId}-hint` : undefined;

  const minP = parseIso(min) ?? { y: 1900, m: 0, d: 1 };
  const today = new Date();
  const maxP = parseIso(max) ?? { y: today.getFullYear() + 5, m: 11, d: 31 };

  const selected = parseIso(value);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(isoToDisplay(value));
  const [view, setView] = useState(() => selected ?? maxP);
  const [focusDay, setFocusDay] = useState(selected?.d ?? 1);
  const rootRef = useRef(null);
  const gridRef = useRef(null);

  // Si el valor cambia desde fuera (no por lo que escribe el usuario), sincroniza el texto
  const [emitted, setEmitted] = useState(value);
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    if (value !== emitted) setText(isoToDisplay(value));
  }

  const emit = (iso) => {
    setEmitted(iso);
    onChange?.({ target: { name, value: iso, type: 'text' } });
  };

  const inRange = (y, m, d) => {
    const iso = toIso(y, m, d);
    return iso >= toIso(minP.y, minP.m, minP.d) && iso <= toIso(maxP.y, maxP.m, maxP.d);
  };

  const monthNames = useMemo(
    () => Array.from({ length: 12 }, (_, i) => new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(2020, i, 1))),
    [locale],
  );
  const weekDays = useMemo(
    // 2024-01-01 fue lunes
    () => Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat(locale, { weekday: 'narrow' }).format(new Date(2024, 0, 1 + i))),
    [locale],
  );
  const years = [];
  for (let y = maxP.y; y >= minP.y; y -= 1) years.push(y);

  const openPanel = () => {
    const base = selected ?? maxP;
    setView({ y: base.y, m: base.m });
    setFocusDay(selected?.d ?? Math.min(base.d ?? 1, daysIn(base.y, base.m)));
    setOpen(true);
  };

  // Cerrar al hacer clic fuera
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (!rootRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // Mantiene el foco en el día activo del calendario
  useEffect(() => {
    if (!open) return;
    gridRef.current?.querySelector(`[data-day="${focusDay}"]`)?.focus();
  }, [open, focusDay, view.y, view.m]);

  const moveMonth = (delta) => {
    let m = view.m + delta;
    let y = view.y;
    while (m < 0) { m += 12; y -= 1; }
    while (m > 11) { m -= 12; y += 1; }
    if (y < minP.y || y > maxP.y) return;
    setView({ y, m });
    setFocusDay((d) => Math.min(d, daysIn(y, m)));
  };

  const pick = (d) => {
    if (!inRange(view.y, view.m, d)) return;
    const iso = toIso(view.y, view.m, d);
    emit(iso);
    setText(isoToDisplay(iso));
    setOpen(false);
    rootRef.current?.querySelector('input')?.focus();
  };

  const onGridKey = (e) => {
    const dim = daysIn(view.y, view.m);
    const go = (d) => {
      e.preventDefault();
      if (d < 1) { moveMonth(-1); setFocusDay(daysIn(view.m === 0 ? view.y - 1 : view.y, (view.m + 11) % 12) + d); return; }
      if (d > dim) { moveMonth(1); setFocusDay(d - dim); return; }
      setFocusDay(d);
    };
    switch (e.key) {
      case 'ArrowLeft': go(focusDay - 1); break;
      case 'ArrowRight': go(focusDay + 1); break;
      case 'ArrowUp': go(focusDay - 7); break;
      case 'ArrowDown': go(focusDay + 7); break;
      case 'PageUp': e.preventDefault(); moveMonth(-1); break;
      case 'PageDown': e.preventDefault(); moveMonth(1); break;
      case 'Home': go(focusDay - ((new Date(view.y, view.m, focusDay).getDay() + 6) % 7)); break;
      case 'End': go(focusDay + (6 - ((new Date(view.y, view.m, focusDay).getDay() + 6) % 7))); break;
      case 'Enter':
      case ' ': e.preventDefault(); pick(focusDay); break;
      case 'Escape': e.preventDefault(); setOpen(false); rootRef.current?.querySelector('input')?.focus(); break;
      default:
    }
  };

  const onText = (e) => {
    const masked = maskDate(e.target.value);
    setText(masked);
    const iso = displayToIso(masked);
    emit(iso ?? (masked ? 'invalid' : ''));
    if (iso) {
      const p = parseIso(iso);
      setView({ y: p.y, m: p.m });
      setFocusDay(p.d);
    }
  };

  // Celdas del mes (empieza en lunes)
  const first = (new Date(view.y, view.m, 1).getDay() + 6) % 7;
  const dim = daysIn(view.y, view.m);
  const cells = [...Array(first).fill(null), ...Array.from({ length: dim }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const isToday = (d) => view.y === today.getFullYear() && view.m === today.getMonth() && d === today.getDate();
  const isSel = (d) => selected && selected.y === view.y && selected.m === view.m && selected.d === d;
  const fullLabel = (d) => new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(view.y, view.m, d));
  const canPrev = toIso(view.y, view.m, 1) > toIso(minP.y, minP.m, 1);
  const canNext = toIso(view.y, view.m, 1) < toIso(maxP.y, maxP.m, 1);

  return (
    <div ref={rootRef} className="relative w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-semibold theme-text">{label}</label>
      )}
      <div className="relative group">
        <Icon aria-hidden="true" size={20} className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 ${error ? 'text-semantic-danger' : 'text-gray-500 group-focus-within:text-brand-purple dark:group-focus-within:text-brand-lime'}`} />
        <input
          id={inputId}
          name={name}
          type="text"
          inputMode="numeric"
          autoComplete="bday"
          placeholder={t('datepicker.placeholder')}
          value={text}
          onChange={onText}
          onBlur={onBlur}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={[errorId, hintId].filter(Boolean).join(' ') || undefined}
          className={`w-full rounded-xl border py-3 pl-12 pr-14 theme-bg theme-text tabular placeholder:text-gray-500 transition-[border-color,box-shadow] duration-200 focus:outline-none ${
            error ? 'border-semantic-danger' : 'theme-border focus:border-brand-purple dark:focus:border-brand-lime focus:shadow-[0_0_0_3px_rgba(138,43,226,0.18)] dark:focus:shadow-[0_0_0_3px_rgba(204,255,0,0.18)]'
          }`}
        />
        <button
          type="button"
          onClick={() => (open ? setOpen(false) : openPanel())}
          aria-label={t('datepicker.open')}
          aria-expanded={open}
          aria-controls={panelId}
          className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg theme-faint transition-colors hover:text-brand-purple dark:hover:text-brand-lime"
        >
          <Calendar size={18} aria-hidden="true" />
        </button>
      </div>
      {hint && !error && <p id={hintId} className="mt-1.5 text-xs theme-faint">{hint}</p>}
      {error && <p id={errorId} role="alert" className="mt-1.5 text-xs font-medium text-semantic-danger">{error}</p>}

      {open && (
        <div id={panelId} role="dialog" aria-modal="false" aria-label={t('datepicker.open')} className="kdp">
          <div className="kdp__head">
            <button type="button" className="kdp__nav" onClick={() => moveMonth(-1)} disabled={!canPrev} aria-label={t('datepicker.prev')}>
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <div className="flex flex-1 gap-2">
              <label className="kdp__select">
                <span className="sr-only">{t('datepicker.month')}</span>
                <select value={view.m} onChange={(e) => { const m = +e.target.value; setView((v) => ({ ...v, m })); setFocusDay((d) => Math.min(d, daysIn(view.y, m))); }}>
                  {monthNames.map((mn, i) => <option key={mn} value={i}>{mn}</option>)}
                </select>
                <ChevronDown size={14} aria-hidden="true" />
              </label>
              <label className="kdp__select kdp__select--year">
                <span className="sr-only">{t('datepicker.year')}</span>
                <select value={view.y} onChange={(e) => { const y = +e.target.value; setView((v) => ({ ...v, y })); setFocusDay((d) => Math.min(d, daysIn(y, view.m))); }}>
                  {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
                <ChevronDown size={14} aria-hidden="true" />
              </label>
            </div>
            <button type="button" className="kdp__nav" onClick={() => moveMonth(1)} disabled={!canNext} aria-label={t('datepicker.next')}>
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>

          <div role="group" ref={gridRef} onKeyDown={onGridKey} className="kdp__grid" aria-label={`${monthNames[view.m]} ${view.y}`}>
            {weekDays.map((w, i) => <span key={`w${i}`} aria-hidden="true" className="kdp__wd">{w}</span>)}
            {cells.map((d, i) => (d ? (
              <button
                key={i}
                type="button"
                data-day={d}
                aria-label={fullLabel(d)}
                tabIndex={d === focusDay ? 0 : -1}
                disabled={!inRange(view.y, view.m, d)}
                aria-pressed={isSel(d)}
                aria-current={isToday(d) ? 'date' : undefined}
                onClick={() => pick(d)}
                className={`kdp__day ${isSel(d) ? 'is-selected' : ''} ${isToday(d) ? 'is-today' : ''}`}
              >
                {d}
              </button>
            ) : <span key={i} aria-hidden="true" />))}
          </div>

          <div className="kdp__foot">
            <button type="button" onClick={() => { emit(''); setText(''); setOpen(false); }}>{t('datepicker.clear')}</button>
            <span className="theme-faint">{t('datepicker.keys')}</span>
          </div>
        </div>
      )}
    </div>
  );
}
