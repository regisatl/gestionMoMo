require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/database');
const { initSocket } = require('./services/socketService');
const logger = require('./config/logger');
const seedSuperAdmin = require('./scripts/seedSuperAdmin');

const PORT = process.env.PORT || 5000;

// Création du serveur HTTP
const server = http.createServer(app);

// Initialisation de Socket.IO
initSocket(server);

// Démarrage
const start = async () => {
  // 1. Connexion MongoDB
  await connectDB();

  // 2. Seed super admin si absent
  await seedSuperAdmin();

  // 3. Écoute
  server.listen(PORT, () => {
    logger.info(`  Serveur démarré sur le port ${PORT} [${process.env.NODE_ENV}]`);
  });
};

start().catch((err) => {
  logger.error(`  Erreur au démarrage : ${err.message}`);
  process.exit(1);
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
