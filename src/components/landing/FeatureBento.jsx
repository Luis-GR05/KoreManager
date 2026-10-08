import { useTranslation } from 'react-i18next';
import { Check, Users, ShieldCheck, Megaphone, Bell } from 'lucide-react';
import useInView from '../../hooks/useInView';

const HOURS = ['17', '18', '19', '20', '21', '22'];
// 0 = libre, 1 = ocupada, 2 = tu reserva
const GRID = [
  [1, 1, 0, 1, 1, 0],
  [0, 1, 2, 1, 0, 0],
  [1, 0, 0, 1, 1, 1],
  [0, 0, 1, 1, 0, 1],
];
const BARS = [6, 9, 7, 12, 10, 15];

/**
 * Parrilla de horarios en miniatura: se rellena al entrar en pantalla.
 */
function Timetable({ inView }) {
  const { t } = useTranslation();
  const COURTS = [
    `${t('landing.sports.padel.name')} 1`,
    `${t('landing.sports.padel.name')} 2`,
    `${t('landing.sports.tennis.name')} 1`,
    t('landing.sports.futsal.name'),
  ];
  return (
    <div className="mt-8" aria-hidden="true">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-white/65">
        <span className="font-semibold text-white/80">{t('landing.features.mock.today')}</span>
        <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="flex items-center gap-1.5"><i className="tt-key tt-key--free" />{t('landing.features.mock.free')}</span>
          <span className="flex items-center gap-1.5"><i className="tt-key tt-key--taken" />{t('landing.features.mock.taken')}</span>
          <span className="flex items-center gap-1.5"><i className="tt-key tt-key--mine" />{t('landing.features.mock.yours')}</span>
        </span>
      </div>
      <div className="grid grid-cols-[5.5rem_repeat(6,minmax(0,1fr))] gap-1.5 text-[11px]">
        <span />
        {HOURS.map((h) => (
          <span key={h} className="pb-1 text-center font-display text-sm font-bold text-white/65 tabular">{h}:00</span>
        ))}
        {COURTS.map((c, r) => (
          <div key={c} className="contents">
            <span className="flex items-center text-white/60 whitespace-nowrap">{c}</span>
            {GRID[r].map((state, col) => (
              <span
                key={col}
                className={`tt-cell tt-cell--${['free', 'taken', 'mine'][state]} ${inView ? 'is-in' : ''}`}
                style={{ transitionDelay: `${(r * 6 + col) * 28}ms` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Funciones en formato bento: tres piezas con mini‑visualizaciones del producto
 * y tres ventajas secundarias en una fila más discreta.
 */
export default function FeatureBento() {
  const { t } = useTranslation();
  const [ref, inView] = useInView({ threshold: 0.25 });
  const months = t('landing.features.mock.months', { returnObjects: true });
  const max = Math.max(...BARS);

  const minor = [
    { icon: Users, key: 'f3' },
    { icon: ShieldCheck, key: 'f5' },
    { icon: Megaphone, key: 'f6' },
  ];

  return (
    <section id="funciones" aria-labelledby="features-title" className="relative bg-[#0F0F1A] px-5 sm:px-8 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <h2 id="features-title" className="font-display text-5xl sm:text-7xl font-black uppercase leading-[0.9] text-white lg:col-span-7">
            {t('landing.features.title')}
          </h2>
          <p className="max-w-md text-base sm:text-lg leading-relaxed text-white/65 lg:col-span-5 lg:justify-self-end">
            {t('landing.features.desc')}
          </p>
        </div>

        <div ref={ref} className="mt-14 grid gap-4 lg:grid-cols-12 lg:grid-rows-[auto_auto]">
          {/* Reservas en tiempo real */}
          <article className="bento bento--xl lg:col-span-7 lg:row-span-2">
            <h3 className="font-display text-3xl sm:text-4xl font-extrabold uppercase text-white">{t('landing.features.f1.title')}</h3>
            <p className="mt-2 max-w-md text-white/65">{t('landing.features.f1.desc')}</p>
            <Timetable inView={inView} />
          </article>

          {/* Confirmación instantánea */}
          <article className="bento lg:col-span-5">
            <h3 className="font-display text-2xl sm:text-3xl font-extrabold uppercase text-white">{t('landing.features.f2.title')}</h3>
            <p className="mt-2 text-white/65">{t('landing.features.f2.desc')}</p>
            <div className={`toast-mock mt-6 ${inView ? 'is-in' : ''}`} aria-hidden="true">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-lime text-[#0F0F1A]">
                <Check size={18} strokeWidth={3} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-white">{t('landing.features.mock.confirmed')}</span>
                <span className="block truncate text-xs text-white/60">{t('landing.features.mock.booking')}</span>
              </span>
              <span className="ml-auto flex items-center gap-1 whitespace-nowrap text-[11px] text-white/65">
                <Bell size={12} /> {t('landing.features.mock.reminder')}
              </span>
            </div>
          </article>

          {/* Historial deportivo */}
          <article className="bento lg:col-span-5">
            <div className="flex items-start justify-between gap-6">
              <div>
                <h3 className="font-display text-2xl sm:text-3xl font-extrabold uppercase text-white">{t('landing.features.f4.title')}</h3>
                <p className="mt-2 text-white/65">{t('landing.features.f4.desc')}</p>
              </div>
            </div>
            <figure className="mt-6" aria-hidden="true">
              <div className="flex h-28 items-end gap-2">
                {BARS.map((v, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                    <span className="font-display text-sm font-bold text-white/60 tabular">{v}</span>
                    <span
                      className={`bar w-full rounded-t-md ${i === BARS.length - 1 ? 'bg-brand-lime' : 'bg-brand-purple/60'} ${inView ? 'is-in' : ''}`}
                      style={{ height: `${(v / max) * 72}px`, transitionDelay: `${i * 70}ms` }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-2 flex gap-2 text-[11px] text-white/60">
                {Array.isArray(months) && months.map((m) => <span key={m} className="flex-1 text-center">{m}</span>)}
              </div>
              <figcaption className="sr-only">{t('landing.features.mock.hours')}</figcaption>
            </figure>
          </article>
        </div>

        {/* Ventajas secundarias: sin tarjetas, separadas por líneas */}
        <ul className="mt-4 grid border-t border-white/10 sm:grid-cols-3">
          {minor.map((item, i) => {
            const Icon = item.icon;
            const { key } = item;
            return (
            <li
              key={key}
              className={`flex gap-4 py-8 sm:px-8 ${i > 0 ? 'border-t border-white/10 sm:border-t-0 sm:border-l' : ''} ${i === 0 ? 'sm:pl-0' : ''}`}
            >
              <Icon size={22} className="mt-0.5 shrink-0 text-brand-lime" aria-hidden="true" />
              <div>
                <h3 className="font-bold text-white">{t(`landing.features.${key}.title`)}</h3>
                <p className="mt-1 text-sm leading-relaxed text-white/60">{t(`landing.features.${key}.desc`)}</p>
              </div>
            </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
