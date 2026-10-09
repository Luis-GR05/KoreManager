import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { photoSrcSet, photoUrl, PHOTOS } from '../../lib/photos';

const SPORTS = [
  { key: 'padel', photo: 'scrollPadel', n: '06' },
  { key: 'futsal', photo: 'heroFutsal', n: '03' },
  { key: 'tennis', photo: 'heroTennis', n: '04' },
];

/**
 * Tres paneles de foto que se expanden (acordeón horizontal). El panel abierto
 * muestra la ficha del deporte; los cerrados enseñan el nombre en vertical.
 * Teclado: cada panel es un botón con aria-expanded. En móvil se apilan.
 */
export default function SportPanels() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(0);

  return (
    <section aria-labelledby="panels-title" className="bg-[#0F0F1A] px-5 sm:px-8 py-24 sm:py-32">
      <div className="mx-auto max-w-[1600px]">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <h2 id="panels-title" className="font-display text-6xl sm:text-8xl font-black uppercase leading-[0.85] text-white lg:col-span-8">
            {t('landing.panels.title')}
          </h2>
          <p className="max-w-sm text-lg text-white/70 lg:col-span-4 lg:justify-self-end">{t('landing.panels.desc')}</p>
        </div>

        <div className="panels mt-12">
          {SPORTS.map((s, i) => {
            const isOpen = open === i;
            const name = t(`landing.sports.${s.key}.name`);
            return (
              <article
                key={s.key}
                className="panel"
                data-open={isOpen}
                onMouseEnter={() => setOpen(i)}
              >
                <img
                  src={photoUrl(s.photo, { w: 1200, h: 1400 })}
                  srcSet={photoSrcSet(s.photo, [600, 1000, 1400], 1.17)}
                  sizes="(min-width: 1024px) 60vw, 100vw"
                  alt={PHOTOS[s.photo].alt}
                  loading="lazy"
                  decoding="async"
                  className="panel__img"
                />
                <div className="panel__shade" aria-hidden="true" />

                <button
                  type="button"
                  className="panel__toggle"
                  aria-expanded={isOpen}
                  aria-controls={`panel-${s.key}`}
                  onClick={() => setOpen(i)}
                  onFocus={() => setOpen(i)}
                >
                  <span className="panel__num font-display tabular">{s.n}</span>
                  <span className="panel__vname font-display">{name}</span>
                  <span className="sr-only">{t('landing.panels.open', { sport: name })}</span>
                </button>

                <div id={`panel-${s.key}`} className="panel__body" inert={!isOpen}>
                  <h3 className="font-display text-6xl sm:text-8xl font-black uppercase leading-[0.85] text-white">{name}</h3>
                  <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-2 text-sm text-white/80">
                    <div><dt className="sr-only">{t('landing.stats.installations')}</dt><dd className="font-display text-3xl font-extrabold text-brand-lime">{t(`landing.sports.${s.key}.courts`)}</dd></div>
                    <div className="self-end"><dt className="sr-only">m</dt><dd className="tabular">{t(`landing.sports.${s.key}.size`)}</dd></div>
                    <div className="self-end"><dt className="sr-only">·</dt><dd>{t(`landing.sports.${s.key}.surface`)}</dd></div>
                  </dl>
                  <p className="mt-4 max-w-md text-white/80">{t(`landing.sports.${s.key}.desc`)}</p>
                  <Link to="/reservar" className="btn-lime mt-6 inline-flex h-12 w-max items-center rounded-full px-7 font-bold">
                    {t('landing.sports.cta')} {name.toLowerCase()}
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
