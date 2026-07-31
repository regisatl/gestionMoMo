import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { NativeModules, Platform } from 'react-native';

import fr from './fr';
import en from './en';

// Détection de la langue système sur React Native (sans expo-localization)
const getDeviceLanguage = () => {
  try {
    // iOS : AppleLocale / AppleLanguages
    // Android : locale
    const locale =
      Platform.OS === 'ios'
        ? NativeModules.SettingsManager?.settings?.AppleLocale ||
          NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] ||
          'fr'
        : NativeModules.I18nManager?.localeIdentifier || 'fr';

    // Extraire le code de langue (ex. "fr_FR" → "fr", "en_US" → "en")
    const lang = locale.split(/[-_]/)[0].toLowerCase();
    return ['fr', 'en'].includes(lang) ? lang : 'fr';
  } catch (_) {
    return 'fr';
  }
};

export const SUPPORTED_LANGUAGES = ['fr', 'en'];
export const deviceLanguage = getDeviceLanguage();

i18n
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
    },
    lng: deviceLanguage,       // langue détectée au démarrage
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false,      // React échappe déjà les valeurs
    },
    compatibilityJSON: 'v3',   // nécessaire pour React Native
  });

export default i18n;
