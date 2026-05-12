import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import esTranslations from './locales/es.json';
import enTranslations from './locales/en.json';

const resources = {
  es: {
    translation: esTranslations
  },
  en: {
    translation: enTranslations
  }
};

const savedLanguage = localStorage.getItem('app_language') || 'es';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage, // Idioma inicial
    fallbackLng: 'es',  // Idioma de respaldo si falta alguna traducción
    interpolation: {
      escapeValue: false // React ya protege contra XSS
    }
  });

export default i18n;
