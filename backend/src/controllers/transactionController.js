const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const { auditAction } = require('../middleware/auditMiddleware');
const { emitToUser, emitToRole } = require('../services/socketService');
const notificationService = require('../services/notificationService');

// POST /api/transactions — créer une transaction
exports.createTransaction = async (req, res, next) => {
  try {
    const { type, amount, clientPhone, clientName, description, clientId } = req.body;

    // Le marchand crée des transactions sur son propre compte
    const merchantId = req.user.role === 'merchant' ? req.user._id : req.body.merchantId;

    const account = await Account.findOne({ merchantId, isActive: true });
    if (!account) {
      return res.status(404).json({ error: 'Compte marchand introuvable ou inactif.' });
    }

    // Vérification solde pour les retraits/transferts
    if (['withdrawal', 'transfer'].includes(type) && account.balance < amount) {
      return res.status(400).json({ error: 'Solde insuffisant.' });
    }

    const transaction = await Transaction.create({
      merchantId,
      clientId: clientId || null,
      clientPhone,
      clientName,
      type,
      amount,
      description,
      status: 'pending',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    await auditAction('transaction_created', req, transaction._id, 'Transaction', { type, amount });

    // Notification temps réel au marchand
    await notificationService.create({
      userId: merchantId,
      title: 'Nouvelle transaction',
      message: `Transaction ${type} de ${amount} XOF créée.`,
      type: 'transaction',
      resourceType: 'transaction',
      resourceId: transaction._id,
    });

    emitToUser(merchantId.toString(), 'transaction:new', transaction);

    res.status(201).json({ transaction });
  } catch (err) {
    next(err);
  }
};

// GET /api/transactions — liste avec filtres
exports.getTransactions = async (req, res, next) => {
  try {
    const {
      type, status, page = 1, limit = 20,
      startDate, endDate, search, merchantId,
    } = req.query;

    const filter = {};

    // Un marchand ne voit que ses transactions
    if (req.user.role === 'merchant') {
      filter.merchantId = req.user._id;
    } else if (req.user.role === 'client') {
      filter.clientId = req.user._id;
    } else if (merchantId) {
      filter.merchantId = merchantId;
    }

    if (type) filter.type = type;
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    if (search) {
      filter.$or = [
        { reference: { $regex: search, $options: 'i' } },
        { clientPhone: { $regex: search, $options: 'i' } },
        { clientName: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .populate('merchantId', 'name phone businessName')
        .populate('clientId', 'name phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Transaction.countDocuments(filter),
    ]);

    res.json({
      transactions,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/transactions/:id
exports.getTransactionById = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('merchantId', 'name phone businessName')
      .populate('clientId', 'name phone')
      .populate('deletedBy', 'name')
      .populate('restoredBy', 'name');

    if (!transaction) return res.status(404).json({ error: 'Transaction introuvable.' });

    // Contrôle d'accès
    if (
      req.user.role === 'merchant' &&
      transaction.merchantId._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ error: 'Accès refusé.' });
    }

    res.json({ transaction });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/transactions/:id/status — mise à jour statut (callback MoMo ou admin)
exports.updateTransactionStatus = async (req, res, next) => {
  try {
    const { status, momoStatus, momoReason } = req.body;

    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ error: 'Transaction introuvable.' });

    const oldStatus = transaction.status;
    transaction.status = status;
    if (momoStatus) transaction.momoStatus = momoStatus;
    if (momoReason) transaction.momoReason = momoReason;
    await transaction.save();

    // Mise à jour solde du compte si transaction complétée
    if (status === 'completed' && oldStatus !== 'completed') {
      const update = {};
      if (transaction.type === 'deposit') update.$inc = { balance: transaction.amount, totalDeposits: transaction.amount };
      else if (['withdrawal', 'transfer'].includes(transaction.type))
        update.$inc = { balance: -transaction.amount, totalWithdrawals: transaction.amount };
      update.$inc = { ...update.$inc, totalTransactions: 1 };
      await Account.findOneAndUpdate({ merchantId: transaction.merchantId }, update);
    }

    await auditAction('transaction_updated', req, transaction._id, 'Transaction', { oldStatus, newStatus: status });

    // Notification temps réel
    const notifType = status === 'completed' ? 'success' : status === 'failed' ? 'error' : 'info';
    await notificationService.create({
      userId: transaction.merchantId,
      title: `Transaction ${status}`,
      message: `Référence ${transaction.reference} — statut : ${status}`,
      type: notifType,
      resourceType: 'transaction',
      resourceId: transaction._id,
    });
    emitToUser(transaction.merchantId.toString(), 'transaction:updated', transaction);

    res.json({ transaction });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/transactions/:id — soft delete
exports.deleteTransaction = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ error: 'Transaction introuvable.' });

    // Seuls super_admin et le marchand propriétaire peuvent supprimer
    if (
      req.user.role !== 'super_admin' &&
      transaction.merchantId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ error: 'Accès refusé.' });
    }

    transaction.isDeleted = true;
    transaction.deletedBy = req.user._id;
    transaction.deletedAt = new Date();
    transaction.deleteReason = reason || null;
    await transaction.save();

    await auditAction('transaction_deleted', req, transaction._id, 'Transaction', { reason });
    res.json({ message: 'Transaction supprimée (soft delete).' });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/transactions/:id/restore — restauration
exports.restoreTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne(
      { _id: req.params.id },
      null,
      { includeDeleted: true }
    );
    if (!transaction) return res.status(404).json({ error: 'Transaction introuvable.' });
    if (!transaction.isDeleted) return res.status(400).json({ error: 'Transaction non supprimée.' });

    transaction.isDeleted = false;
    transaction.restoredBy = req.user._id;
    transaction.restoredAt = new Date();
    await transaction.save();

    await auditAction('transaction_restored', req, transaction._id, 'Transaction');
    res.json({ transaction, message: 'Transaction restaurée.' });
  } catch (err) {
    next(err);
  }
};

// GET /api/transactions/stats — statistiques rapides
exports.getStats = async (req, res, next) => {
  try {
    const merchantId = req.user.role === 'merchant' ? req.user._id : req.query.merchantId;
    const matchFilter = merchantId ? { merchantId: require('mongoose').Types.ObjectId.createFromHexString(merchantId.toString()) } : {};

    const stats = await Transaction.aggregate([
      { $match: { ...matchFilter, isDeleted: false } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          total: { $sum: '$amount' },
        },
      },
    ]);

    const byStatus = await Transaction.aggregate([
      { $match: { ...matchFilter, isDeleted: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    res.json({ byType: stats, byStatus });
  } catch (err) {
    next(err);
  }
};
