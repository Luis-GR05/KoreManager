import { useEffect, useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import gsap from 'gsap';
import useReducedMotion from '../../hooks/useReducedMotion';
import { photoSrcSet, photoUrl, PHOTOS } from '../../lib/photos';

/**
 * Hero a sangre completa, como la portada de una retransmisión:
 * foto de juego real ocupando la pantalla, titular gigante anclado abajo y un
 * "marcador" de televisión arriba a la derecha con las pistas disponibles.
 * Una única secuencia de entrada; el fondo hace un parallax suave al bajar.
 */
export default function Hero() {
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const rootRef = useRef(null);
  const photoRef = useRef(null);

  useLayoutEffect(() => {
    if (reduced) return undefined;
    const root = rootRef.current;
    const ctx = gsap.context(() => {
      gsap.set('[data-line]', { yPercent: 105 });
      gsap.set('[data-fade]', { autoAlpha: 0, y: 16 });
      gsap.set(photoRef.current, { scale: 1.15 });
      gsap.timeline({ defaults: { ease: 'expo.out' } })
        .to(photoRef.current, { scale: 1, duration: 2.2 }, 0)
        .to('[data-line]', { yPercent: 0, duration: 1.2, stagger: 0.1 }, 0.25)
        .to('[data-fade]', { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.08, clearProps: 'transform' }, 0.8);
    }, root);
    return () => ctx.revert();
  }, [reduced]);

  useEffect(() => {
    if (reduced) return undefined;
    const el = photoRef.current?.parentElement;
    if (!el) return undefined;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const y = window.scrollY;
        if (y < window.innerHeight * 1.2) el.style.transform = `translate3d(0, ${(y * 0.25).toFixed(1)}px, 0)`;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); if (frame) cancelAnimationFrame(frame); };
  }, [reduced]);

  const bug = [
    { name: t('landing.sports.padel.name'), n: 6 },
    { name: t('landing.sports.futsal.name'), n: 3 },
    { name: t('landing.sports.tennis.name'), n: 4 },
  ];

  return (
    <section ref={rootRef} id="top" aria-labelledby="hero-title" className="hero relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-[#0A071B]">
      {/* Foto a sangre */}
      <div className="absolute inset-0 -z-10 will-change-transform">
        <img
          ref={photoRef}
          src={photoUrl('heroPadel', { w: 1600, h: 1000, crop: 'faces,entropy' })}
          srcSet={photoSrcSet('heroPadel', [800, 1280, 1920, 2560], 0.625)}
          sizes="100vw"
          alt={PHOTOS.heroPadel.alt}
          fetchPriority="high"
          decoding="async"
          className="hero__photo h-full w-full object-cover"
        />
      </div>
      <div className="hero__shade absolute inset-0 -z-10" aria-hidden="true" />

      {/* Marcador tipo retransmisión */}
      <aside data-fade className="scorebug" aria-label={t('landing.stats.installations')}>
        <div className="scorebug__head">
          <span className="scorebug__live" aria-hidden="true" />
          {t('landing.hero.bug')}
          <span className="ml-auto opacity-70">{t('landing.hero.open')}</span>
        </div>
        <ul>
          {bug.map((b) => (
            <li key={b.name}>
              <span>{b.name}</span>
              <span className="font-display text-2xl font-black text-brand-lime tabular">{b.n}</span>
            </li>
          ))}
        </ul>
      </aside>

      <div className="relative mx-auto mt-auto w-full max-w-[1600px] px-5 sm:px-8 pb-8 sm:pb-12 pt-32">
        <h1 id="hero-title" className="hero__title font-display font-black uppercase text-white">
          <span className="block overflow-hidden"><span data-line className="block">{t('landing.hero.title1')}</span></span>
          <span className="block overflow-hidden"><span data-line className="block hero__title-2">{t('landing.hero.title2')}</span></span>
        </h1>

        <div className="mt-6 grid gap-6 border-t border-white/20 pt-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <p data-fade className="max-w-xl text-base sm:text-lg leading-relaxed text-white/85">
            {t('landing.hero.desc')}
          </p>
          <div data-fade className="flex flex-col gap-3 sm:flex-row">
            <Link to="/reservar" className="btn-lime inline-flex h-14 items-center justify-center rounded-full px-8 text-base font-bold">
              {t('landing.hero.cta1')}
            </Link>
            <a href="#deportes" className="inline-flex h-14 items-center justify-center rounded-full px-8 text-base font-bold text-white ring-1 ring-white/30 backdrop-blur-md transition-colors hover:bg-white/10">
              {t('landing.hero.cta2')}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
