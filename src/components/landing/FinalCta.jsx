import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { COURTS, VIEW_W, VIEW_H } from './courts';

/**
 * Cierre de la landing: lema a gran tamaño sobre una pista de tenis en
 * filigrana, el origen del proyecto, un testimonio y la llamada a la acción.
 */
export default function FinalCta() {
  const { t } = useTranslation();
  const tennis = COURTS[2];

  return (
    <section id="sobre" aria-labelledby="final-title" className="relative isolate overflow-hidden bg-[#0F0F1A] px-5 sm:px-8 py-24 sm:py-36">
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 w-[160%] max-w-none -translate-x-1/2 -translate-y-1/2 opacity-[0.07] sm:w-[120%]"
        aria-hidden="true"
      >
        {tennis.lines.map((l, i) => (
          <path key={i} d={l.d} fill="none" stroke="#CCFF00" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>

      <div className="mx-auto max-w-7xl">
        <h2 id="final-title" className="final__title font-display font-black uppercase text-white">
          <span className="block">{t('landing.final.title1')}</span>
          <span className="block text-brand-lime">{t('landing.final.title2')}</span>
        </h2>

        <div className="mt-14 grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <h3 className="text-2xl font-bold text-white">
              {t('landing.about.title2')} {t('landing.about.title3')}
            </h3>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/70">{t('landing.about.desc')}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/register" className="btn-lime inline-flex h-14 items-center justify-center rounded-full px-8 font-bold">
                {t('landing.about.cta')}
              </Link>
              <Link to="/login" className="inline-flex h-14 items-center justify-center rounded-full px-8 font-bold text-white ring-1 ring-white/20 transition-colors hover:bg-white/10">
                {t('landing.nav.loginBtn')}
              </Link>
            </div>
          </div>

          <figure className="lg:col-span-5 lg:col-start-8 self-end border-l-2 border-brand-purple pl-6">
            <blockquote className="font-display text-3xl sm:text-4xl font-bold leading-[1.05] text-white">
              {t('landing.about.testimonial')}
            </blockquote>
            <figcaption className="mt-5 text-sm text-white/55">{t('landing.about.testimonialAuthor')}</figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
