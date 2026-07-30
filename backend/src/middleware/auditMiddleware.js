const AuditLog = require('../models/AuditLog');
const logger = require('../config/logger');

/**
 * Factory : crée un middleware qui log une action dans audit_logs.
 * Usage dans un controller : await auditAction('transaction_created', req, targetId, 'Transaction', details)
 */
const auditAction = async (action, req, targetId = null, targetModel = null, details = {}) => {
  try {
    await AuditLog.create({
      action,
      performedBy: req.user._id,
      targetId,
      targetModel,
      details,
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers['user-agent'],
      timestamp: new Date(),
    });
  } catch (err) {
    // L'audit ne doit jamais bloquer une opération
    logger.warn(`Audit log échoué [${action}]: ${err.message}`);
  }
};

module.exports = { auditAction };
