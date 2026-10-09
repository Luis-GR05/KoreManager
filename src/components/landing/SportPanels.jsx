import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { photoSrcSet, photoUrl, PHOTOS } from '../../lib/photos';

/**
 * Paneles de deportes (acordeón horizontal) generados a partir de la BD:
 * un panel por cada `tipo` de instalación que haya creado el administrador,
 * con su número real de pistas y cuántas están disponibles ahora.
 *
 * @param {{ sports: ReturnType<typeof import('../../lib/sports').describeSport>[], loading: boolean }} props
 */
export default function SportPanels({ sports, loading }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(0);
  const active = Math.min(open, Math.max(0, sports.length - 1));

  return (
    <section aria-labelledby="panels-title" aria-busy={loading} className="bg-[#0F0F1A] px-5 sm:px-8 py-24 sm:py-32">
      <div className="mx-auto max-w-[1600px]">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <h2 id="panels-title" className="font-display text-6xl sm:text-8xl font-black uppercase leading-[0.85] text-white lg:col-span-8">
            {t('landing.panels.title')}
          </h2>
          <p className="max-w-sm text-lg text-white/70 lg:col-span-4 lg:justify-self-end">{t('landing.panels.desc')}</p>
        </div>

        {loading && (
          <div className="panels mt-12" aria-hidden="true">
            {[0, 1, 2].map((i) => <div key={i} className="panel panel--skeleton" data-open={i === 0} />)}
            <span className="sr-only">{t('landing.panels.loading')}</span>
          </div>
        )}

        {!loading && sports.length === 0 && (
          <p className="mt-12 rounded-2xl border border-white/10 p-8 text-white/70">{t('sportsCatalog.none')}</p>
        )}

        {!loading && sports.length > 0 && (
          <div className="panels mt-12">
            {sports.map((s, i) => {
              const isOpen = active === i;
              return (
                <article key={s.id} className="panel" data-open={isOpen} onMouseEnter={() => setOpen(i)}>
                  <img
                    src={photoUrl(s.photo, { w: 1200, h: 1400 })}
                    srcSet={photoSrcSet(s.photo, [600, 1000, 1400], 1.17)}
                    sizes="(min-width: 1024px) 60vw, 100vw"
                    alt={PHOTOS[s.photo]?.alt ?? ''}
                    loading="lazy"
                    decoding="async"
                    className="panel__img"
                  />
                  <div className="panel__shade" aria-hidden="true" />

                  <button
                    type="button"
                    className="panel__toggle"
                    aria-expanded={isOpen}
                    aria-controls={`panel-${s.id}`}
                    onClick={() => setOpen(i)}
                    onFocus={() => setOpen(i)}
                  >
                    <span className="panel__num">
                      <span className="panel__dot" data-ok={s.disponibles > 0} aria-hidden="true" />
                      {t('sportsCatalog.courts', { count: s.pistas })}
                    </span>
                    <span className="panel__vname font-display">{s.name}</span>
                    <span className="sr-only">{t('landing.panels.open', { sport: s.name })}</span>
                  </button>

                  <div id={`panel-${s.id}`} className="panel__body" inert={!isOpen}>
                    <h3 className="font-display text-6xl sm:text-8xl font-black uppercase leading-[0.85] text-white">{s.name}</h3>
                    <dl className="mt-5 flex flex-wrap items-baseline gap-x-8 gap-y-2 text-sm text-white/80">
                      <div>
                        <dt className="sr-only">{t('landing.stats.installations')}</dt>
                        <dd className="font-display text-3xl font-extrabold text-brand-lime">{t('sportsCatalog.courts', { count: s.pistas })}</dd>
                      </div>
                      <div>
                        <dt className="sr-only">{t('sportsCatalog.available_other', { count: s.disponibles })}</dt>
                        <dd className="flex items-center gap-2">
                          <span className="panel__dot" data-ok={s.disponibles > 0} aria-hidden="true" />
                          {t('sportsCatalog.available', { count: s.disponibles })}
                        </dd>
                      </div>
                      {s.size && <div><dt className="sr-only">m</dt><dd className="tabular">{s.size}</dd></div>}
                    </dl>
                    <p className="mt-4 max-w-md text-white/80">{s.desc}</p>
                    <Link to="/reservar" className="btn-lime mt-6 inline-flex h-12 w-max items-center rounded-full px-7 font-bold">
                      {t('landing.sports.cta')} {s.name.toLowerCase()}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
