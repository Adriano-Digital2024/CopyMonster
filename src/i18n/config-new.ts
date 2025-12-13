import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import enCommon from './locales/en/common.json';
import enDashboard from './locales/en/dashboard.json';
import enAdmin from './locales/en/admin.json';

import ptCommon from './locales/pt/common.json';
import ptDashboard from './locales/pt/dashboard.json';
import ptAdmin from './locales/pt/admin.json';

import esCommon from './locales/es/common.json';
import esDashboard from './locales/es/dashboard.json';
import esAdmin from './locales/es/admin.json';

// Merge translations
const resources = {
  en: {
    translation: {
      ...enCommon,
      ...enDashboard,
      ...enAdmin,
    },
  },
  pt: {
    translation: {
      ...ptCommon,
      ...ptDashboard,
      ...ptAdmin,
    },
  },
  es: {
    translation: {
      ...esCommon,
      ...esDashboard,
      ...esAdmin,
    },
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'pt',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
