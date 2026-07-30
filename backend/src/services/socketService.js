const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

let io;

// Map userId → Set de socket IDs (un user peut avoir plusieurs connexions)
const userSockets = new Map();

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [
        process.env.CLIENT_URL || 'http://localhost:3000',
        process.env.MOBILE_URL || 'exp://localhost:8081',
      ],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Middleware d'authentification Socket.IO
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('Token manquant'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      next(new Error('Token invalide'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    logger.info(`🔌 Socket connecté : ${userId} (socket: ${socket.id})`);

    // Enregistrement du socket pour cet utilisateur
    if (!userSockets.has(userId)) userSockets.set(userId, new Set());
    userSockets.get(userId).add(socket.id);

    // Rejoindre les rooms : room personnelle + room par rôle
    socket.join(`user:${userId}`);
    if (socket.userRole) socket.join(`role:${socket.userRole}`);

    socket.on('disconnect', () => {
      logger.info(`❌ Socket déconnecté : ${userId} (socket: ${socket.id})`);
      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) userSockets.delete(userId);
      }
    });

    // Ping/pong heartbeat
    socket.on('ping', () => socket.emit('pong'));
  });

  logger.info('✅ Socket.IO initialisé');
  return io;
};

/**
 * Émet un événement à un utilisateur spécifique (toutes ses connexions)
 */
const emitToUser = (userId, event, data) => {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
};

/**
 * Émet un événement à tous les utilisateurs d'un rôle
 */
const emitToRole = (role, event, data) => {
  if (!io) return;
  io.to(`role:${role}`).emit(event, data);
};

/**
 * Émet un événement à tous les connectés
 */
const emitToAll = (event, data) => {
  if (!io) return;
  io.emit(event, data);
};

/**
 * Retourne le nombre d'utilisateurs connectés
 */
const getConnectedCount = () => userSockets.size;

module.exports = { initSocket, emitToUser, emitToRole, emitToAll, getConnectedCount };
