import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import useInView from '../../hooks/useInView';
import useReducedMotion from '../../hooks/useReducedMotion';

const VIDEOS = [
  { id: 0, name: 'ClubDigital' },
  { id: 1, name: 'Gamificacion' },
  { id: 2, name: 'GestionTotal' },
  { id: 3, name: 'OperativaAutomatizada' },
];
const TOTAL = VIDEOS.length;

/**
 * Carrusel 3D (coverflow) de vídeos verticales.
 *
 * Rendimiento: los vídeos no se descargan hasta que la sección se acerca al
 * viewport (preload="none" + póster WebP) y solo se reproduce el activo.
 * Accesibilidad: botón de pausa (WCAG 2.2.2), flechas solo cuando el carrusel
 * tiene el foco, región con aria-roledescription y anuncio del vídeo activo.
 */
export default function VideoCarousel3D() {
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(reduced);
  const [nearRef, near] = useInView({ once: true, rootMargin: '400px 0px', threshold: 0 });
  const [visibleRef, visible] = useInView({ once: false, rootMargin: '0px', threshold: 0.25 });
  const videoRefs = useRef([]);
  const dragRef = useRef(null);
  const items = t('landing.video.items', { returnObjects: true });

  const next = useCallback(() => setCurrent((p) => (p + 1) % TOTAL), []);
  const prev = useCallback(() => setCurrent((p) => (p - 1 + TOTAL) % TOTAL), []);

  useEffect(() => { setPaused(reduced); }, [reduced]);

  // Las <source> se añaden al acercarse: hay que pedir al vídeo que las cargue
  useEffect(() => {
    if (!near) return;
    videoRefs.current.forEach((v) => v?.load());
  }, [near]);

  // Solo reproduce el vídeo activo y únicamente si la sección es visible
  useEffect(() => {
    videoRefs.current.forEach((v, i) => {
      if (!v) return;
      if (i === current && visible && !paused && near) {
        const p = v.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } else {
        v.pause();
      }
    });
  }, [current, visible, paused, near]);

  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
  };

  // Gestos táctiles: arrastre horizontal
  const onPointerDown = (e) => { dragRef.current = { x: e.clientX, y: e.clientY }; };
  const onPointerUp = (e) => {
    const start = dragRef.current;
    dragRef.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) (dx < 0 ? next : prev)();
  };

  const position = (index) => {
    const diff = (index - current + TOTAL) % TOTAL;
    if (diff === 0) return 'center';
    if (diff === 1) return 'right';
    if (diff === TOTAL - 1) return 'left';
    return 'back';
  };

  const setRefs = (el) => {
    nearRef.current = el;
    visibleRef.current = el;
  };

  const item = Array.isArray(items) ? items[current] : null;

  return (
    <div className="grid items-center gap-10 lg:grid-cols-12">
      <div className="lg:col-span-4">
        <p className="font-display text-7xl sm:text-8xl font-black leading-none text-white/10 tabular" aria-hidden="true">
          {String(current + 1).padStart(2, '0')}
          <span className="text-4xl sm:text-5xl">/{String(TOTAL).padStart(2, '0')}</span>
        </p>
        <div aria-live="polite" className="min-h-[9rem] sm:min-h-[8rem]">
          {item && (
            <div key={current} className="animate-fade-in">
              <h3 className="mt-2 font-display text-4xl sm:text-5xl font-black uppercase leading-[0.95] text-white">{item.title}</h3>
              <p className="mt-3 max-w-sm text-white/65 leading-relaxed">{item.desc}</p>
            </div>
          )}
        </div>
        <div className="mt-6 flex items-center gap-3">
          <button type="button" onClick={prev} aria-label={t('landing.video.prev')} className="carousel-btn">
            <ChevronLeft size={22} aria-hidden="true" />
          </button>
          <button type="button" onClick={next} aria-label={t('landing.video.next')} className="carousel-btn">
            <ChevronRight size={22} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-pressed={paused}
            aria-label={paused ? t('landing.video.play') : t('landing.video.pause')}
            className="carousel-btn"
          >
            {paused ? <Play size={18} aria-hidden="true" /> : <Pause size={18} aria-hidden="true" />}
          </button>
          <div className="ml-2 flex gap-1.5">
            {VIDEOS.map((v, i) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setCurrent(i)}
                aria-label={t('landing.video.goTo', { n: i + 1 })}
                aria-current={i === current ? 'true' : undefined}
                className="grid h-6 w-6 place-items-center"
              >
                <span className={`block h-1.5 rounded-full transition-all duration-500 ease-out-expo ${i === current ? 'w-6 bg-brand-lime' : 'w-1.5 bg-white/30'}`} />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        ref={setRefs}
        role="region"
        aria-roledescription="carrusel"
        aria-label={t('landing.video.carousel')}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        className="coverflow relative mx-auto h-[420px] w-full max-w-3xl touch-pan-y select-none sm:h-[520px] lg:col-span-8 lg:h-[600px] rounded-3xl"
      >
        {VIDEOS.map((video, index) => {
          const pos = position(index);
          const isActive = pos === 'center';
          return (
            <div
              key={video.id}
              data-pos={pos}
              className="coverflow__item"
              role="group"
              aria-hidden={!isActive}
              aria-roledescription="diapositiva"
              aria-label={t('landing.video.slide', { n: index + 1, total: TOTAL })}
              onClick={() => !isActive && setCurrent(index)}
            >
              <video
                ref={(el) => { videoRefs.current[index] = el; }}
                muted
                loop
                playsInline
                preload="none"
                poster={`/videos/${video.name}-poster.webp`}
                tabIndex={-1}
                className="h-full w-full object-cover"
              >
                {near && <source src={`/videos/${video.name}.webm`} type="video/webm" />}
                {near && <source src={`/videos/${video.name}.mp4`} type="video/mp4" />}
              </video>
            </div>
          );
        })}
      </div>
    </div>
  );
}
