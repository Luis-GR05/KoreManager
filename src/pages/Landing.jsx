import { useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Calendar, Users, Shield, Star, Clock, ChevronDown, User } from 'lucide-react';
import { GiPingPongBat, GiSoccerBall, GiTennisRacket } from 'react-icons/gi';
import gsap from 'gsap';
import Footer from '../components/Footer';
import VideoCarousel3D from '../components/ui/VideoCarousel3D';

/**
 * Dataset de deportes mostrado en la landing.
 * @type {Array<{name: string, icon: any, courts: string, accent: string, bg: string, border: string, description: string}>}
 */
const SPORTS = [
  {
    name: 'Pádel',
    icon: GiPingPongBat,
    courts: '6 pistas',
    accent: '#CCFF00',
    bg: 'from-[#CCFF00]/10 to-transparent',
    border: 'border-[#CCFF00]/20',
    description: 'Pistas cubiertas y descubiertas con iluminación LED profesional.',
  },
  {
    name: 'Fútbol Sala',
    icon: GiSoccerBall,
    courts: '3 campos',
    accent: '#8A2BE2',
    bg: 'from-[#8A2BE2]/10 to-transparent',
    border: 'border-[#8A2BE2]/20',
    description: 'Campos de resina con marcaje oficial y cabinas de arbitraje.',
  },
  {
    name: 'Tenis',
    icon: GiTennisRacket,
    courts: '4 pistas',
    accent: '#007AFF',
    bg: 'from-[#007AFF]/10 to-transparent',
    border: 'border-[#007AFF]/20',
    description: 'Superficie de tierra batida y pista dura certificada.',
  },
];

/**
 * Estadísticas de marketing mostradas en la landing.
 * @type {Array<{value: string, label: string}>}
 */
const STATS = [
  { value: '500+', label: 'Socios activos' },
  { value: '13', label: 'Instalaciones' },
  { value: '24/7', label: 'Disponibilidad' },
  { value: '< 30s', label: 'Para reservar' },
];

/**
 * Feature cards de la landing.
 * @type {Array<{icon: any, title: string, desc: string, color: string, glow: string, border: string}>}
 */
const FEATURES = [
  {
    icon: Calendar,
    title: 'Reservas en tiempo real',
    desc: 'Consulta el calendario en vivo y asegura tu pista sin esperas ni llamadas.',
    color: 'text-brand-lime',
    glow: 'from-brand-lime/10',
    border: 'group-hover:border-brand-lime/30',
  },
  {
    icon: Zap,
    title: 'Confirmación instantánea',
    desc: 'Recibe la confirmación al instante y el recordatorio antes de tu cita.',
    color: 'text-brand-purple',
    glow: 'from-brand-purple/10',
    border: 'group-hover:border-brand-purple/30',
  },
  {
    icon: Users,
    title: 'Gestión de equipos',
    desc: 'Organiza ligas, torneos y partidos privados con tu grupo de amigos.',
    color: 'text-blue-400',
    glow: 'from-blue-500/10',
    border: 'group-hover:border-blue-400/30',
  },
  {
    icon: Clock,
    title: 'Historial deportivo',
    desc: 'Accede a todas tus reservas pasadas y lleva el control de tus horas en pista.',
    color: 'text-emerald-400',
    glow: 'from-emerald-500/10',
    border: 'group-hover:border-emerald-400/30',
  },
  {
    icon: Shield,
    title: 'Acceso seguro',
    desc: 'Identifícate con tu cuenta personal protegida y datos siempre encriptados.',
    color: 'text-orange-400',
    glow: 'from-orange-500/10',
    border: 'group-hover:border-orange-400/30',
  },
  {
    icon: Star,
    title: 'Novedades y ofertas',
    desc: 'Recibe alertas del ayuntamiento sobre actividades, torneos y promociones.',
    color: 'text-yellow-400',
    glow: 'from-yellow-500/10',
    border: 'group-hover:border-yellow-400/30',
  },
];

/**
 * Etiqueta de sección (texto pequeño en mayúsculas).
 * @param {{children: import('react').ReactNode}} props
 * @returns {import('react').JSX.Element}
 */
function SectionLabel({ children }) {
  return (
    <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-lime/70 mb-4">
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
  const heroRef = useRef(null);
  const statsRef = useRef(null);
  const sportsRef = useRef(null);
  const featuresRef = useRef(null);
  const aboutRef = useRef(null);

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
    <main className="min-h-screen bg-[#0F0F1A] text-white overflow-x-hidden selection:bg-brand-lime selection:text-black font-sans">

      {/* ══════════════════════════════════════════
          NAVBAR
      ══════════════════════════════════════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 backdrop-blur-xl bg-[#0F0F1A]/70 border-b border-white/5">
        <div className="flex items-center gap-3 cursor-default select-none">
          <div className="w-12 h-12 rounded-3xl bg-[#0F0F1A] flex items-center justify-center overflow-hidden">
            <img
              src="/images/logo.png"
              alt="Kore Manager Logo"
              width="48"
              height="48"
              className="w-full h-full object-contain p-2"
              style={{ filter: 'drop-shadow(0 0 10px rgba(204,255,0,.18)) drop-shadow(0 0 18px rgba(138,43,226,.10)) brightness(1.08)' }}
            />
          </div>
          <div className="text-2xl font-extrabold tracking-tighter">
            KORE<span className="text-brand-lime">MANAGER</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
          <a href="#deportes" className="hover:text-white transition-colors duration-200">Deportes</a>
          <a href="#funciones" className="hover:text-white transition-colors duration-200">Funciones</a>
          <a href="#sobre" className="hover:text-white transition-colors duration-200">Sobre nosotros</a>
        </div>

        <Link
          to="/login"
          className="px-4 md:px-6 py-2.5 rounded-full text-sm font-bold border border-white/20 bg-white/5 backdrop-blur-sm
          transition-all duration-300 ease-out
          hover:border-brand-lime hover:text-brand-lime hover:bg-brand-lime/10 hover:shadow-[0_0_20px_rgba(204,255,0,0.35)] hover:scale-105
          flex items-center gap-2"
          aria-label="Acceso Usuarios"
        >
          <User size={18} className="md:hidden" aria-hidden="true" />
          <span className="hidden md:inline">Acceso Usuarios</span>
        </Link>
      </nav>

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <header ref={heroRef} className="relative min-h-[100dvh] flex flex-col items-center justify-center text-center px-6 pt-24 sm:pt-20">

        {/* Orbes de fondo */}
        <GlowOrb className="w-[700px] h-[700px] bg-brand-purple/20 top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        <GlowOrb className="w-[400px] h-[400px] bg-brand-lime/8 bottom-1/4 right-1/4" />

        {/* Cuadrícula decorativa */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '80px 80px',
          }}
        />

        <div className="relative z-10 max-w-5xl mx-auto space-y-8">

          {/* Badge */}
          <div data-hero className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-lime/5 border border-brand-lime/20 text-brand-lime text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-brand-lime animate-pulse" />
            Sistema v1.4 — Ya disponible
          </div>

          {/* Título principal */}
          <h1 data-hero className="text-5xl sm:text-6xl md:text-8xl font-extrabold tracking-tight leading-[1.05]">
            El deporte<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-lime via-emerald-400 to-brand-lime drop-shadow-lg bg-[length:200%] animate-[shimmer_3s_linear_infinite]">
              ahora es digital.
            </span>
          </h1>

          <p data-hero className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Olvídate de las llamadas y el papel. Reserva pistas de pádel, fútbol y tenis
            en segundos desde cualquier dispositivo.
          </p>

          {/* CTAs */}
          <div data-hero className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-4 bg-brand-lime text-black rounded-full font-bold text-base
              shadow-[0_0_20px_rgba(204,255,0,0.35)]
              hover:scale-105 hover:shadow-[0_0_40px_rgba(204,255,0,0.6)]
              transition-all duration-300 flex items-center justify-center gap-2 group"
            >
              Reservar pista ahora
              <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} aria-hidden="true" />
            </Link>

            <a
              href="#deportes"
              className="w-full sm:w-auto px-8 py-4 bg-transparent border border-white/15 text-white rounded-full font-bold text-base
              hover:bg-white/5 hover:border-white/30 transition-all duration-300 flex items-center justify-center gap-2"
            >
              Ver instalaciones
            </a>
          </div>

          {/* Scroll hint */}
          <div className="pt-12 flex flex-col items-center gap-2 text-gray-600 text-xs animate-bounce">
            <ChevronDown size={18} aria-hidden="true" />
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════
          STATS BAR
      ══════════════════════════════════════════ */}
      <section ref={statsRef} className="border-y border-white/5 bg-[#13131F]">
        <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-px">
          {STATS.map((s, i) => (
            <div key={i} data-stat className="flex flex-col items-center gap-1 px-4 py-2">
              <span className="text-3xl md:text-4xl font-extrabold text-brand-lime tabular-nums">{s.value}</span>
              <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">{s.label}</span>
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
            <SectionLabel>En Acción</SectionLabel>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              ¿Por qué <span className="text-brand-lime">KoreManager?</span>
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

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <SectionLabel>Instalaciones</SectionLabel>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              Todos tus deportes,<br />
              <span className="text-brand-lime">un solo lugar.</span>
            </h2>
            <p className="mt-4 text-gray-400 max-w-xl mx-auto">
              Un complejo deportivo completo al alcance de tu mano. Elige tu deporte y comienza a jugar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SPORTS.map((sport) => (
              <div
                key={sport.name}
                data-sport
                className={`group relative p-8 rounded-3xl bg-[#1A1A2E] border border-white/5 ${sport.border} overflow-hidden
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
                  <p className="text-gray-400 text-sm leading-relaxed">{sport.description}</p>

                  <Link
                    to="/login"
                    className="mt-6 inline-flex items-center gap-2 text-sm font-bold transition-all duration-200 group/link"
                    style={{ color: sport.accent }}
                  >
                    Reservar ahora
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
      <section ref={featuresRef} id="funciones" className="relative px-6 py-32 bg-gradient-to-b from-[#13131F] to-[#0F0F1A] border-t border-white/5">
        <GlowOrb className="w-[500px] h-[500px] bg-brand-lime/8 top-1/2 right-0 -translate-y-1/2" />

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <SectionLabel>¿Por qué KoreManager?</SectionLabel>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              Todo lo que necesitas,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-lime to-emerald-400">nada más.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon, title, desc, color, glow, border }) => {
              const Icon = icon;
              return (
                <div
                  key={title}
                  data-feature
                  className={`group relative p-7 rounded-3xl bg-[#1A1A2E] border border-white/5 ${border}
                  overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-default`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${glow} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                  <div className="relative z-10">
                    <div className={`w-12 h-12 rounded-2xl bg-[#252538] flex items-center justify-center mb-5 ${color}
                    group-hover:scale-110 transition-transform duration-300 border border-white/5 ${border}`}>
                      <Icon size={22} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
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
      <section ref={aboutRef} id="sobre" className="relative px-6 py-32 border-t border-white/5 bg-[#0F0F1A]">
        <GlowOrb className="w-[800px] h-[800px] bg-brand-purple/15 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-8">
          <SectionLabel>Sobre el proyecto</SectionLabel>

          <h2 data-about className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
            Creado para modernizar<br />
            <span className="text-brand-lime">la gestión deportiva local.</span>
          </h2>

          <p data-about className="text-gray-400 text-lg leading-relaxed">
            KoreManager nació como un Trabajo de Fin de Grado con un objetivo claro: digitalizar
            la reserva de instalaciones municipales. Adiós a las colas, los papeles y las llamadas.
            Hola a la eficiencia, la transparencia y el deporte sin barreras.
          </p>

          {/* Testimonial placeholder */}
          <div data-about className="mt-4 p-6 rounded-2xl bg-[#1A1A2E] border border-white/8 text-left space-y-3">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} className="text-brand-lime fill-brand-lime" aria-hidden="true" />
              ))}
            </div>
            <p className="text-gray-300 text-sm italic leading-relaxed">
              "Antes tardaba 15 minutos en reservar una pista por teléfono. Con KoreManager lo hago
              en 30 segundos desde el móvil. Es un antes y un después."
            </p>
            <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider">— Socio del Club, Sevilla</p>
          </div>

          {/* CTA final */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/login"
              className="w-full sm:w-auto px-10 py-4 bg-brand-lime text-black rounded-full font-bold text-base
              shadow-[0_0_20px_rgba(204,255,0,0.35)]
              hover:scale-105 hover:shadow-[0_0_40px_rgba(204,255,0,0.65)]
              transition-all duration-300 flex items-center justify-center gap-2 group"
            >
              Empezar gratis
              <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />

    </main>
  );
}