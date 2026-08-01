import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restaure la session au démarrage
  useEffect(() => {
    const restore = async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          AsyncStorage.getItem('accessToken'),
          AsyncStorage.getItem('user'),
        ]);
        if (storedToken && storedUser) {
          setAccessToken(storedToken);
          setUser(JSON.parse(storedUser));
          api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        }
      } catch (_) {
      } finally {
        setIsLoading(false);
      }
    };
    restore();
  }, []);

  /**
   * Connexion par code PIN à 5 chiffres (mobile uniquement).
   * On envoie loginType: 'pin' pour que le backend vérifie pinHash
   * et non passwordHash.
   */
  const login = useCallback(async (phone, pin) => {
    const { data } = await api.post('/auth/login', { phone, pin, loginType: 'pin' });
    const { user: u, accessToken: token, refreshToken } = data;

    await Promise.all([
      AsyncStorage.setItem('accessToken', token),
      AsyncStorage.setItem('refreshToken', refreshToken),
      AsyncStorage.setItem('user', JSON.stringify(u)),
    ]);

    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setAccessToken(token);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (_) {}
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
    delete api.defaults.headers.common['Authorization'];
    setAccessToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates };
      AsyncStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, accessToken, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
