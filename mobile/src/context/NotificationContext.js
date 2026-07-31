import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { connectSocket, disconnectSocket, onEvent } from '../services/socketClient';
import api from '../services/api';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user, accessToken } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [toasts, setToasts]               = useState([]);

  // keep a stable ref so callbacks created once can always call the latest addToast
  const addToastRef = useRef(null);

  // ── Charger les notifications ────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await api.get('/notifications?limit=30');
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (_) {}
  }, [user]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // ── Socket.IO — notifications temps réel ────────────────────
  useEffect(() => {
    if (!accessToken) return;
    connectSocket(accessToken);

    const unsubNew = onEvent('notification:new', (notif) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((c) => c + 1);
      // affiche un toast pour la notification temps réel
      addToastRef.current?.({
        type:    notif.type || 'info',
        title:   notif.title,
        message: notif.message,
      });
    });

    return () => {
      unsubNew();
      disconnectSocket();
    };
  }, [accessToken]);

  // ── addToast — méthode principale ───────────────────────────
  /**
   * Affiche un toast.
   * @param {object} opts
   * @param {'success'|'error'|'warning'|'info'|'transaction'} opts.type
   * @param {string}  opts.title    — ligne principale (requise)
   * @param {string}  [opts.message] — ligne secondaire optionnelle
   * @param {number}  [opts.duration] — ms avant auto-dismiss (défaut 3500)
   */
  const addToast = useCallback(({ type = 'info', title, message, duration = 3500 }) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  // keep ref in sync
  useEffect(() => { addToastRef.current = addToast; }, [addToast]);

  // ── showToast — rétro-compatibilité (notifications socket) ──
  // (gardé pour ne pas casser le code existant)
  const showToast = useCallback((notif) => {
    addToast({
      type:    notif.type || 'info',
      title:   notif.title,
      message: notif.message,
    });
  }, [addToast]);

  // ── dismiss manuel ───────────────────────────────────────────
  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ── Actions notifications ────────────────────────────────────
  const markAsRead = async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (_) {}
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (_) {}
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        toasts,
        // méthodes toast
        addToast,
        showToast,   // rétro-compat
        dismissToast,
        // méthodes notifications
        markAsRead,
        markAllAsRead,
        fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};
