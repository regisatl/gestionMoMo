const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Options recommandées pour mongoose 8+
    });
    logger.info(`✅ MongoDB connecté : ${conn.connection.host}`);
  } catch (error) {
    logger.error(`❌ Erreur connexion MongoDB : ${error.message}`);
    process.exit(1);
  }
};

// Événements de connexion
mongoose.connection.on('disconnected', () => {
  logger.warn('⚠️  MongoDB déconnecté');
});

mongoose.connection.on('reconnected', () => {
  logger.info('🔄 MongoDB reconnecté');
});

module.exports = connectDB;