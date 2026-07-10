import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enPartners from './locales/en/partners.json';
import ptPartners from './locales/pt/partners.json';
import esPartners from './locales/es/partners.json';

// Injected by Accio Work to fix hierarchy
const resources = {
  en: { translation: { ...enPartners } },
  pt: { translation: { ...ptPartners } },
  es: { translation: { ...esPartners } }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

export default i18n;
