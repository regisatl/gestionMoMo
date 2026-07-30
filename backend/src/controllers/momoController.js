const Transaction = require('../models/Transaction');
const { auditAction } = require('../middleware/auditMiddleware');
const { emitToUser } = require('../services/socketService');
const notificationService = require('../services/notificationService');
const logger = require('../config/logger');

/**
 * POST /api/momo/callback/collection
 * Reçoit les notifications de paiement MTN MoMo Collections
 */
exports.collectionCallback = async (req, res, next) => {
  try {
    const { referenceId, status, reason } = req.body;
    logger.info(`[MoMo Callback] Collection — ref: ${referenceId}, status: ${status}`);

    const transaction = await Transaction.findOne({ momoReferenceId: referenceId });
    if (!transaction) {
      logger.warn(`[MoMo Callback] Transaction introuvable pour ref: ${referenceId}`);
      return res.status(200).json({ message: 'Acknowledged' }); // Toujours 200 pour MTN
    }

    const oldStatus = transaction.status;
    transaction.status = status === 'SUCCESSFUL' ? 'completed' : status === 'FAILED' ? 'failed' : 'processing';
    transaction.momoStatus = status;
    transaction.momoReason = reason || null;
    await transaction.save();

    await auditAction(
      'momo_callback_received',
      { user: { _id: transaction.merchantId }, ip: req.ip, headers: req.headers },
      transaction._id,
      'Transaction',
      { referenceId, status, reason }
    );

    const notifType = transaction.status === 'completed' ? 'success' : 'error';
    await notificationService.create({
      userId: transaction.merchantId,
      title: `Paiement ${transaction.status === 'completed' ? 'reçu' : 'échoué'}`,
      message: `${transaction.reference} — ${transaction.amount} XOF — ${status}`,
      type: notifType,
      resourceType: 'transaction',
      resourceId: transaction._id,
    });

    emitToUser(transaction.merchantId.toString(), 'transaction:updated', {
      _id: transaction._id,
      status: transaction.status,
      reference: transaction.reference,
    });

    res.status(200).json({ message: 'Callback traité.' });
  } catch (err) {
    logger.error(`[MoMo Callback] Erreur: ${err.message}`);
    next(err);
  }
};

/**
 * POST /api/momo/callback/disbursement
 * Reçoit les statuts de décaissement MTN MoMo
 */
exports.disbursementCallback = async (req, res, next) => {
  try {
    const { referenceId, status, reason } = req.body;
    logger.info(`[MoMo Callback] Disbursement — ref: ${referenceId}, status: ${status}`);

    const transaction = await Transaction.findOne({ momoReferenceId: referenceId });
    if (!transaction) return res.status(200).json({ message: 'Acknowledged' });

    transaction.status = status === 'SUCCESSFUL' ? 'completed' : 'failed';
    transaction.momoStatus = status;
    transaction.momoReason = reason || null;
    await transaction.save();

    emitToUser(transaction.merchantId.toString(), 'transaction:updated', {
      _id: transaction._id,
      status: transaction.status,
      reference: transaction.reference,
    });

    res.status(200).json({ message: 'Callback traité.' });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/momo/callback/remittance
 * Reçoit les statuts de transfert international
 */
exports.remittanceCallback = async (req, res, next) => {
  try {
    const { referenceId, status, reason } = req.body;
    logger.info(`[MoMo Callback] Remittance — ref: ${referenceId}, status: ${status}`);

    const transaction = await Transaction.findOne({ momoReferenceId: referenceId });
    if (!transaction) return res.status(200).json({ message: 'Acknowledged' });

    transaction.status = status === 'SUCCESSFUL' ? 'completed' : 'failed';
    transaction.momoStatus = status;
    transaction.momoReason = reason || null;
    await transaction.save();

    res.status(200).json({ message: 'Callback traité.' });
  } catch (err) {
    next(err);
  }
};
