import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import i18n, { SUPPORTED_LANGUAGES, deviceLanguage } from '../i18n';

const LANG_STORAGE_KEY = 'appLanguage';

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  // Préférence sauvegardée → sinon langue du navigateur
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    return SUPPORTED_LANGUAGES.includes(saved) ? saved : deviceLanguage;
  });

  // Synchroniser i18n dès le montage (au cas où la langue restaurée diffère de l'init)
  useEffect(() => {
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const changeLanguage = useCallback((lang) => {
    if (!SUPPORTED_LANGUAGES.includes(lang)) return;
    localStorage.setItem(LANG_STORAGE_KEY, lang);
    i18n.changeLanguage(lang);
    setLanguage(lang);
  }, []);

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, supportedLanguages: SUPPORTED_LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};
