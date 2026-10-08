import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import esTranslations from './locales/es.json';
import enTranslations from './locales/en.json';

const SUPPORTED = ['es', 'en'];
const STORAGE_KEY = 'app_language';

const resources = {
  es: { translation: esTranslations },
  en: { translation: enTranslations },
};

/**
 * Idioma inicial: preferencia guardada → idioma del navegador → español.
 * @returns {'es'|'en'}
 */
function detectLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED.includes(saved)) return saved;
  } catch { /* almacenamiento no disponible */ }
  const nav = (typeof navigator !== 'undefined' && navigator.language) || 'es';
  return nav.toLowerCase().startsWith('en') ? 'en' : 'es';
}

const initial = detectLanguage();

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initial,
    fallbackLng: 'es',
    supportedLngs: SUPPORTED,
    interpolation: {
      escapeValue: false, // React ya escapa el contenido
    },
  });

// Sincroniza <html lang> (accesibilidad y SEO) y persiste la elección del usuario.
const syncLang = (lng) => {
  if (typeof document !== 'undefined') document.documentElement.lang = lng;
  try { localStorage.setItem(STORAGE_KEY, lng); } catch { /* ignorar */ }
};
syncLang(initial);
i18n.on('languageChanged', syncLang);

export default i18n;
