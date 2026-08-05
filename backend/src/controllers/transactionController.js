const Transaction = require('../models/Transaction');
const Account     = require('../models/Account');
const momoService = require('../services/momoService');
const { getAllPackages, findPlanByCode, validateCreditAmount } = require('../config/mtnPackages');
const { auditAction }   = require('../middleware/auditMiddleware');
const { emitToUser }    = require('../services/socketService');
const notificationService = require('../services/notificationService');
const whatsappService   = require('../services/whatsappService');
const logger = require('../config/logger');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_LABELS = {
  deposit:    'Dépôt',
  withdrawal: 'Retrait',
  transfer:   'Transfert',
  credit_sale: 'Recharge crédit',
  data_sale:   'Forfait data',
  unlimited:   'Forfait illimité',
  payment:    'Paiement',
  refund:     'Remboursement',
};

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n);

// ─── Sélectionne le produit MTN selon le type ─────────────────────────────────
const momoProductForType = (type) => {
  if (type === 'deposit') return 'collection';
  return 'disbursement'; // withdrawal, transfer, credit_sale, data_sale, unlimited
};

// ─── Notifie le marchand + envoie un WhatsApp récapitulatif ───────────────────
const notifyTransaction = async ({ merchantId, merchantPhone, clientPhone, transaction, type, amount, packageLabel }) => {
  const typeLabel = TYPE_LABELS[type] || type;
  const title = `${typeLabel} — ${fmt(amount)} XOF`;
  const message = `Réf. ${transaction.reference} | Client: ${clientPhone}${packageLabel ? ` | ${packageLabel}` : ''} | Statut: en attente`;

  await notificationService.create({
    userId: merchantId,
    title,
    message,
    type: 'transaction',
    resourceType: 'transaction',
    resourceId: transaction._id,
  });

  emitToUser(merchantId.toString(), 'transaction:new', transaction);

  // WhatsApp récap marchand (non bloquant)
  if (merchantPhone) {
    const waMsg = [
      `🧾 *Nouvelle transaction — GestionMoMo*`,
      ``,
      `📋 Type      : *${typeLabel}*`,
      `💰 Montant   : *${fmt(amount)} XOF*`,
      packageLabel ? `📦 Package   : *${packageLabel}*` : null,
      `📞 Client    : ${clientPhone}`,
      `🔖 Référence : \`${transaction.reference}\``,
      `⏳ Statut    : En attente de confirmation MTN`,
      ``,
      `— GestionMoMo`,
    ].filter(Boolean).join('\n');
    whatsappService.send(merchantPhone, waMsg).catch(() => {});
  }
};

// ─── POST /api/transactions ────────────────────────────────────────────────────
exports.createTransaction = async (req, res, next) => {
  try {
    const {
      type,
      amount,
      clientPhone,
      clientName,
      description,
      clientId,
      packageCode,   // pour data_sale / unlimited
      operator = 'MTN',
    } = req.body;

    const merchantId = req.user.role === 'merchant' ? req.user._id : req.body.merchantId;

    // ── Compte marchand ──
    const account = await Account.findOne({ merchantId, isActive: true }).select('+momoApiKey');
    if (!account) return res.status(404).json({ error: 'Compte marchand introuvable ou inactif.' });

    // ── Solde suffisant pour retrait / transfert ──
    if (['withdrawal', 'transfer'].includes(type) && account.balance < amount) {
      return res.status(400).json({ error: 'Solde insuffisant.' });
    }

    // ── Résolution du package (data_sale / unlimited) ──
    let packageLabel    = null;
    let packageValidity = null;
    let finalAmount     = amount;

    if (['data_sale', 'unlimited'].includes(type)) {
      if (!packageCode) return res.status(400).json({ error: 'packageCode requis pour ce type de transaction.' });
      const plan = findPlanByCode(packageCode);
      if (!plan) return res.status(400).json({ error: `Package inconnu : ${packageCode}` });
      packageLabel    = plan.label;
      packageValidity = plan.validity;
      finalAmount     = plan.price; // le prix du plan est la source de vérité
    }

    // ── Validation montant crédit libre ──
    if (type === 'credit_sale' && !validateCreditAmount(finalAmount)) {
      return res.status(400).json({ error: `Montant de recharge invalide (min 50, max 50 000 XOF).` });
    }

    // ── Création de la transaction en base (statut pending) ──
    const transaction = await Transaction.create({
      merchantId,
      clientId: clientId || null,
      clientPhone,
      clientName: clientName || null,
      type,
      amount: finalAmount,
      currency: account.currency || 'XOF',
      description: description || null,
      operator,
      packageCode:     packageCode    || null,
      packageLabel:    packageLabel   || null,
      packageValidity: packageValidity || null,
      status: 'pending',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // ── Appel MTN MoMo ──
    let momoReferenceId = null;
    let momoError       = null;

    try {
      let result;
      switch (type) {
        case 'deposit':
          result = await momoService.requestToPay(
            account, finalAmount, clientPhone, transaction.reference, description
          );
          break;
        case 'withdrawal':
        case 'transfer':
          result = await momoService.transfer(
            account, finalAmount, clientPhone, transaction.reference, description
          );
          break;
        case 'credit_sale':
          result = await momoService.creditSale(
            account, finalAmount, clientPhone, transaction.reference
          );
          break;
        case 'data_sale':
        case 'unlimited':
          result = await momoService.activatePlan(
            account, finalAmount, clientPhone, packageCode, packageLabel, transaction.reference
          );
          break;
        default:
          // payment / refund — enregistrement simple sans appel MoMo
          result = { referenceId: null };
      }
      momoReferenceId = result?.referenceId || null;
    } catch (momoErr) {
      // L'appel MoMo a échoué — on le note sans bloquer la réponse
      // La transaction reste en "pending" et pourra être retentée / annulée
      momoError = momoErr.message;
      logger.warn(`[Transaction] Appel MoMo échoué pour ${transaction.reference}: ${momoError}`);
    }

    // ── Mise à jour de la référence MoMo si dispo ──
    if (momoReferenceId) {
      transaction.momoReferenceId = momoReferenceId;
      transaction.status = 'processing'; // MTN a reçu la demande
      await transaction.save();
    }

    // ── Audit ──
    await auditAction('transaction_created', req, transaction._id, 'Transaction', {
      type, amount: finalAmount, packageCode, momoReferenceId,
    });

    // ── Notifications ──
    await notifyTransaction({
      merchantId,
      merchantPhone: req.user.phone,
      clientPhone,
      transaction,
      type,
      amount: finalAmount,
      packageLabel,
    });

    res.status(201).json({
      transaction,
      momoReferenceId,
      ...(momoError ? { momoWarning: momoError } : {}),
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/transactions ─────────────────────────────────────────────────────
exports.getTransactions = async (req, res, next) => {
  try {
    const {
      type, status, page = 1, limit = 20,
      startDate, endDate, search, merchantId,
    } = req.query;

    const filter = {};

    if (req.user.role === 'merchant') {
      filter.merchantId = req.user._id;
    } else if (req.user.role === 'client') {
      filter.clientId = req.user._id;
    } else if (merchantId) {
      filter.merchantId = merchantId;
    }

    if (type)   filter.type   = type;
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate)   filter.createdAt.$lte = new Date(endDate);
    }
    if (search) {
      filter.$or = [
        { reference:   { $regex: search, $options: 'i' } },
        { clientPhone: { $regex: search, $options: 'i' } },
        { clientName:  { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .populate('merchantId', 'name phone businessName')
        .populate('clientId',   'name phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Transaction.countDocuments(filter),
    ]);

    res.json({
      transactions,
      pagination: {
        page: parseInt(page), limit: parseInt(limit),
        total, pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/transactions/packages ───────────────────────────────────────────
exports.getPackages = (req, res) => {
  res.json({ packages: getAllPackages() });
};

// ─── GET /api/transactions/:id ─────────────────────────────────────────────────
exports.getTransactionById = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('merchantId', 'name phone businessName')
      .populate('clientId',   'name phone')
      .populate('deletedBy',  'name')
      .populate('restoredBy', 'name');

    if (!transaction) return res.status(404).json({ error: 'Transaction introuvable.' });

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

// ─── PATCH /api/transactions/:id/status ───────────────────────────────────────
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

    // Mise à jour solde si transaction complétée
    if (status === 'completed' && oldStatus !== 'completed') {
      const inc = { totalTransactions: 1 };
      if (transaction.type === 'deposit') {
        inc.balance = transaction.amount;
        inc.totalDeposits = transaction.amount;
      } else if (['withdrawal', 'transfer', 'credit_sale', 'data_sale', 'unlimited'].includes(transaction.type)) {
        inc.balance = -transaction.amount;
        inc.totalWithdrawals = transaction.amount;
      }
      await Account.findOneAndUpdate({ merchantId: transaction.merchantId }, { $inc: inc });
    }

    await auditAction('transaction_updated', req, transaction._id, 'Transaction', {
      oldStatus, newStatus: status,
    });

    const notifType = status === 'completed' ? 'success' : status === 'failed' ? 'error' : 'info';
    await notificationService.create({
      userId: transaction.merchantId,
      title: `Transaction ${status === 'completed' ? 'confirmée ✅' : status === 'failed' ? 'échouée ❌' : 'mise à jour'}`,
      message: `${transaction.reference} — ${fmt(transaction.amount)} XOF — ${TYPE_LABELS[transaction.type] || transaction.type}`,
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

// ─── DELETE /api/transactions/:id ─────────────────────────────────────────────
exports.deleteTransaction = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ error: 'Transaction introuvable.' });

    if (
      req.user.role !== 'super_admin' &&
      transaction.merchantId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ error: 'Accès refusé.' });
    }

    transaction.isDeleted    = true;
    transaction.deletedBy    = req.user._id;
    transaction.deletedAt    = new Date();
    transaction.deleteReason = reason || null;
    await transaction.save();

    await auditAction('transaction_deleted', req, transaction._id, 'Transaction', { reason });
    res.json({ message: 'Transaction supprimée.' });
  } catch (err) {
    next(err);
  }
};

// ─── PATCH /api/transactions/:id/restore ──────────────────────────────────────
exports.restoreTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne(
      { _id: req.params.id },
      null,
      { includeDeleted: true }
    );
    if (!transaction) return res.status(404).json({ error: 'Transaction introuvable.' });
    if (!transaction.isDeleted) return res.status(400).json({ error: 'Transaction non supprimée.' });

    transaction.isDeleted  = false;
    transaction.restoredBy = req.user._id;
    transaction.restoredAt = new Date();
    await transaction.save();

    await auditAction('transaction_restored', req, transaction._id, 'Transaction');
    res.json({ transaction, message: 'Transaction restaurée.' });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/transactions/stats ──────────────────────────────────────────────
exports.getStats = async (req, res, next) => {
  try {
    const mongoose   = require('mongoose');
    const merchantId = req.user.role === 'merchant' ? req.user._id : req.query.merchantId;
    const matchFilter = merchantId
      ? { merchantId: mongoose.Types.ObjectId.createFromHexString(merchantId.toString()), isDeleted: false }
      : { isDeleted: false };

    const [byType, byStatus] = await Promise.all([
      Transaction.aggregate([
        { $match: matchFilter },
        { $group: { _id: '$type', count: { $sum: 1 }, total: { $sum: '$amount' } } },
        { $sort: { total: -1 } },
      ]),
      Transaction.aggregate([
        { $match: matchFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    res.json({ byType, byStatus });
  } catch (err) {
    next(err);
  }
};
