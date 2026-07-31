import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import fr from './fr';
import en from './en';

const SUPPORTED_LANGUAGES = ['fr', 'en'];

// Détection de la langue du navigateur
const getBrowserLanguage = () => {
  const nav = navigator.language || navigator.userLanguage || 'fr';
  // "fr-FR" → "fr", "en-US" → "en"
  const lang = nav.split(/[-_]/)[0].toLowerCase();
  return SUPPORTED_LANGUAGES.includes(lang) ? lang : 'fr';
};

export const deviceLanguage = getBrowserLanguage();
export { SUPPORTED_LANGUAGES };

i18n
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
    },
    lng: deviceLanguage,
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false, // React échappe déjà
    },
  });

export default i18n;
