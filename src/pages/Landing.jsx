import { useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Zap, Calendar, Users, Shield, Star, Clock, ChevronDown, User } from 'lucide-react';
import { GiPingPongBat, GiSoccerBall, GiTennisRacket } from 'react-icons/gi';
import gsap from 'gsap';
import Footer from '../components/Footer';
import VideoCarousel3D from '../components/ui/VideoCarousel3D';



/**
 * Etiqueta de sección (texto pequeño en mayúsculas).
 * @param {{children: import('react').ReactNode}} props
 * @returns {import('react').JSX.Element}
 */
function SectionLabel({ children }) {
  return (
    <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-purple dark:text-brand-lime/70 mb-4">
      {children}
    </p>
  );
}

/**
 * Orb de fondo con blur para decoración.
 * @param {{className?: string}} props
 * @returns {import('react').JSX.Element}
 */
function GlowOrb({ className }) {
  return (
    <div
      aria-hidden="true"
      className={`absolute rounded-full pointer-events-none blur-[140px] ${className}`}
    />
  );
}

/**
 * Landing pública con animaciones (GSAP) y secciones por scroll.
 * @returns {import('react').JSX.Element}
 */
export default function Landing() {
  const { t, i18n } = useTranslation();
  const heroRef = useRef(null);
  const statsRef = useRef(null);
  const sportsRef = useRef(null);
  const featuresRef = useRef(null);
  const aboutRef = useRef(null);

  // Dynamic arrays needing translation
  const SPORTS = [
    {
      name: t('landing.sports.padel.name'),
      icon: GiPingPongBat,
      courts: t('landing.sports.padel.courts'),
      accent: '#CCFF00',
      bg: 'from-[#CCFF00]/10 to-transparent',
      border: 'border-[#CCFF00]/20',
      description: t('landing.sports.padel.desc'),
    },
    {
      name: t('landing.sports.futsal.name'),
      icon: GiSoccerBall,
      courts: t('landing.sports.futsal.courts'),
      accent: '#8A2BE2',
      bg: 'from-[#8A2BE2]/10 to-transparent',
      border: 'border-[#8A2BE2]/20',
      description: t('landing.sports.futsal.desc'),
    },
    {
      name: t('landing.sports.tennis.name'),
      icon: GiTennisRacket,
      courts: t('landing.sports.tennis.courts'),
      accent: '#007AFF',
      bg: 'from-[#007AFF]/10 to-transparent',
      border: 'border-[#007AFF]/20',
      description: t('landing.sports.tennis.desc'),
    },
  ];

  const STATS = [
    { value: '500+', label: t('landing.stats.members') },
    { value: '13', label: t('landing.stats.installations') },
    { value: '24/7', label: t('landing.stats.availability') },
    { value: '< 30s', label: t('landing.stats.time') },
  ];

  const FEATURES = [
    {
      icon: Calendar,
      title: t('landing.features.f1.title'),
      desc: t('landing.features.f1.desc'),
      color: 'text-brand-lime',
      glow: 'from-brand-lime/10',
      border: 'group-hover:border-brand-lime/30',
    },
    {
      icon: Zap,
      title: t('landing.features.f2.title'),
      desc: t('landing.features.f2.desc'),
      color: 'text-brand-purple',
      glow: 'from-brand-purple/10',
      border: 'group-hover:border-brand-purple/30',
    },
    {
      icon: Users,
      title: t('landing.features.f3.title'),
      desc: t('landing.features.f3.desc'),
      color: 'text-blue-400',
      glow: 'from-blue-500/10',
      border: 'group-hover:border-blue-400/30',
    },
    {
      icon: Clock,
      title: t('landing.features.f4.title'),
      desc: t('landing.features.f4.desc'),
      color: 'text-emerald-400',
      glow: 'from-emerald-500/10',
      border: 'group-hover:border-emerald-400/30',
    },
    {
      icon: Shield,
      title: t('landing.features.f5.title'),
      desc: t('landing.features.f5.desc'),
      color: 'text-orange-400',
      glow: 'from-orange-500/10',
      border: 'group-hover:border-orange-400/30',
    },
    {
      icon: Star,
      title: t('landing.features.f6.title'),
      desc: t('landing.features.f6.desc'),
      color: 'text-yellow-400',
      glow: 'from-yellow-500/10',
      border: 'group-hover:border-yellow-400/30',
    },
  ];

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const heroItems = heroRef.current?.querySelectorAll('[data-hero]') ?? [];
      const statItems = statsRef.current?.querySelectorAll('[data-stat]') ?? [];
      const sportCards = sportsRef.current?.querySelectorAll('[data-sport]') ?? [];
      const featureCards = featuresRef.current?.querySelectorAll('[data-feature]') ?? [];
      const aboutItems = aboutRef.current?.querySelectorAll('[data-about]') ?? [];

      gsap.set([...heroItems, ...statItems, ...sportCards, ...featureCards, ...aboutItems], {
        opacity: 0,
        y: 32,
      });

      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .fromTo(
          heroRef.current,
          { opacity: 0, scale: 0.985 },
          { opacity: 1, scale: 1, duration: 0.8 }
        )
        .to(
          heroItems,
          { y: 0, opacity: 1, duration: 0.95, stagger: 0.12, clearProps: 'transform,opacity' },
          '-=0.45'
        );

      const revealGroups = [
        { nodes: statItems, y: 22 },
        { nodes: sportCards, y: 34 },
        { nodes: featureCards, y: 34 },
        { nodes: aboutItems, y: 28 },
      ];

      const observers = revealGroups
        .filter(({ nodes }) => nodes.length > 0)
        .map(({ nodes, y }) => {
          const observer = new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                gsap.to(nodes, {
                  opacity: 1,
                  y: 0,
                  duration: 0.85,
                  ease: 'power3.out',
                  stagger: 0.1,
                  clearProps: 'transform,opacity',
                });
                observer.disconnect();
              });
            },
            { threshold: 0.18, rootMargin: '0px 0px -10% 0px' }
          );

          const target = nodes[0]?.closest('section');
          if (target) {
            gsap.set(nodes, { y });
            observer.observe(target);
          }
          return observer;
        });

      return () => {
        observers.forEach((observer) => observer.disconnect());
      };
    });
    return () => ctx.revert();
  }, []);

  return (
    <main className="min-h-screen theme-bg theme-text overflow-x-hidden selection:bg-brand-lime selection:text-black font-sans">

      {/* ══════════════════════════════════════════
          NAVBAR
      ══════════════════════════════════════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 backdrop-blur-xl bg-light-base/70 dark:bg-[#0F0F1A]/70 border-b theme-border">
        <div className="flex items-center gap-3 cursor-default select-none">
          <div className="w-12 h-12 rounded-3xl theme-bg flex items-center justify-center overflow-hidden border theme-border shadow-sm">
            <img
              src="/images/logo.png"
              alt="Kore Manager Logo"
              width="48"
              height="48"
              className="w-full h-full object-contain p-2"
              style={{ filter: 'drop-shadow(0 0 10px rgba(204,255,0,.18)) drop-shadow(0 0 18px rgba(138,43,226,.10)) brightness(1.08)' }}
            />
          </div>
          <div className="text-2xl font-extrabold tracking-tighter theme-text">
            KORE<span className="text-brand-purple dark:text-brand-lime">MANAGER</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium theme-faint">
          <a href="#deportes" className="hover:theme-text transition-colors duration-200">{t('landing.nav.sports')}</a>
          <a href="#funciones" className="hover:theme-text transition-colors duration-200">{t('landing.nav.features')}</a>
          <a href="#sobre" className="hover:theme-text transition-colors duration-200">{t('landing.nav.about')}</a>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 theme-bg border theme-border rounded-full p-1 backdrop-blur-md">
            <button 
              onClick={() => i18n.changeLanguage('es')}
              className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${i18n.language === 'es' ? 'bg-brand-purple dark:bg-brand-lime text-white dark:text-black' : 'theme-faint hover:theme-text hover:bg-brand-purple/5 dark:hover:bg-white/5'}`}
            >
              ES
            </button>
            <button 
              onClick={() => i18n.changeLanguage('en')}
              className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${i18n.language === 'en' ? 'bg-brand-purple dark:bg-brand-lime text-white dark:text-black' : 'theme-faint hover:theme-text hover:bg-brand-purple/5 dark:hover:bg-white/5'}`}
            >
              EN
            </button>
          </div>

          <Link
            to="/login"
            className="px-4 md:px-6 py-2.5 rounded-full text-sm font-bold border theme-border theme-bg backdrop-blur-sm
            transition-all duration-300 ease-out
            hover:border-brand-purple dark:hover:border-brand-lime hover:text-brand-purple dark:hover:text-brand-lime hover:bg-brand-purple/5 dark:hover:bg-brand-lime/10 hover:shadow-lg hover:scale-105
            flex items-center gap-2"
            aria-label={t('landing.nav.loginBtn')}
          >
            <User size={18} className="md:hidden" aria-hidden="true" />
            <span className="hidden md:inline">{t('landing.nav.loginBtn')}</span>
          </Link>
        </div>
      </nav>

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <header
        ref={heroRef}
        className="relative min-h-[100dvh] flex flex-col justify-center px-6 pt-24 sm:pt-28 overflow-hidden bg-[#0A071B]"
      >
        {/* Imagen de fondo con brillo mejorado (filtro CSS brightness) */}
        <div
          className="absolute inset-0 bg-cover bg-no-repeat bg-[position:32%_center] md:bg-left lg:bg-[position:-120px_center] xl:bg-[position:-220px_center] brightness-125 pointer-events-none"
          style={{ backgroundImage: "url('/images/fondoHero.png')" }}
        />
        {/* Filtro morado oscuro exclusivo para móvil (responsive) */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1B0736]/85 via-[#0A071B]/90 to-[#0A071B] lg:hidden pointer-events-none" />

        {/* Gradiente de integración y contraste exclusivo para escritorio */}
        <div className="absolute inset-0 hidden lg:block bg-gradient-to-r from-[#0A071B]/20 via-[#0A071B]/50 to-[#0A071B]/95 pointer-events-none" />

        {/* Cuadrícula decorativa sutil */}
        <div
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)',
            backgroundSize: '80px 80px',
          }}
        />

        <div className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Espacio reservado a la izquierda en pantallas grandes para lucir la figura del corredor y su malla 3D */}
          <div className="hidden lg:block lg:col-span-6 xl:col-span-7 pointer-events-none" />

          {/* Bloque de texto y CTAs a la derecha */}
          <div className="lg:col-span-6 xl:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6 lg:pl-10">
            
            {/* Título principal */}
            <h1
              data-hero
              className="text-4xl sm:text-5xl md:text-6xl xl:text-7xl font-black text-white leading-[1.1] tracking-tight"
            >
              {t('landing.hero.title1')}<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-lime via-green-400 to-emerald-300">
                {t('landing.hero.title2')}
              </span>
            </h1>

            {/* Descripción */}
            <p
              data-hero
              className="text-gray-300 text-base sm:text-lg md:text-xl leading-relaxed max-w-2xl"
            >
              {t('landing.hero.desc')}
            </p>

            {/* CTAs */}
            <div
              data-hero
              className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto pt-2"
            >
              <Link
                to="/login"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-brand-lime text-black font-black flex items-center justify-center gap-3 transition-transform hover:scale-105 shadow-lg shadow-brand-lime/20"
              >
                {t('landing.hero.cta1')}
                <ArrowRight size={20} />
              </Link>

              <a
                href="#deportes"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl border border-white/20 text-white font-bold flex items-center justify-center gap-3 hover:bg-white/5 transition-colors backdrop-blur-sm"
              >
                {t('landing.hero.cta2')}
              </a>
            </div>

          </div>
        </div>

        {/* Indicador de scroll */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/50 text-xs animate-bounce pointer-events-none">
          <ChevronDown size={18} aria-hidden="true" />
        </div>
      </header>

      {/* ══════════════════════════════════════════
          STATS BAR
      ══════════════════════════════════════════ */}
      <section ref={statsRef} className="border-y theme-border theme-elevated">
        <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-px">
          {STATS.map((s, i) => (
            <div key={i} data-stat className="flex flex-col items-center gap-1 px-4 py-2">
              <span className="text-3xl md:text-4xl font-extrabold text-brand-purple dark:text-brand-lime tabular-nums">{s.value}</span>
              <span className="text-xs theme-faint uppercase tracking-wider font-medium">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CARRUSEL DE VÍDEOS
      ══════════════════════════════════════════ */}
      <section className="relative px-6 py-24 bg-[#0F0F1A] border-b border-white/5 overflow-hidden">
        <GlowOrb className="w-[500px] h-[500px] bg-brand-lime/5 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <SectionLabel>{t('landing.video.badge')}</SectionLabel>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight theme-text">
              {t('landing.video.title1')} <span className="text-brand-purple dark:text-brand-lime">{t('landing.video.title2')}</span>
            </h2>
          </div>
          <VideoCarousel3D />
        </div>
      </section>

      {/* ══════════════════════════════════════════
          DEPORTES
      ══════════════════════════════════════════ */}
      <section ref={sportsRef} id="deportes" className="relative px-6 py-32 bg-[#0F0F1A]">
        <GlowOrb className="w-[600px] h-[600px] bg-brand-purple/10 top-1/2 left-0 -translate-y-1/2" />

        <div className="max-w-7xl mx-auto relative z-10 px-8">
          <div className="flex flex-col md:flex-row gap-12 items-end justify-between mb-16">
            <div className="max-w-2xl">
              <SectionLabel>{t('landing.sports.badge')}</SectionLabel>
              <h2 className="text-4xl md:text-6xl font-black theme-text tracking-tight">
                {t('landing.sports.title')}
              </h2>
            </div>
            <p className="theme-faint max-w-md md:text-right">
              {t('landing.sports.desc')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SPORTS.map((sport) => (
              <div
                key={sport.name}
                data-sport
                className={`group relative p-8 rounded-3xl theme-card border theme-border overflow-hidden
                transition-all duration-400 hover:-translate-y-2 hover:shadow-2xl cursor-default`}
              >
                {/* Gradient de hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${sport.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                <div className="relative z-10">
                  {/* Icono + badge */}
                  <div className="flex items-start justify-between mb-6">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center border"
                      style={{ color: sport.accent, borderColor: `${sport.accent}25`, background: `${sport.accent}12` }}
                    >
                      <sport.icon size={28} />
                    </div>
                    <span
                      className="text-xs font-bold px-3 py-1 rounded-full border"
                      style={{ color: sport.accent, borderColor: `${sport.accent}30`, background: `${sport.accent}10` }}
                    >
                      {sport.courts}
                    </span>
                  </div>

                  <h3 className="text-2xl font-extrabold mb-3" style={{ color: sport.accent }}>{sport.name}</h3>
                  <p className="theme-faint text-sm leading-relaxed">{sport.description}</p>

                  <Link
                    to="/login"
                    className="mt-6 inline-flex items-center gap-2 text-sm font-bold transition-all duration-200 group/link"
                    style={{ color: sport.accent }}
                  >
                    {t('landing.sports.cta') || 'Reservar ahora'}
                    <ArrowRight size={14} className="group-hover/link:translate-x-1 transition-transform" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FUNCIONES
      ══════════════════════════════════════════ */}
      <section ref={featuresRef} id="funciones" className="relative px-6 py-32 bg-gradient-to-b from-brand-purple/5 dark:from-[#13131F] to-transparent dark:to-[#0F0F1A] border-t theme-border">
        <GlowOrb className="w-[500px] h-[500px] bg-brand-lime/8 top-1/2 right-0 -translate-y-1/2" />

        <div className="max-w-7xl mx-auto px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <SectionLabel>{t('landing.features.badge')}</SectionLabel>
            <h2 className="text-4xl md:text-5xl font-black theme-text tracking-tight mb-6">
              {t('landing.features.title')}
            </h2>
            <p className="theme-faint text-lg">
              {t('landing.features.desc')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon, title, desc, color, glow, border }) => {
              const Icon = icon;
              return (
                <div
                  key={title}
                  data-feature
                  className={`group relative p-7 rounded-3xl theme-card border theme-border
                  overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-default`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${glow} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                  <div className="relative z-10">
                    <div className={`w-12 h-12 rounded-2xl theme-bg flex items-center justify-center mb-5 ${color}
                    group-hover:scale-110 transition-transform duration-300 border theme-border`}>
                      <Icon size={22} />
                    </div>
                    <h3 className="text-lg font-bold theme-text mb-2">{title}</h3>
                    <p className="theme-faint text-sm leading-relaxed">{desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SOBRE NOSOTROS / CTA
      ══════════════════════════════════════════ */}
      <section ref={aboutRef} id="sobre" className="relative px-6 py-32 border-t theme-border theme-bg">
        <GlowOrb className="w-[800px] h-[800px] bg-brand-purple/15 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-8">
          <SectionLabel>{t('landing.about.badge')}</SectionLabel>

          <h2 data-about className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight theme-text">
            {t('landing.about.title2')}<br />
            <span className="text-brand-purple dark:text-brand-lime">{t('landing.about.title3')}</span>
          </h2>

          <p data-about className="theme-faint text-lg leading-relaxed">
            {t('landing.about.desc')}
          </p>

          {/* Testimonial placeholder */}
          <div data-about className="mt-4 p-6 rounded-2xl theme-card border theme-border text-left space-y-3 shadow-sm">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} className="text-brand-purple dark:text-brand-lime fill-brand-purple dark:fill-brand-lime" aria-hidden="true" />
              ))}
            </div>
            <p className="theme-text text-sm italic leading-relaxed">
              {t('landing.about.testimonial')}
            </p>
            <p className="text-xs theme-faint font-semibold uppercase tracking-wider">{t('landing.about.testimonialAuthor')}</p>
          </div>

          {/* CTA final */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/login"
              className="w-full sm:w-auto px-10 py-4 bg-brand-purple dark:bg-brand-lime text-white dark:text-black rounded-full font-bold text-base
              shadow-lg hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 group"
            >
              {t('landing.about.cta')}
              <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />

    </main>
  );
}
