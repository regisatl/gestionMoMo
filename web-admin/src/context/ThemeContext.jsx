import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

/**
 * ThemeContext — GestionMoMo
 *
 * Modes disponibles :
 *   'system' — suit automatiquement prefers-color-scheme du système
 *   'light'  — toujours clair
 *   'dark'   — toujours sombre
 *
 * Le localStorage stocke 'system' | 'light' | 'dark'.
 * Si aucune valeur n'est enregistrée → défaut 'system'.
 */

const ThemeContext = createContext(null);

const getSystemDark = () =>
  window.matchMedia('(prefers-color-scheme: dark)').matches;

const applyTheme = (isDark) => {
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
};

export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('themeMode') || 'system';
  });

  // isDark dérivé du mode + état système
  const [systemDark, setSystemDark] = useState(getSystemDark);

  const isDark =
    themeMode === 'dark' ? true :
    themeMode === 'light' ? false :
    systemDark; // 'system'

  // Applique le thème sur le DOM à chaque changement
  useEffect(() => {
    applyTheme(isDark);
  }, [isDark]);

  // Persiste le mode choisi
  useEffect(() => {
    localStorage.setItem('themeMode', themeMode);
  }, [themeMode]);

  // Écoute les changements du système en temps réel
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setSystemDark(e.matches);
    // Modern API
    if (mq.addEventListener) {
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
    // Fallback anciens navigateurs
    mq.addListener(handler);
    return () => mq.removeListener(handler);
  }, []);

  /** Bascule simple clair ↔ sombre (utilisé par le bouton header) */
  const toggleTheme = useCallback(() => {
    setThemeMode((prev) => {
      if (prev === 'system') return isDark ? 'light' : 'dark';
      return prev === 'dark' ? 'light' : 'dark';
    });
  }, [isDark]);

  /** Sélection explicite d'un mode */
  const setTheme = useCallback((mode) => {
    if (['system', 'light', 'dark'].includes(mode)) {
      setThemeMode(mode);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ isDark, themeMode, toggleTheme, setTheme, systemDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
