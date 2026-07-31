import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import i18n, { SUPPORTED_LANGUAGES } from '../i18n';

/**
 * LanguageContext — GestionMoMo
 *
 * Modes disponibles :
 *   'system' — suit automatiquement la langue du navigateur/système
 *   'fr'     — toujours français
 *   'en'     — toujours anglais
 *
 * localStorage stocke 'system' | 'fr' | 'en' sous la clé 'langMode'.
 * Si aucune valeur → défaut 'system'.
 */

const LANG_STORAGE_KEY = 'langMode';

const LanguageContext = createContext(null);

/** Résout la langue du navigateur → 'fr' | 'en' (fallback 'fr') */
const getSystemLanguage = () => {
  const nav = navigator.language || navigator.languages?.[0] || 'fr';
  const lang = nav.split(/[-_]/)[0].toLowerCase();
  return SUPPORTED_LANGUAGES.includes(lang) ? lang : 'fr';
};

export const LanguageProvider = ({ children }) => {
  const [langMode, setLangMode] = useState(() => {
    return localStorage.getItem(LANG_STORAGE_KEY) || 'system';
  });

  const [systemLang, setSystemLang] = useState(getSystemLanguage);

  /** Langue effective selon le mode */
  const language = langMode === 'system' ? systemLang : langMode;

  // Applique la langue i18n à chaque changement
  useEffect(() => {
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language]);

  // Persiste le mode choisi
  useEffect(() => {
    localStorage.setItem(LANG_STORAGE_KEY, langMode);
  }, [langMode]);

  // Écoute les changements de langue système en temps réel
  useEffect(() => {
    const handler = () => setSystemLang(getSystemLanguage());
    window.addEventListener('languagechange', handler);
    return () => window.removeEventListener('languagechange', handler);
  }, []);

  /** Changement explicite d'une langue (ou 'system') */
  const changeLanguage = useCallback((lang) => {
    if (lang === 'system' || SUPPORTED_LANGUAGES.includes(lang)) {
      setLangMode(lang);
    }
  }, []);

  return (
    <LanguageContext.Provider value={{
      language,
      langMode,
      changeLanguage,
      supportedLanguages: SUPPORTED_LANGUAGES,
      systemLang,
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};
