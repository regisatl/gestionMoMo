const crypto              = require('crypto');
const User                = require('../models/User');
const Account             = require('../models/Account');
const { auditAction }     = require('../middleware/auditMiddleware');
const notificationService = require('../services/notificationService');
const emailService        = require('../services/emailService');
const whatsappService     = require('../services/whatsappService');

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Génère un mot de passe aléatoire sécurisé (12 caractères alphanumérique + symboles).
 */
const generatePassword = () => crypto.randomBytes(9).toString('base64url'); // ~12 chars url-safe

/**
 * Génère un PIN mobile aléatoire à 5 chiffres.
 */
const generatePin = () => String(Math.floor(10000 + Math.random() * 90000));

/**
 * Vérifie qu'une action sur un super_admin est autorisée.
 * Si c'est le dernier super_admin actif non supprimé, on bloque.
 */
const guardLastSuperAdmin = async (userId) => {
  const target = await User.findById(userId);
  if (!target || target.role !== 'super_admin') return; // pas un super_admin → pas de garde
  const count = await User.countDocuments({
    role: 'super_admin',
    isDeleted: { $ne: true },
    status: { $nin: ['inactive', 'suspended'] },
  });
  if (count <= 1) {
    throw Object.assign(new Error('Impossible de modifier le dernier super administrateur actif.'), { statusCode: 400 });
  }
};

// ─── GET /api/users ───────────────────────────────────────────────────────────
exports.getAllUsers = async (req, res, next) => {
  try {
    const { role, status, page = 1, limit = 20, search, deleted } = req.query;
    const filter = {};

    if (role)   filter.role   = role;
    if (status) filter.status = status;

    if (deleted === 'true') {
      filter.isDeleted = true;
    } else if (!deleted) {
      filter.isDeleted = { $ne: true };
    }

    if (search) {
      filter.$or = [
        { name:  { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);

    res.json({
      users,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
};

// ─── POST /api/users ──────────────────────────────────────────────────────────
exports.createUser = async (req, res, next) => {
  try {
    const { name, phone, email, password, pin, role, businessName, businessAddress } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'Nom et téléphone sont requis.' });
    }

    // Génère les identifiants si non fournis
    const plainPassword = password || generatePassword();
    const plainPin      = pin      || generatePin();

    const user = await User.create({
      name,
      phone,
      email:           email || undefined,
      passwordHash:    plainPassword,
      pinHash:         plainPin,
      role:            role || 'client',
      status:          'active',
      businessName:    businessName  || null,
      businessAddress: businessAddress || null,
    });

    // Compte MoMo automatique pour les marchands
    if (user.role === 'merchant') {
      const momoAccountNumber = `MOMO-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      await Account.create({ merchantId: user._id, momoAccountNumber });
    }

    // Notification in-app de bienvenue
    await notificationService.create({
      userId: user._id,
      title:  'Bienvenue sur GestionMoMo 🎉',
      message: `Bonjour ${name} ! Votre compte a été créé avec succès. Numéro : ${phone}`,
      type: 'system',
      resourceType: 'user',
      resourceId: user._id,
    });

    // Email + WhatsApp (silencieux si non configuré)
    if (email) {
      emailService.sendWelcome({ to: email, name, phone, password: plainPassword, pin: plainPin });
    }
    whatsappService.sendWelcome({ to: phone, name, phone, password: plainPassword, pin: plainPin });

    await auditAction('user_created', req, user._id, 'User', { role, phone });
    res.status(201).json({ user, credentials: { password: plainPassword, pin: plainPin } });
  } catch (err) { next(err); }
};

// ─── GET /api/users/:id ───────────────────────────────────────────────────────
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });

    if (req.user.role !== 'super_admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ error: 'Accès refusé.' });
    }

    res.json({ user });
  } catch (err) { next(err); }
};

// ─── PATCH /api/users/:id ─────────────────────────────────────────────────────
exports.updateUser = async (req, res, next) => {
  try {
    const { name, email, phone, businessName, businessAddress, language, theme, avatar } = req.body;

    if (req.user.role !== 'super_admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ error: 'Accès refusé.' });
    }

    // Seul le super_admin peut modifier le numéro de téléphone
    const updateData = { name, email, businessName, businessAddress, language, theme, avatar };
    if (req.user.role === 'super_admin' && phone) {
      updateData.phone = phone;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });

    await auditAction('user_updated', req, user._id, 'User', { fields: Object.keys(req.body) });
    res.json({ user });
  } catch (err) { next(err); }
};

// ─── PATCH /api/users/:id/status ─────────────────────────────────────────────
exports.updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['active', 'inactive', 'suspended'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Statut invalide. Valeurs acceptées : ${validStatuses.join(', ')}` });
    }

    // Empêche de suspendre/désactiver le dernier super_admin
    if (status !== 'active') {
      try { await guardLastSuperAdmin(req.params.id); } catch (e) {
        return res.status(e.statusCode || 400).json({ error: e.message });
      }
    }

    const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });

    const action = status === 'suspended' ? 'user_suspended' : 'user_activated';
    await auditAction(action, req, user._id, 'User', { status });

    res.json({ user, message: `Statut mis à jour : ${status}` });
  } catch (err) { next(err); }
};

// ─── PATCH /api/users/:id/reset-password ─────────────────────────────────────
exports.resetPassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('+passwordHash');
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });

    // Génère un nouveau mot de passe aléatoire
    const newPassword = generatePassword();
    user.passwordHash = newPassword;
    await user.save();

    // Notification in-app
    await notificationService.create({
      userId: user._id,
      title:  'Mot de passe web réinitialisé',
      message: `Votre mot de passe web-admin a été réinitialisé par un administrateur. Nouveau mot de passe temporaire : ${newPassword}. Changez-le immédiatement.`,
      type: 'warning',
      resourceType: 'user',
      resourceId: user._id,
    });

    // Email + WhatsApp
    if (user.email) {
      emailService.sendPasswordReset({ to: user.email, name: user.name, newPassword });
    }
    whatsappService.sendPasswordReset({ to: user.phone, name: user.name, newPassword });

    await auditAction('password_reset_admin', req, user._id, 'User', { resetBy: req.user._id });
    res.json({ message: 'Mot de passe réinitialisé avec succès.', newPassword });
  } catch (err) { next(err); }
};

// ─── PATCH /api/users/:id/reset-pin ──────────────────────────────────────────
exports.resetPin = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('+pinHash');
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });

    // Génère un nouveau PIN aléatoire à 5 chiffres
    const newPin = generatePin();
    user.pinHash = newPin;
    await user.save();

    // Notification in-app
    await notificationService.create({
      userId: user._id,
      title:  'Code PIN mobile réinitialisé',
      message: `Votre code PIN mobile a été réinitialisé par un administrateur. Nouveau PIN temporaire : ${newPin}. Changez-le immédiatement depuis l'application.`,
      type: 'warning',
      resourceType: 'user',
      resourceId: user._id,
    });

    // Email + WhatsApp
    if (user.email) {
      emailService.sendPinReset({ to: user.email, name: user.name, newPin });
    }
    whatsappService.sendPinReset({ to: user.phone, name: user.name, newPin });

    await auditAction('pin_reset_admin', req, user._id, 'User', { resetBy: req.user._id });
    res.json({ message: 'PIN réinitialisé avec succès.', newPin });
  } catch (err) { next(err); }
};

// ─── DELETE /api/users/:id — soft delete ─────────────────────────────────────
exports.deleteUser = async (req, res, next) => {
  try {
    const { reason } = req.body;

    // Empêche la suppression du dernier super_admin
    try { await guardLastSuperAdmin(req.params.id); } catch (e) {
      return res.status(e.statusCode || 400).json({ error: e.message });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        isDeleted:    true,
        deletedAt:    new Date(),
        deletedBy:    req.user._id,
        deleteReason: reason || null,
        status:       'inactive',
      },
      { new: true }
    );

    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });

    await auditAction('user_deleted', req, user._id, 'User', { reason, deletedBy: req.user._id });
    res.json({ message: 'Utilisateur supprimé (soft delete).', user });
  } catch (err) { next(err); }
};

// ─── PATCH /api/users/:id/restore ────────────────────────────────────────────
exports.restoreUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        isDeleted:    false,
        deletedAt:    null,
        deletedBy:    null,
        deleteReason: null,
        status:       'active',
      },
      { new: true }
    );

    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });

    await auditAction('user_restored', req, user._id, 'User', { restoredBy: req.user._id });
    res.json({ message: 'Utilisateur restauré avec succès.', user });
  } catch (err) { next(err); }
};

// ─── GET /api/users/merchants ─────────────────────────────────────────────────
exports.getMerchants = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20, search, deleted } = req.query;
    const filter = { role: 'merchant' };
    if (status) filter.status = status;

    if (deleted === 'true') {
      filter.isDeleted = true;
    } else {
      filter.isDeleted = { $ne: true };
    }

    if (search) {
      filter.$or = [
        { name:         { $regex: search, $options: 'i' } },
        { phone:        { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [merchants, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);

    const merchantIds = merchants.map((m) => m._id);
    const accounts    = await Account.find({ merchantId: { $in: merchantIds } });
    const accountMap  = accounts.reduce((acc, a) => {
      acc[a.merchantId.toString()] = a;
      return acc;
    }, {});

    const data = merchants.map((m) => ({
      ...m.toJSON(),
      account: accountMap[m._id.toString()] || null,
    }));

    res.json({
      merchants: data,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
};
