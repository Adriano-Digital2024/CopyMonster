import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Nota: Este arquivo foi restaurado para a versão original estável.
// As traduções do módulo Partners são injetadas via App.tsx para evitar corrupção.

const resources = {
  en: {
    translation: {
      date: { locale: 'en-US' },
      common: { save: 'Save', cancel: 'Cancel' }
    }
  },
  pt: {
    translation: {
      date: { locale: 'pt-BR' },
      common: { save: 'Salvar', cancel: 'Cancelar' }
    }
  },
  es: {
    translation: {
      date: { locale: 'es-ES' },
      common: { save: 'Guardar', cancel: 'Cancelar' }
    }
  }
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false }
});

export default i18n;
