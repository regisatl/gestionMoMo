import { io } from 'socket.io-client';

let socket = null;
const listeners = {};

export const connectSocket = (token) => {
  if (socket?.connected) return;
  socket = io('/', {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
  });
  socket.on('connect', () => console.log('[Socket] Connecté'));
  socket.on('disconnect', (r) => console.log('[Socket] Déconnecté:', r));
};

export const disconnectSocket = () => {
  if (socket) { socket.disconnect(); socket = null; }
};

export const onEvent = (event, cb) => {
  if (!listeners[event]) listeners[event] = [];
  listeners[event].push(cb);
  if (socket) socket.on(event, cb);
  return () => {
    listeners[event] = listeners[event].filter((fn) => fn !== cb);
    if (socket) socket.off(event, cb);
  };
};

export const emitEvent = (event, data) => {
  if (socket?.connected) socket.emit(event, data);
};
