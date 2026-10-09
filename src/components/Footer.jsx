import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight } from 'lucide-react';
import { Brand, LangSwitch } from './landing/LandingNav';
import useInView from '../hooks/useInView';

const PORTFOLIO_URL = 'https://luis-portfolio-pi.vercel.app/';

/**
 * Footer con forma de pista de pádel vista desde arriba:
 * fondo de pista (marca) · cuadros de saque (enlaces) · red · cuadros de saque
 * (legal e idioma) · fondo de pista (llamada a la acción). Los cristales
 * laterales son púrpura, como en la sección de deportes. En móvil la pista
 * se gira en vertical. Las líneas se "pintan" al entrar en pantalla.
 *
 * @returns {import('react').JSX.Element}
 */
export default function Footer() {
  const { t } = useTranslation();
  const [ref, inView] = useInView({ threshold: 0.15 }) // se observa el <footer>: el clip-path inicial de la pista anula su intersección;
  const linkCls = 'text-white/70 transition-colors hover:text-brand-lime';

  return (
    <footer ref={ref} className="relative bg-[#0B0B16] px-5 sm:px-8 pt-20 pb-10">
      <div className={`fcourt mx-auto max-w-7xl ${inView ? 'is-in' : ''}`}>
        {/* Fondo de pista izquierdo: marca */}
        <div className="fcourt__back fcourt__back--left">
          <Brand />
          <p className="mt-4 max-w-[16rem] text-sm leading-relaxed text-white/60">{t('footer.tagline')}</p>
        </div>

        {/* Cuadros de saque izquierdos */}
        <nav aria-label={t('footer.explore')} className="fcourt__box fcourt__box--tl">
          <h2 className="fcourt__label">{t('footer.explore')}</h2>
          <ul className="space-y-2.5 text-sm">
            <li><a href="#deportes" className={linkCls}>{t('footer.links.installations')}</a></li>
            <li><a href="#funciones" className={linkCls}>{t('footer.links.features')}</a></li>
            <li><a href="#sobre" className={linkCls}>{t('footer.links.about')}</a></li>
          </ul>
        </nav>
        <nav aria-label={t('footer.account')} className="fcourt__box fcourt__box--bl">
          <h2 className="fcourt__label">{t('footer.account')}</h2>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/login" className={linkCls}>{t('footer.links.login')}</Link></li>
            <li><Link to="/register" className={linkCls}>{t('footer.register')}</Link></li>
          </ul>
        </nav>

        {/* Red */}
        <span className="fcourt__net" aria-hidden="true" />

        {/* Cuadros de saque derechos */}
        <nav aria-label={t('footer.legalTitle')} className="fcourt__box fcourt__box--tr">
          <h2 className="fcourt__label">{t('footer.legalTitle')}</h2>
          <ul className="grid grid-cols-1 gap-2.5 text-sm xl:grid-cols-2 xl:gap-x-6">
            <li><Link to="/legal/privacidad" className={linkCls}>{t('footer.links.privacy')}</Link></li>
            <li><Link to="/legal/terminos" className={linkCls}>{t('footer.links.terms')}</Link></li>
            <li><Link to="/legal/aviso-legal" className={linkCls}>{t('footer.links.legal')}</Link></li>
            <li><Link to="/legal/cookies" className={linkCls}>{t('footer.links.cookies')}</Link></li>
          </ul>
        </nav>
        <div className="fcourt__box fcourt__box--br">
          <h2 className="fcourt__label">{t('common.language')}</h2>
          <LangSwitch className="w-max" />
        </div>

        {/* Fondo de pista derecho: llamada a la acción */}
        <div className="fcourt__back fcourt__back--right">
          <p className="font-display text-5xl font-black uppercase leading-[0.85] text-white">{t('footer.play')}</p>
          <p className="mt-3 text-sm text-white/60">{t('footer.playDesc')}</p>
          <Link to="/register" className="btn-lime mt-5 inline-flex h-11 w-max items-center rounded-full px-6 text-sm font-bold">
            {t('footer.register')}
          </Link>
        </div>
      </div>

      <div className="mx-auto mt-8 flex max-w-7xl flex-col gap-2 pr-20 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
        <p>
          {t('footer.copyright')}
          <span className="mx-2 opacity-50" aria-hidden="true">/</span>
          <a href="https://unsplash.com/?utm_source=koremanager&utm_medium=referral" target="_blank" rel="noopener noreferrer" className="hover:text-white">
            {t('footer.photos')}<span className="sr-only"> {t('footer.newTab')}</span>
          </a>
        </p>
        <p>
          {t('footer.devBy')}{' '}
          <a href={PORTFOLIO_URL} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-1 font-semibold text-white underline-offset-4 hover:text-brand-lime hover:underline">
            Luis Gordillo
            <ArrowUpRight size={14} aria-hidden="true" className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            <span className="sr-only"> {t('footer.portfolio')} {t('footer.newTab')}</span>
          </a>
        </p>
      </div>
    </footer>
  );
}
