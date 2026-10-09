import { useEffect, useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, ShieldCheck } from 'lucide-react';
import gsap from 'gsap';
import useReducedMotion from '../../hooks/useReducedMotion';
import NetworkField from './NetworkField';

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
 * Hero con la identidad de KoreManager: la red de nodos púrpura del logotipo
 * cobra vida en un canvas, estelas de luz lima la atraviesan (como en el arte
 * de marca) y el logo 3D flota en el centro rodeado de tarjetas de cristal
 * con lo que hace la app. Una única secuencia de entrada orquestada.
 */
export default function Hero({ totalCourts = null }) {
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const rootRef = useRef(null);
  const stageRef = useRef(null);

  const points = t('auth.panelPoints', { returnObjects: true });
  const securePay = Array.isArray(points) ? points[1] : 'Stripe';

  const STATS = [
    { value: '500+', label: t('landing.stats.members') },
    { value: totalCourts != null ? String(totalCourts) : '—', label: t('landing.stats.installations') },
    { value: '24/7', label: t('landing.stats.availability') },
    { value: '< 30s', label: t('landing.stats.time') },
  ];

  useLayoutEffect(() => {
    if (reduced) return undefined;
    const root = rootRef.current;
    const ctx = gsap.context(() => {
      gsap.set('[data-line]', { yPercent: 110 });
      gsap.set('[data-fade]', { autoAlpha: 0, y: 18 });
      gsap.set('[data-logo]', { autoAlpha: 0, scale: 0.85, y: 30 });
      gsap.set('[data-chip]', { autoAlpha: 0, y: 24, scale: 0.94 });

      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
      tl.to('[data-logo]', { autoAlpha: 1, scale: 1, y: 0, duration: 1.8 }, 0.1)
        .to('[data-line]', { yPercent: 0, duration: 1.1, stagger: 0.1 }, 0.2)
        .to('[data-chip]', { autoAlpha: 1, y: 0, scale: 1, duration: 1, stagger: 0.14, clearProps: 'transform' }, 0.9)
        .to('[data-fade]', { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.08, clearProps: 'transform' }, 0.6);

      root.querySelectorAll('[data-count]').forEach((el) => {
        const target = Number(el.dataset.count);
        const obj = { v: 0 };
        el.textContent = '0';
        tl.to(obj, { v: target, duration: 1.6, ease: 'power3.out', onUpdate: () => { el.textContent = String(Math.round(obj.v)); } }, 0.9);
      });
    }, root);
    return () => ctx.revert();
  }, [reduced]);

  // El logo y las tarjetas se inclinan levemente con el ratón
  useEffect(() => {
    if (reduced || !window.matchMedia('(pointer: fine)').matches) return undefined;
    const stage = stageRef.current;
    if (!stage) return undefined;
    let frame = 0;
    const onMove = (e) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const x = e.clientX / window.innerWidth - 0.5;
        const y = e.clientY / window.innerHeight - 0.5;
        stage.style.setProperty('--mx', x.toFixed(3));
        stage.style.setProperty('--my', y.toFixed(3));
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => { window.removeEventListener('pointermove', onMove); if (frame) cancelAnimationFrame(frame); };
  }, [reduced]);

  return (
    <section ref={rootRef} id="top" aria-labelledby="hero-title" className="hero relative isolate flex min-h-[100svh] flex-col overflow-hidden">
      {/* Fondo: degradado de marca + red de nodos viva + estelas de luz */}
      <div className="hero__bg absolute inset-0 -z-20" aria-hidden="true" />
      <NetworkField className="absolute inset-0 -z-10 h-full w-full" />
      <svg className="hero__streams absolute inset-0 -z-10 h-full w-full" viewBox="0 0 1440 900" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="stream-a" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#CCFF00" stopOpacity="0" />
            <stop offset="0.45" stopColor="#CCFF00" stopOpacity="0.9" />
            <stop offset="0.7" stopColor="#2EF2C8" stopOpacity="0.8" />
            <stop offset="1" stopColor="#2EF2C8" stopOpacity="0" />
          </linearGradient>
          <filter id="stream-glow" x="-10%" y="-50%" width="120%" height="200%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <g filter="url(#stream-glow)" fill="none" stroke="url(#stream-a)" strokeLinecap="round">
          <path className="stream stream--1" d="M-40 760 C 300 700, 520 820, 820 560 S 1240 260, 1500 300" strokeWidth="2.4" />
          <path className="stream stream--2" d="M-40 820 C 360 760, 600 860, 900 620 S 1260 330, 1500 380" strokeWidth="1.4" />
          <path className="stream stream--3" d="M-40 700 C 280 660, 560 760, 780 520 S 1200 220, 1500 240" strokeWidth="1" />
        </g>
      </svg>
      <div className="hero__vignette absolute inset-0 -z-10" aria-hidden="true" />

      <div className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 items-center gap-10 px-5 sm:px-8 pt-28 pb-44 sm:pb-40 lg:grid-cols-12">
        {/* Texto */}
        <div className="relative z-10 lg:col-span-6">
          <h1 id="hero-title" className="hero__title font-display font-black uppercase text-white">
            <span className="block overflow-hidden"><span data-line className="block">{t('landing.hero.title1')}</span></span>
            <span className="block overflow-hidden pb-[0.06em]"><span data-line className="block hero__title-glow">{t('landing.hero.title2')}</span></span>
          </h1>
          <p data-fade className="mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-white/80">
            {t('landing.hero.desc')}
          </p>
          <div data-fade className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link to="/reservar" className="btn-lime inline-flex h-14 items-center justify-center rounded-full px-8 text-base font-bold">
              {t('landing.hero.cta1')}
            </Link>
            <a href="#deportes" className="inline-flex h-14 items-center justify-center rounded-full px-8 text-base font-bold text-white ring-1 ring-white/25 backdrop-blur-sm transition-colors hover:bg-white/10">
              {t('landing.hero.cta2')}
            </a>
          </div>
        </div>

        {/* Escenario: logo 3D + tarjetas de cristal */}
        <div ref={stageRef} className="hero-stage lg:col-span-6" aria-hidden="true">
          <div className="hero-stage__halo" />
          <img data-logo src="/images/logo3d-900.webp" alt="" width="900" height="1085" decoding="async" fetchPriority="high" className="hero-stage__logo" />

          <div data-chip className="glass-chip glass-chip--a">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-lime text-[#0F0F1A]"><Check size={16} strokeWidth={3} /></span>
            <span>
              <span className="block text-[13px] font-bold">{t('landing.features.mock.confirmed')}</span>
              <span className="block text-[11px] text-white/65">{t('landing.features.mock.booking')}</span>
            </span>
          </div>
          <div data-chip className="glass-chip glass-chip--b">
            <span className="relative flex h-3 w-3" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-lime opacity-60" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-brand-lime" />
            </span>
            <span>
              <span className="block text-[13px] font-bold">{t('landing.hero.realtime')}</span>
              <span className="block text-[11px] text-white/65">{t('landing.hero.realtimeDesc')}</span>
            </span>
          </div>
          <div data-chip className="glass-chip glass-chip--c">
            <ShieldCheck size={18} className="text-brand-lime" />
            <span className="text-[12px] font-semibold">{securePay}</span>
          </div>
        </div>
      </div>

      {/* Marcador */}
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
