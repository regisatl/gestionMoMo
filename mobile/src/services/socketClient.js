import { io } from 'socket.io-client';

const SOCKET_URL = __DEV__
  ? 'http://10.0.2.2:5000'
  : 'https://api.gestionmomo.com';

let socket = null;
const listeners = {};

export const connectSocket = (token) => {
  if (socket?.connected) return;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  socket.on('connect', () => console.log('[Socket] Connecté'));
  socket.on('disconnect', (reason) => console.log('[Socket] Déconnecté:', reason));
  socket.on('connect_error', (err) => console.warn('[Socket] Erreur:', err.message));

  // Réabonnement aux listeners après reconnexion
  socket.on('connect', () => {
    Object.entries(listeners).forEach(([event, cbs]) => {
      cbs.forEach((cb) => socket.on(event, cb));
    });
  });
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * S'abonne à un événement Socket.IO
 * Retourne une fonction de désabonnement
 */
export const onEvent = (event, callback) => {
  if (!listeners[event]) listeners[event] = [];
  listeners[event].push(callback);
  if (socket) socket.on(event, callback);

  return () => {
    listeners[event] = listeners[event].filter((cb) => cb !== callback);
    if (socket) socket.off(event, callback);
  };
};

export const emitEvent = (event, data) => {
  if (socket?.connected) socket.emit(event, data);
};

export const getSocket = () => socket;
