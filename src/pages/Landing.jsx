import { useTranslation } from 'react-i18next';
import Seo, { SITE_URL } from '../components/Seo';
import LandingNav from '../components/landing/LandingNav';
import Hero from '../components/landing/Hero';
import CourtScroll from '../components/landing/CourtScroll';
import SportPanels from '../components/landing/SportPanels';
import HowItWorks from '../components/landing/HowItWorks';
import FeatureBento from '../components/landing/FeatureBento';
import FinalCta from '../components/landing/FinalCta';
import VideoCarousel3D from '../components/ui/VideoCarousel3D';
import Footer from '../components/Footer';
import useSportsSummary from '../hooks/useSportsSummary';
import { describeSport } from '../lib/sports';
import './landing.css';

/**
 * Datos estructurados (schema.org) para buscadores.
 */
function StructuredData({ description }) {
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#org`,
        name: 'KoreManager',
        url: SITE_URL,
        logo: `${SITE_URL}/images/logo-384.png`,
      },
      {
        '@type': 'WebApplication',
        name: 'KoreManager',
        url: SITE_URL,
        applicationCategory: 'SportsApplication',
        operatingSystem: 'Web',
        description,
        inLanguage: ['es', 'en'],
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
        publisher: { '@id': `${SITE_URL}/#org` },
      },
    ],
  };
  return (
    <script
      type="application/ld+json"
      // Contenido estático generado por nosotros (no hay datos del usuario)
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * Landing pública.
 * Siempre en oscuro: es la identidad de marca (fondo #0F0F1A + lima + púrpura).
 *
 * @returns {import('react').JSX.Element}
 */
export default function Landing() {
  const { t } = useTranslation();
  // Deportes y pistas reales (los gestiona el administrador en la BD)
  const summary = useSportsSummary();
  const sports = summary.rows.map((row) => describeSport(row, t));

  return (
    <div className="landing min-h-screen bg-[#0F0F1A] text-white">
      <Seo title={t('seo.landingTitle')} description={t('seo.landingDesc')} path="/" />
      <StructuredData description={t('seo.landingDesc')} />

      <a href="#contenido" className="skip-link">{t('common.skip')}</a>
      <LandingNav />

      <main id="contenido" tabIndex={-1}>
        <Hero totalCourts={summary.total} />
        <div id="deportes"><SportPanels sports={sports} loading={summary.loading} /></div>
        <CourtScroll sports={sports} />
        <HowItWorks />
        <FeatureBento />

        <section aria-labelledby="video-title" className="relative overflow-hidden border-t border-white/10 bg-[#0F0F1A] px-5 sm:px-8 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl">
            <h2 id="video-title" className="mb-12 font-display text-5xl sm:text-7xl font-black uppercase leading-[0.9] text-white">
              {t('landing.video.title1')} {t('landing.video.title2')}
            </h2>
            <VideoCarousel3D />
          </div>
        </section>

        <FinalCta />
      </main>

      <Footer />
    </div>
  );
}
