import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { COURTS, VIEW_W, VIEW_H, ballAt } from './courts';
import useReducedMotion from '../../hooks/useReducedMotion';


const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));

/**
 * Sección "La pista se dibuja": scroll fijado (sticky) en el que cada deporte
 * dibuja sus líneas reglamentarias a medida que el usuario baja.
 *
 * Rendimiento: el progreso se calcula en un único requestAnimationFrame y se
 * aplica directamente al DOM; React solo re-renderiza al cambiar de deporte.
 *
 * @returns {import('react').JSX.Element}
 */
export default function CourtScroll() {
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const sectionRef = useRef(null);
  const courtRefs = useRef([]);
  const tabFillRefs = useRef([]);
  const ballRefs = useRef([]);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);

  const sports = [
    { key: 'padel', court: COURTS[0] },
    { key: 'futsal', court: COURTS[1] },
    { key: 'tennis', court: COURTS[2] },
  ];
  const n = sports.length;

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;

    // Cachea los trazos de cada pista para no consultar el DOM en cada frame
    const pathsPerCourt = courtRefs.current.map((g) =>
      g ? Array.from(g.querySelectorAll('[data-line]')) : [],
    );

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = section.getBoundingClientRect();
      const total = section.offsetHeight - window.innerHeight;
      const p = total > 0 ? clamp(-rect.top / total) : 0;
      const seg = p * n;
      const idx = Math.min(n - 1, Math.floor(seg));

      for (let i = 0; i < n; i += 1) {
        const local = clamp(seg - i);
        const draw = reduced ? (i <= idx ? 1 : 0) : clamp(local / 0.55);
        const paths = pathsPerCourt[i];
        const m = paths.length;
        for (let j = 0; j < m; j += 1) {
          const start = m > 1 ? (j / (m - 1)) * 0.45 : 0;
          const ld = i < idx ? 1 : clamp((draw - start) / 0.55);
          paths[j].style.strokeDashoffset = String(1 - ld);
        }

        const g = courtRefs.current[i];
        if (g) g.dataset.state = i === idx ? 'active' : i < idx ? 'past' : 'next';

        const fill = tabFillRefs.current[i];
        if (fill) fill.style.transform = `scaleX(${i < idx ? 1 : i === idx ? Math.max(0.04, local) : 0})`;

        const ballEl = ballRefs.current[i];
        if (ballEl) {
          const tb = clamp((local - 0.4) / 0.55);
          const { x, y, lift } = ballAt(sports[i].court, tb);
          ballEl.style.opacity = !reduced && i === idx && tb > 0 && tb < 1 ? '1' : '0';
          ballEl.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
          ballEl.lastChild?.setAttribute('cy', String((-lift).toFixed(1)));
        }
      }

      if (idx !== activeRef.current) {
        activeRef.current = idx;
        setActive(idx);
      }
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  /** Lleva el scroll hasta el deporte elegido (con la pista ya dibujada). */
  const goTo = (i) => {
    const section = sectionRef.current;
    if (!section) return;
    const total = section.offsetHeight - window.innerHeight;
    const top = section.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + ((i + 0.62) / n) * total, behavior: reduced ? 'auto' : 'smooth' });
  };

  return (
    <section
      id="pistas"
      ref={sectionRef}
      className="court-scroll relative bg-[#0F0F1A]"
      style={{ height: `${n * 100 + 70}vh` }}
      aria-labelledby="sports-title"
    >
      {/* Resumen accesible para lectores de pantalla */}
      <ul className="sr-only">
        {sports.map(({ key }) => (
          <li key={key}>
            {t(`landing.sports.${key}.name`)}: {t(`landing.sports.${key}.courts`)}, {t(`landing.sports.${key}.size`)}. {t(`landing.sports.${key}.desc`)}
          </li>
        ))}
      </ul>

      <div className="sticky top-0 h-[100dvh] overflow-hidden">
        <div className="court-scroll__grid mx-auto h-full max-w-7xl px-5 sm:px-8 pt-20 pb-8 lg:pt-24">
          {/* ── Columna de texto ── */}
          <div className="court-scroll__text">
            <h2 id="sports-title" className="font-display text-xl sm:text-2xl font-extrabold uppercase text-white/60">
              {t('landing.sports.title')}
            </h2>

            {/* Selector / progreso */}
            <div role="group" aria-label={t('landing.sports.progress')} className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
              {sports.map(({ key }, i) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-current={active === i ? 'true' : undefined}
                  className={`court-tab group text-left ${active === i ? 'text-white' : 'text-white/60 hover:text-white/80'}`}
                >
                  <span className="relative block h-[3px] w-full overflow-hidden rounded-full bg-white/10">
                    <span
                      ref={(el) => { tabFillRefs.current[i] = el; }}
                      className="absolute inset-0 origin-left bg-brand-lime"
                      style={{ transform: 'scaleX(0)' }}
                    />
                  </span>
                  <span className="mt-2 block text-xs sm:text-sm font-semibold">
                    {t(`landing.sports.${key}.name`)}
                  </span>
                </button>
              ))}
            </div>

            {/* Ficha del deporte activo */}
            <div className="court-scroll__info relative mt-6 lg:mt-10">
              {sports.map(({ key }, i) => (
                <article
                  key={key}
                  className="court-info"
                  data-state={i === active ? 'active' : i < active ? 'past' : 'next'}
                  inert={i !== active}
                  aria-hidden={i !== active}
                >
                  <h3 className="font-display font-black uppercase leading-[0.82] text-white text-[clamp(4rem,11vw,9.5rem)]">
                    {t(`landing.sports.${key}.name`)}
                  </h3>
                  <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                    <div className="flex items-baseline gap-2">
                      <dt className="sr-only">{t('landing.stats.installations')}</dt>
                      <dd className="font-display text-2xl font-extrabold text-brand-lime tabular">{t(`landing.sports.${key}.courts`)}</dd>
                    </div>
                    <div className="flex items-baseline gap-2 text-white/70">
                      <dt className="sr-only">{t('landing.sports.length')} × {t('landing.sports.width')}</dt>
                      <dd className="tabular">{t(`landing.sports.${key}.size`)}</dd>
                    </div>
                    <div className="flex items-baseline gap-2 text-white/70">
                      <dt className="sr-only">Superficie</dt>
                      <dd>{t(`landing.sports.${key}.surface`)}</dd>
                    </div>
                  </dl>
                  <p className="mt-4 max-w-md text-base sm:text-lg leading-relaxed text-white/75">
                    {t(`landing.sports.${key}.desc`)}
                  </p>
                  <Link
                    to="/reservar"
                    className="mt-7 inline-flex items-center gap-3 rounded-full bg-brand-lime px-6 py-3.5 font-bold text-[#0F0F1A] transition-transform duration-300 ease-out-expo hover:-translate-y-0.5"
                  >
                    {t('landing.sports.cta')} {t(`landing.sports.${key}.name`).toLowerCase()}
                  </Link>
                </article>
              ))}
            </div>

            <p className="court-scroll__hint mt-auto hidden lg:block text-xs text-white/60" aria-hidden="true">
              {t('landing.sports.scrollHint')}
            </p>
          </div>

          {/* ── Pista ── */}
          <div className="court-scroll__stage" aria-hidden="true">
            <div className="court-scroll__plane">
              <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="h-auto w-full overflow-visible">
                {sports.map(({ key, court }, i) => {
                  const { box } = court;
                  return (
                    <g
                      key={key}
                      ref={(el) => { courtRefs.current[i] = el; }}
                      className="court"
                      data-state={i === 0 ? 'active' : 'next'}
                    >
                      {/* superficie */}
                      <rect x={box.x0} y={box.y0} width={box.w} height={box.h} className="court__floor" rx="2" />
                      {/* cotas */}
                      <g className="court__dims">
                        <path d={`M${box.x0} ${box.y0 - 18}H${box.x0 + box.w}M${box.x0} ${box.y0 - 23}v10M${box.x0 + box.w} ${box.y0 - 23}v10`} />
                        <text x={box.x0 + box.w / 2} y={box.y0 - 26} textAnchor="middle">{court.length.toString().replace('.', ',')} m</text>
                        <path d={`M${box.x0 - 18} ${box.y0}V${box.y0 + box.h}M${box.x0 - 23} ${box.y0}h10M${box.x0 - 23} ${box.y0 + box.h}h10`} />
                        <text x={box.x0 - 26} y={box.y0 + box.h / 2} textAnchor="middle" transform={`rotate(-90 ${box.x0 - 26} ${box.y0 + box.h / 2})`}>
                          {court.width.toString().replace('.', ',')} m
                        </text>
                      </g>
                      {court.walls.map((d, j) => (
                        <path key={`w${j}`} d={d} pathLength="1" data-line className="court__wall" />
                      ))}
                      {court.lines.map((l, j) => (
                        <path
                          key={`l${j}`}
                          d={l.d}
                          pathLength="1"
                          data-line
                          className={l.weight === 'net' ? 'court__net' : l.weight === 'main' ? 'court__line court__line--main' : 'court__line'}
                        />
                      ))}
                      {court.dots.map((dot, j) => (
                        <circle key={`d${j}`} cx={dot.cx} cy={dot.cy} r={dot.r} className="court__dot" />
                      ))}
                      <g ref={(el) => { ballRefs.current[i] = el; }} className="court__ball" style={{ opacity: 0 }}>
                        <ellipse cx="0" cy="0" rx={court.ball.r * 1.6} ry={court.ball.r * 0.7} className="court__ball-shadow" />
                        <circle cx="0" cy="0" r={court.ball.r * 1.6} className="court__ball-core" />
                      </g>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
