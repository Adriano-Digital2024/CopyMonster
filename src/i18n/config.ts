import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Base App Translations
import enApp from './locales/en/app.json';
import ptApp from './locales/pt/app.json';
import esApp from './locales/es/app.json';

// Partners Module
import enPartners from './locales/en/partners.json';
import ptPartners from './locales/pt/partners.json';
import esPartners from './locales/es/partners.json';

const resources = {
  en: {
    translation: {
      ...enApp,
      ...enPartners
    },
  },
  pt: {
    translation: {
      ...ptApp,
      ...ptPartners
    },
  },
  es: {
    translation: {
      ...esApp,
      ...esPartners
    },
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
