import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Modular Partners Translations
import enPartners from './locales/en/partners.json';
import ptPartners from './locales/pt/partners.json';
import esPartners from './locales/es/partners.json';

const resources = {
  en: {
    translation: {
      ...enPartners,
      nav: { dashboard: "Dashboard" },
      dashboard: { menu: { billing: "Billing", settings: "Settings" } }
    },
  },
  pt: {
    translation: {
      ...ptPartners,
      nav: { dashboard: "Painel" },
      dashboard: { menu: { billing: "Faturamento", settings: "Configurações" } }
    },
  },
  es: {
    translation: {
      ...esPartners,
      nav: { dashboard: "Panel" },
      dashboard: { menu: { billing: "Facturación", settings: "Configuración" } }
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
