import { useEffect, useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import gsap from 'gsap';
import useReducedMotion from '../../hooks/useReducedMotion';

/**
 * Separa "500+" → { pre: '', num: 500, post: '+' } para animar solo la cifra.
 * @param {string} value
 */
function splitStat(value) {
  const m = String(value).match(/^([^\d]*)(\d+)(.*)$/);
  if (!m || value.includes('/')) return { pre: '', num: null, post: value };
  return { pre: m[1], num: Number(m[2]), post: m[3] };
}

/**
 * Hero de la landing: única secuencia de entrada orquestada (titular por
 * líneas, texto, CTAs y marcador que cuenta hacia arriba).
 */
export default function Hero() {
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const rootRef = useRef(null);
  const bgRef = useRef(null);

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
      const counters = root.querySelectorAll('[data-count]');

      gsap.set(lines, { yPercent: 115 });
      gsap.set(fades, { autoAlpha: 0, y: 18 });
      gsap.set(bgRef.current, { scale: 1.12, autoAlpha: 0 });

      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
      tl.to(bgRef.current, { scale: 1, autoAlpha: 1, duration: 1.8 }, 0)
        .to(lines, { yPercent: 0, duration: 1.15, stagger: 0.09 }, 0.15)
        .to(fades, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.08, clearProps: 'transform' }, 0.55);

      counters.forEach((el) => {
        const target = Number(el.dataset.count);
        const obj = { v: 0 };
        el.textContent = '0';
        tl.to(obj, {
          v: target,
          duration: 1.6,
          ease: 'power3.out',
          onUpdate: () => { el.textContent = String(Math.round(obj.v)); },
        }, 0.7);
      });
    }, root);
    return () => ctx.revert();
  }, [reduced]);

  // Parallax suave del fondo mientras el hero sigue visible
  useEffect(() => {
    if (reduced) return undefined;
    const el = bgRef.current?.parentElement;
    if (!el) return undefined;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const y = window.scrollY;
        if (y < window.innerHeight * 1.2) el.style.transform = `translate3d(0, ${(y * 0.18).toFixed(1)}px, 0)`;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [reduced]);

  return (
    <section
      ref={rootRef}
      id="top"
      aria-labelledby="hero-title"
      className="hero relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-[#0A071B]"
    >
      {/* Fondo: arte de marca en AVIF/WebP responsive */}
      <div className="absolute inset-0 -z-10 will-change-transform" aria-hidden="true">
        <picture ref={bgRef} className="block h-full w-full">
          <source type="image/avif" srcSet="/images/fondoHero-960.avif 960w, /images/fondoHero-1600.avif 1600w, /images/fondoHero-2400.avif 2400w" sizes="100vw" />
          <source type="image/webp" srcSet="/images/fondoHero-960.webp 960w, /images/fondoHero-1600.webp 1600w, /images/fondoHero-2400.webp 2400w" sizes="100vw" />
          <img
            src="/images/fondoHero-1600.webp"
            alt=""
            width="1600"
            height="679"
            fetchPriority="high"
            decoding="async"
            className="hero__img h-full w-full object-cover"
          />
        </picture>
      </div>
      <div className="hero__veil absolute inset-0 -z-10" aria-hidden="true" />

      <div className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 items-center px-5 sm:px-8 pt-28 pb-44 sm:pb-40 lg:grid-cols-12">
        <div className="lg:col-span-7 lg:col-start-6 xl:col-start-6">
          <h1 id="hero-title" className="hero__title font-display font-black uppercase text-white">
            <span className="block overflow-hidden pb-[0.04em]"><span data-line className="block">{t('landing.hero.title1')}</span></span>
            <span className="block overflow-hidden pb-[0.04em]"><span data-line className="block hero__title-outline">{t('landing.hero.title2')}</span></span>
          </h1>

          <p data-fade className="mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-white/80">
            {t('landing.hero.desc')}
          </p>

          <div data-fade className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to="/reservar"
              className="btn-lime inline-flex h-14 items-center justify-center rounded-full px-8 text-base font-bold"
            >
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
      </div>

      {/* Marcador de estadio */}
      <div data-fade className="absolute inset-x-0 bottom-0">
        <h2 className="sr-only">{t('landing.hero.scoreboard')}</h2>
        <dl className="scoreboard mx-auto grid max-w-7xl grid-cols-2 sm:grid-cols-4">
          {STATS.map((s) => {
            const { pre, num, post } = splitStat(s.value);
            return (
              <div key={s.label} className="scoreboard__cell flex flex-col-reverse gap-1 px-5 sm:px-8 py-4 sm:py-6">
                <dt className="text-[11px] sm:text-xs font-medium text-white/60">{s.label}</dt>
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
