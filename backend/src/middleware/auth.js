const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../config/logger');

/**
 * Vérifie le token JWT et injecte l'utilisateur dans req.user
 */
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ error: 'Non authentifié. Token manquant.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user) {
      return res.status(401).json({ error: 'Utilisateur introuvable.' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Compte suspendu. Contactez l\'administrateur.' });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({ error: 'Compte inactif.' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expiré.', code: 'TOKEN_EXPIRED' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token invalide.' });
    }
    logger.error('Auth middleware error:', err.message);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
};

/**
 * Restreint l'accès aux rôles spécifiés
 * Usage: restrictTo('super_admin', 'merchant')
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Accès refusé. Rôle requis : ${roles.join(' ou ')}.`,
      });
    }
    next();
  };
};

module.exports = { protect, restrictTo };
