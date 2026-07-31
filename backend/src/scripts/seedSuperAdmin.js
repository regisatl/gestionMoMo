/**
 * seedSuperAdmin.js
 *
 * Crée le compte super_admin initial s'il n'existe pas encore.
 * Appelé automatiquement au démarrage du serveur.
 *
 * Identifiants par défaut (surchargés par les variables d'env) :
 *   Téléphone : SUPER_ADMIN_PHONE  (défaut: +2290190919096)
 *   PIN       : SUPER_ADMIN_PIN    (défaut: 12345)
 *   Nom       : SUPER_ADMIN_NAME   (défaut: Super Admin)
 *
 * ⚠️  Changez le PIN dès la première connexion !
 */
const User = require('../models/User');
const logger = require('../config/logger');

const seedSuperAdmin = async () => {
  try {
    const existing = await User.findOne({ role: 'super_admin' });
    if (existing) {
      logger.info(`✅ Super Admin déjà présent : ${existing.phone}`);
      return;
    }

    const phone = process.env.SUPER_ADMIN_PHONE || '+2290190919096';
    const pin   = process.env.SUPER_ADMIN_PIN   || '12345';
    const name  = process.env.SUPER_ADMIN_NAME  || 'Super Admin';

    await User.create({
      name,
      phone,
      passwordHash: pin,   // sera haché par le pre-save hook bcrypt
      role: 'super_admin',
      status: 'active',
    });

    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info('🔐  Super Admin créé avec succès');
    logger.info(`    Téléphone : ${phone}`);
    logger.info(`    PIN       : ${pin}`);
    logger.info('    ⚠️  Changez le PIN dès la première connexion !');
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } catch (err) {
    logger.error(`❌ Erreur seedSuperAdmin : ${err.message}`);
  }
};

module.exports = seedSuperAdmin;
