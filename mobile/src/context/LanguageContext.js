import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n, { SUPPORTED_LANGUAGES, deviceLanguage } from '../i18n';

const LANG_STORAGE_KEY = 'appLanguage';

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  // Langue active : préférence utilisateur sauvegardée, sinon langue de l'appareil
  const [language, setLanguage] = useState(deviceLanguage);
  const [isReady, setIsReady] = useState(false);

  // Restaurer la langue sauvegardée au démarrage
  useEffect(() => {
    AsyncStorage.getItem(LANG_STORAGE_KEY).then((saved) => {
      const lang = SUPPORTED_LANGUAGES.includes(saved) ? saved : deviceLanguage;
      setLanguage(lang);
      i18n.changeLanguage(lang);
    }).finally(() => {
      setIsReady(true);
    });
  }, []);

  const changeLanguage = useCallback(async (lang) => {
    if (!SUPPORTED_LANGUAGES.includes(lang)) return;
    await AsyncStorage.setItem(LANG_STORAGE_KEY, lang);
    await i18n.changeLanguage(lang);
    setLanguage(lang);
  }, []);

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, isReady, supportedLanguages: SUPPORTED_LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};
