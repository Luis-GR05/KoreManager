import { useEffect, useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import gsap from 'gsap';
import useReducedMotion from '../../hooks/useReducedMotion';
import { photoSrcSet, photoUrl, PHOTOS } from '../../lib/photos';

/**
 * Separa "500+" → { pre: '', num: 500, post: '+' } para animar solo la cifra.
 * @param {string} value
 */
function splitStat(value) {
  const m = String(value).match(/^([^\d]*)(\d+)(.*)$/);
  if (!m || value.includes('/')) return { pre: '', num: null, post: value };
  return { pre: m[1], num: Number(m[2]), post: m[3] };
}

const CARDS = [
  { key: 'heroPadel', sport: 'padel' },
  { key: 'heroFutsal', sport: 'futsal' },
  { key: 'heroTennis', sport: 'tennis' },
];

/**
 * Hero: mensaje directo a la izquierda y, a la derecha, tres "cromos" con
 * fotos reales de cada deporte que se abren en abanico. Bajo el titular, una
 * línea lima se traza como la línea de fondo de una pista.
 * Una única secuencia de entrada orquestada; el abanico reacciona al ratón.
 */
export default function Hero() {
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const rootRef = useRef(null);
  const fanRef = useRef(null);

  const STATS = [
    { value: '500+', label: t('landing.stats.members') },
    { value: '13', label: t('landing.stats.installations') },
    { value: '24/7', label: t('landing.stats.availability') },
    { value: '< 30s', label: t('landing.stats.time') },
  ];

  useLayoutEffect(() => {
    if (reduced) return undefined;
    const root = rootRef.current;
    const ctx = gsap.context(() => {
      const lines = root.querySelectorAll('[data-line]');
      const fades = root.querySelectorAll('[data-fade]');
      const cards = root.querySelectorAll('[data-card]');
      const stroke = root.querySelector('[data-stroke]');
      const counters = root.querySelectorAll('[data-count]');

      gsap.set(lines, { yPercent: 110 });
      gsap.set(fades, { autoAlpha: 0, y: 18 });
      gsap.set(cards, { autoAlpha: 0, y: 80, rotate: 0 });
      if (stroke) gsap.set(stroke, { strokeDashoffset: 1 });

      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
      tl.to(lines, { yPercent: 0, duration: 1.1, stagger: 0.1 }, 0.1)
        .to(stroke, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut' }, 0.7)
        .to(cards, { autoAlpha: 1, y: 0, duration: 1.3, stagger: 0.12, clearProps: 'transform,opacity,visibility' }, 0.35)
        .to(fades, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.08, clearProps: 'transform' }, 0.6);

      counters.forEach((el) => {
        const target = Number(el.dataset.count);
        const obj = { v: 0 };
        el.textContent = '0';
        tl.to(obj, { v: target, duration: 1.6, ease: 'power3.out', onUpdate: () => { el.textContent = String(Math.round(obj.v)); } }, 0.9);
      });
    }, root);
    return () => ctx.revert();
  }, [reduced]);

  // El abanico sigue ligeramente al ratón (solo punteros finos)
  useEffect(() => {
    if (reduced || !window.matchMedia('(pointer: fine)').matches) return undefined;
    const fan = fanRef.current;
    if (!fan) return undefined;
    let frame = 0;
    const onMove = (e) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const r = fan.getBoundingClientRect();
        const x = (e.clientX - (r.left + r.width / 2)) / r.width;
        const y = (e.clientY - (r.top + r.height / 2)) / r.height;
        fan.style.setProperty('--mx', Math.max(-1, Math.min(1, x)).toFixed(3));
        fan.style.setProperty('--my', Math.max(-1, Math.min(1, y)).toFixed(3));
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [reduced]);

  return (
    <section
      ref={rootRef}
      id="top"
      aria-labelledby="hero-title"
      className="hero relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-[#0F0F1A]"
    >
      {/* Arte de marca, atenuado, como textura de fondo */}
      <div className="hero__art absolute inset-0 -z-10" aria-hidden="true">
        <picture>
          <source type="image/avif" srcSet="/images/fondoHero-960.avif 960w, /images/fondoHero-1600.avif 1600w, /images/fondoHero-2400.avif 2400w" sizes="100vw" />
          <img src="/images/fondoHero-1600.webp" alt="" width="1600" height="679" decoding="async" className="h-full w-full object-cover" />
        </picture>
      </div>
      <div className="hero__veil absolute inset-0 -z-10" aria-hidden="true" />

      <div className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 items-center gap-12 px-5 sm:px-8 pt-28 pb-44 sm:pb-40 lg:grid-cols-12 lg:gap-8">
        {/* Texto */}
        <div className="lg:col-span-6 xl:col-span-6">
          <h1 id="hero-title" className="hero__title font-display font-black uppercase text-white">
            <span className="block overflow-hidden pb-[0.02em]"><span data-line className="block">{t('landing.hero.title1')}</span></span>
            <span className="relative block overflow-hidden pb-[0.18em]">
              <span data-line className="block">{t('landing.hero.title2')}</span>
            </span>
          </h1>
          {/* Línea de fondo de pista bajo el titular */}
          <svg className="hero__stroke -mt-2 h-4 w-[min(100%,34rem)]" viewBox="0 0 400 12" preserveAspectRatio="none" aria-hidden="true">
            <path data-stroke d="M2 8 L398 4" pathLength="1" />
          </svg>

          <p data-fade className="mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-white/80">
            {t('landing.hero.desc')}
          </p>

          <div data-fade className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link to="/reservar" className="btn-lime inline-flex h-14 items-center justify-center rounded-full px-8 text-base font-bold">
              {t('landing.hero.cta1')}
            </Link>
            <a
              href="#deportes"
              className="inline-flex h-14 items-center justify-center rounded-full px-8 text-base font-bold text-white ring-1 ring-white/25 backdrop-blur-sm transition-colors hover:bg-white/10"
            >
              {t('landing.hero.cta2')}
            </a>
          </div>
        </div>

        {/* Abanico de fotos */}
        <div className="lg:col-span-6 xl:col-span-6">
          <ul ref={fanRef} className="hero-fan" aria-label={t('landing.hero.photos')}>
            {CARDS.map(({ key, sport }, i) => (
              <li key={key} data-card className={`hero-card hero-card--${i}`}>
                <img
                  src={photoUrl(key, { w: 600, h: 800 })}
                  srcSet={photoSrcSet(key, [360, 600, 900], 4 / 3)}
                  sizes="(min-width: 1024px) 22vw, 40vw"
                  alt={PHOTOS[key].alt}
                  width="600"
                  height="800"
                  loading={i === 1 ? 'eager' : 'lazy'}
                  fetchPriority={i === 1 ? 'high' : 'auto'}
                  decoding="async"
                  className="h-full w-full object-cover"
                />
                <span className="hero-card__tag">
                  <span className="font-display text-2xl font-black uppercase leading-none">{t(`landing.sports.${sport}.name`)}</span>
                  <span className="text-xs font-semibold opacity-80">{t(`landing.sports.${sport}.courts`)}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Marcador de estadio */}
      <div data-fade className="absolute inset-x-0 bottom-0">
        <h2 className="sr-only">{t('landing.hero.scoreboard')}</h2>
        <dl className="scoreboard mx-auto grid max-w-7xl grid-cols-2 sm:grid-cols-4">
          {STATS.map((s) => {
            const { pre, num, post } = splitStat(s.value);
            return (
              <div key={s.label} className="scoreboard__cell flex flex-col-reverse gap-1 px-5 sm:px-8 py-4 sm:py-6">
                <dt className="text-[11px] sm:text-xs font-medium text-white/65">{s.label}</dt>
                <dd className="font-display text-4xl sm:text-5xl font-extrabold leading-none text-brand-lime tabular">
                  {pre}
                  {num != null ? <span data-count={num}>{num}</span> : null}
                  {post}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}
