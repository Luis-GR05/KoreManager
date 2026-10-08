import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowUp } from 'lucide-react';
import { Brand } from './landing/LandingNav';

/**
 * Footer de la landing: columnas de enlaces y la marca a toda anchura como cierre.
 *
 * @returns {import('react').JSX.Element}
 */
export default function Footer() {
  const { t } = useTranslation();
  const linkCls = 'text-white/60 transition-colors hover:text-brand-lime';

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-[#0B0B16] px-5 sm:px-8 pt-16">
      <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-12">
        <div className="md:col-span-5">
          <Brand />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/55">{t('footer.tagline')}</p>
        </div>

        <nav aria-label={t('footer.explore')} className="md:col-span-2">
          <h2 className="text-sm font-bold text-white">{t('footer.explore')}</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li><a href="#deportes" className={linkCls}>{t('footer.links.installations')}</a></li>
            <li><a href="#funciones" className={linkCls}>{t('footer.links.features')}</a></li>
            <li><a href="#sobre" className={linkCls}>{t('footer.links.about')}</a></li>
          </ul>
        </nav>

        <nav aria-label={t('footer.account')} className="md:col-span-2">
          <h2 className="text-sm font-bold text-white">{t('footer.account')}</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li><Link to="/login" className={linkCls}>{t('footer.links.login')}</Link></li>
            <li><Link to="/register" className={linkCls}>{t('footer.register')}</Link></li>
          </ul>
        </nav>

        <nav aria-label={t('footer.legalTitle')} className="md:col-span-3">
          <h2 className="text-sm font-bold text-white">{t('footer.legalTitle')}</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li><Link to="/legal/privacidad" className={linkCls}>{t('footer.links.privacy')}</Link></li>
            <li><Link to="/legal/terminos" className={linkCls}>{t('footer.links.terms')}</Link></li>
            <li><Link to="/legal/aviso-legal" className={linkCls}>{t('footer.links.legal')}</Link></li>
            <li><Link to="/legal/cookies" className={linkCls}>{t('footer.links.cookies')}</Link></li>
          </ul>
        </nav>
      </div>

      <div className="mx-auto mt-14 flex max-w-7xl items-center justify-between gap-4 border-t border-white/10 py-6 text-xs text-white/60">
        <p>{t('footer.copyright')}</p>
        <a href="#top" className="inline-flex items-center gap-2 text-white/60 hover:text-white">
          {t('common.backToTop')} <ArrowUp size={14} aria-hidden="true" />
        </a>
      </div>

      {/* Marca a toda anchura (decorativa) */}
      <p aria-hidden="true" className="footer__wordmark font-display font-black uppercase leading-[0.78] select-none">
        <span className="footer__wordmark-kore">Kore</span><span className="text-brand-lime">Manager</span>
      </p>
    </footer>
  );
}
