import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/**
 * Footer global reutilizable (marca + enlaces + copyright).
 * Se usa tanto en la landing como en el Layout autenticado.
 *
 * @returns {import('react').JSX.Element}
 */
export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t theme-border theme-sidebar px-8 py-14 transition-colors duration-300">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center md:items-start justify-between gap-10">
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-2xl font-extrabold tracking-tighter cursor-default">
            <div className="w-12 h-12 rounded-3xl bg-black dark:bg-[#0F0F1A] border theme-border flex items-center justify-center overflow-hidden">
              <img
                src="/images/logo.png"
                alt="Kore Manager"
                className="w-full h-full object-contain p-2 dark:drop-shadow-[0_0_10px_rgba(204,255,0,.14)] dark:brightness(1.06)"
              />
            </div>
            <div className="theme-text">
              KORE<span className="text-brand-purple dark:text-brand-lime">MANAGER</span>
            </div>
          </div>
          <p className="theme-faint text-sm max-w-xs">
            {t('footer.tagline')}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-16 gap-y-3 text-sm theme-faint">
          <a href="#deportes" className="hover:text-brand-purple dark:hover:text-brand-lime transition-colors duration-200">{t('footer.links.installations')}</a>
          <a href="#funciones" className="hover:text-brand-purple dark:hover:text-brand-lime transition-colors duration-200">{t('footer.links.features')}</a>
          <a href="#sobre"    className="hover:text-brand-purple dark:hover:text-brand-lime transition-colors duration-200">{t('footer.links.about')}</a>
          <Link to="/login"  className="hover:text-brand-purple dark:hover:text-brand-lime transition-colors duration-200">{t('footer.links.login')}</Link>
          <Link to="/legal/privacidad"   className="hover:text-brand-purple dark:hover:text-brand-lime transition-colors duration-200">{t('footer.links.privacy')}</Link>
          <Link to="/legal/terminos"     className="hover:text-brand-purple dark:hover:text-brand-lime transition-colors duration-200">{t('footer.links.terms')}</Link>
          <Link to="/legal/aviso-legal"  className="hover:text-brand-purple dark:hover:text-brand-lime transition-colors duration-200">{t('footer.links.legal')}</Link>
          <Link to="/legal/cookies"      className="hover:text-brand-purple dark:hover:text-brand-lime transition-colors duration-200">{t('footer.links.cookies')}</Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-12 pt-6 border-t theme-border flex items-center justify-center gap-3 text-xs theme-faint">
        <p>{t('footer.copyright')}</p>
      </div>
    </footer>
  );
}
