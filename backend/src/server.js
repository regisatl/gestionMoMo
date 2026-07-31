require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/database');
const { initSocket } = require('./services/socketService');
const logger = require('./config/logger');
const seedSuperAdmin = require('./scripts/seedSuperAdmin');

const PORT = process.env.PORT || 5000;

// Connexion à MongoDB puis seed si nécessaire
connectDB().then(() => seedSuperAdmin());

// Création du serveur HTTP
const server = http.createServer(app);

// Initialisation de Socket.IO
initSocket(server);

server.listen(PORT, () => {
  logger.info(`🚀 Serveur démarré sur le port ${PORT} [${process.env.NODE_ENV}]`);
});

// Gestion des erreurs non capturées
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err.message);
  process.exit(1);
});
