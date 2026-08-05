const Account = require('../models/Account');
const { auditAction } = require('../middleware/auditMiddleware');
const momoService = require('../services/momoService');
const logger = require('../config/logger');

// GET /api/accounts/me — compte du marchand connecté
exports.getMyAccount = async (req, res, next) => {
  try {
    const account = await Account.findOne({ merchantId: req.user._id });
    if (!account) return res.status(404).json({ error: 'Compte introuvable.' });
    res.json({ account });
  } catch (err) {
    next(err);
  }
};

// GET /api/accounts — tous les comptes (super_admin)
exports.getAllAccounts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [accounts, total] = await Promise.all([
      Account.find()
        .populate('merchantId', 'name phone businessName status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Account.countDocuments(),
    ]);

    res.json({
      accounts,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/accounts — créer un compte marchand (super_admin)
exports.createAccount = async (req, res, next) => {
  try {
    const { merchantId, momoAccountNumber, currency, momoUserId, momoApiKey } = req.body;

    const exists = await Account.findOne({ merchantId });
    if (exists) return res.status(400).json({ error: 'Ce marchand possède déjà un compte.' });

    const account = await Account.create({
      merchantId,
      momoAccountNumber,
      currency: currency || 'XOF',
      momoUserId,
      momoApiKey,
    });

    await auditAction('account_created', req, account._id, 'Account', { merchantId, momoAccountNumber });
    res.status(201).json({ account });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/accounts/:id — mise à jour du compte
exports.updateAccount = async (req, res, next) => {
  try {
    const { momoAccountNumber, currency, isActive, momoEnvironment } = req.body;

    const account = await Account.findByIdAndUpdate(
      req.params.id,
      { momoAccountNumber, currency, isActive, momoEnvironment },
      { new: true, runValidators: true }
    );

    if (!account) return res.status(404).json({ error: 'Compte introuvable.' });

    await auditAction('account_updated', req, account._id, 'Account', { fields: Object.keys(req.body) });
    res.json({ account });
  } catch (err) {
    next(err);
  }
};

// POST /api/accounts/:id/sync — synchronise le solde via MTN MoMo
exports.syncBalance = async (req, res, next) => {
  try {
    const account = await Account.findById(req.params.id).select('+momoApiKey');
    if (!account) return res.status(404).json({ error: 'Compte introuvable.' });

    let balance = account.balance;
    let syncMessage = 'Synchronisation effectuée.';

    try {
      const momoBalance = await momoService.getBalance(account);
      balance = parseFloat(momoBalance.availableBalance) || account.balance;
      account.balance = balance;
      syncMessage = `Solde synchronisé depuis MTN MoMo : ${balance} ${momoBalance.currency}`;
      logger.info(`[Account] Sync OK — compte ${account._id}, solde: ${balance}`);
    } catch (momoErr) {
      // Si l'appel MoMo échoue, on garde le solde actuel sans bloquer
      logger.warn(`[Account] Sync MoMo échouée pour ${account._id}: ${momoErr.message}`);
      syncMessage = 'Synchronisation partielle (API MoMo indisponible).';
    }

    account.lastSync = new Date();
    await account.save();

    res.json({ account, message: syncMessage, balance });
  } catch (err) {
    next(err);
  }
};
