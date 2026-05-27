import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Cookie, X } from 'lucide-react';

/**
 * CookieConsent component that displays a beautiful, premium cookie banner
 * at the bottom of the screen if the user has not accepted/declined yet.
 * 
 * Supports light/dark themes and English/Spanish translations.
 */
export default function CookieConsent() {
  const { t } = useTranslation();
  const [shouldRender, setShouldRender] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already made a decision
    const consent = localStorage.getItem('kore_cookies_consent');
    if (!consent) {
      // Add a slight delay for a highly polished entrance feel
      const timer = setTimeout(() => {
        setShouldRender(true);
        // Trigger the transition
        setTimeout(() => setIsVisible(true), 50);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('kore_cookies_consent', 'accepted');
    setIsVisible(false);
    setTimeout(() => setShouldRender(false), 400); // Wait for transition out
  };

  const handleDecline = () => {
    localStorage.setItem('kore_cookies_consent', 'declined');
    setIsVisible(false);
    setTimeout(() => setShouldRender(false), 400);
  };

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed bottom-6 left-6 right-6 md:left-1/2 md:right-auto md:-translate-x-1/2 z-[9999] w-[calc(100%-3rem)] md:w-full md:max-w-3xl transition-all duration-500 ease-out ${
        isVisible
          ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
          : 'opacity-0 translate-y-8 scale-95 pointer-events-none'
      }`}
    >
      <div className="theme-card glow-purple dark:glow-lime p-5 md:p-6 flex flex-col md:flex-row gap-5 items-start md:items-center justify-between border theme-border relative overflow-hidden bg-cueva-gradient">
        {/* Glow decorative orbs in background */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-purple/5 dark:bg-brand-lime/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex gap-4 items-start flex-1 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-brand-purple/10 dark:bg-brand-lime/10 flex items-center justify-center flex-shrink-0 border border-brand-purple/20 dark:border-brand-lime/20">
            <Cookie className="w-6 h-6 text-brand-purple dark:text-brand-lime animate-pulse" />
          </div>
          
          <div className="space-y-1.5">
            <h3 className="text-base font-black tracking-tight theme-text flex items-center gap-2">
              {t('cookieConsent.title')}
            </h3>
            <p className="text-xs md:text-sm theme-muted leading-relaxed max-w-xl">
              {t('cookieConsent.message')}{' '}
              <Link
                to="/legal/cookies"
                className="text-brand-purple dark:text-brand-lime font-bold hover:underline inline-flex items-center gap-0.5"
              >
                {t('cookieConsent.info')}
              </Link>
            </p>
          </div>
        </div>

        <div className="flex flex-row md:flex-col lg:flex-row gap-3 w-full md:w-auto relative z-10 justify-end items-stretch md:items-center">
          <button
            onClick={handleDecline}
            className="px-4 py-2.5 rounded-xl text-xs font-bold border theme-border theme-text hover:bg-neutral-100 dark:hover:bg-white/5 transition-all duration-200 cursor-pointer flex-1 md:flex-none text-center"
          >
            {t('cookieConsent.decline')}
          </button>
          
          <button
            onClick={handleAccept}
            className="px-5 py-2.5 rounded-xl text-xs font-black bg-brand-purple hover:bg-brand-purple/90 dark:bg-brand-lime dark:text-black dark:hover:bg-brand-lime/90 text-white shadow-lg transition-all duration-200 cursor-pointer flex-1 md:flex-none text-center hover:scale-[1.02] active:scale-[0.98]"
          >
            {t('cookieConsent.accept')}
          </button>
        </div>

        {/* Small X button to dismiss or standard accept/decline */}
        <button
          onClick={handleDecline}
          className="absolute top-3 right-3 text-neutral-400 hover:text-neutral-600 dark:hover:text-white transition-colors duration-200 cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
