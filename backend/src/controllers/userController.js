const User = require('../models/User');
const Account = require('../models/Account');
const bcrypt = require('bcryptjs');
const { auditAction } = require('../middleware/auditMiddleware');

// GET /api/users — super_admin seulement
exports.getAllUsers = async (req, res, next) => {
  try {
    const { role, status, page = 1, limit = 20, search, deleted } = req.query;
    const filter = {};

    if (role)   filter.role   = role;
    if (status) filter.status = status;

    // Soft-delete filter : par défaut on exclut les supprimés, sauf si deleted=true
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
  } catch (err) {
    next(err);
  }
};

// POST /api/users — créer un utilisateur (super_admin)
exports.createUser = async (req, res, next) => {
  try {
    const { name, phone, email, password, pin, role, businessName, businessAddress } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'Nom et téléphone sont requis.' });
    }
    if (!password && !pin) {
      return res.status(400).json({ error: 'Un mot de passe (web-admin) ou un PIN mobile est requis.' });
    }

    const user = await User.create({
      name,
      phone,
      email:           email || undefined,
      passwordHash:    password || null,
      pinHash:         pin      || null,
      role:            role || 'client',
      status:          'active',
      businessName:    businessName  || null,
      businessAddress: businessAddress || null,
    });

    // Si marchand → créer automatiquement un compte MoMo placeholder
    if (user.role === 'merchant') {
      const momoAccountNumber = `MOMO-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      await Account.create({ merchantId: user._id, momoAccountNumber });
    }

    await auditAction('user_created', req, user._id, 'User', { role, phone });
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
};

// GET /api/users/:id
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });

    if (req.user.role !== 'super_admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ error: 'Accès refusé.' });
    }

    res.json({ user });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/users/:id
exports.updateUser = async (req, res, next) => {
  try {
    const { name, email, businessName, businessAddress, language, theme, avatar } = req.body;

    if (req.user.role !== 'super_admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ error: 'Accès refusé.' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, businessName, businessAddress, language, theme, avatar },
      { new: true, runValidators: true }
    );

    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });

    await auditAction('user_updated', req, user._id, 'User', { fields: Object.keys(req.body) });
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/users/:id/status — super_admin seulement
exports.updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['active', 'inactive', 'suspended'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Statut invalide. Valeurs acceptées : ${validStatuses.join(', ')}` });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });

    const action = status === 'suspended' ? 'user_suspended' : 'user_activated';
    await auditAction(action, req, user._id, 'User', { status });

    res.json({ user, message: `Statut mis à jour : ${status}` });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/users/:id/reset-password — super_admin : force un nouveau mot de passe web-admin
exports.resetPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'Le nouveau mot de passe doit faire au moins 8 caractères.' });
    }

    const user = await User.findById(req.params.id).select('+passwordHash');
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });

    user.passwordHash = newPassword; // le pre-save hook hash automatiquement
    await user.save();

    await auditAction('password_reset_admin', req, user._id, 'User', { resetBy: req.user._id });
    res.json({ message: 'Mot de passe réinitialisé avec succès.' });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/users/:id/reset-pin — super_admin : force un nouveau PIN mobile (5 chiffres)
exports.resetPin = async (req, res, next) => {
  try {
    const { newPin } = req.body;
    if (!newPin || !/^\d{5}$/.test(newPin)) {
      return res.status(400).json({ error: 'Le PIN doit être exactement 5 chiffres.' });
    }

    const user = await User.findById(req.params.id).select('+pinHash');
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });

    user.pinHash = newPin;
    await user.save();

    await auditAction('pin_reset_admin', req, user._id, 'User', { resetBy: req.user._id });
    res.json({ message: 'PIN réinitialisé avec succès.' });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/users/:id — soft delete avec historisation
exports.deleteUser = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        isDeleted:   true,
        deletedAt:   new Date(),
        deletedBy:   req.user._id,
        deleteReason: reason || null,
        status:      'inactive',
      },
      { new: true }
    );

    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });

    await auditAction('user_deleted', req, user._id, 'User', { reason, deletedBy: req.user._id });
    res.json({ message: 'Utilisateur supprimé (soft delete).', user });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/users/:id/restore — restaurer un utilisateur supprimé
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
  } catch (err) {
    next(err);
  }
};

// GET /api/users/merchants — liste des marchands avec leur compte
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
  } catch (err) {
    next(err);
  }
};

// GET /api/users — super_admin seulement
exports.getAllUsers = async (req, res, next) => {
  try {
    const { role, status, page = 1, limit = 20, search } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
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
  } catch (err) {
    next(err);
  }
};

// GET /api/users/:id
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });

    // Un marchand/client ne peut voir que son propre profil
    if (req.user.role !== 'super_admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ error: 'Accès refusé.' });
    }

    res.json({ user });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/users/:id
exports.updateUser = async (req, res, next) => {
  try {
    const { name, email, businessName, businessAddress, language, theme, avatar } = req.body;

    // Seul le super_admin peut modifier n'importe quel utilisateur
    if (req.user.role !== 'super_admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ error: 'Accès refusé.' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, businessName, businessAddress, language, theme, avatar },
      { new: true, runValidators: true }
    );

    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });

    await auditAction('user_updated', req, user._id, 'User', { fields: Object.keys(req.body) });
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/users/:id/status — super_admin seulement
exports.updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['active', 'inactive', 'suspended'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Statut invalide. Valeurs acceptées : ${validStatuses.join(', ')}` });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });

    const action = status === 'suspended' ? 'user_suspended' : 'user_activated';
    await auditAction(action, req, user._id, 'User', { status });

    res.json({ user, message: `Statut mis à jour : ${status}` });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/users/:id — super_admin seulement (soft delete via status)
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'inactive' },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });

    await auditAction('user_deleted', req, user._id, 'User');
    res.json({ message: 'Utilisateur désactivé avec succès.' });
  } catch (err) {
    next(err);
  }
};

// GET /api/users/merchants — liste des marchands avec leur compte
exports.getMerchants = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = { role: 'merchant' };
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [merchants, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);

    // Récupère les soldes des comptes
    const merchantIds = merchants.map((m) => m._id);
    const accounts = await Account.find({ merchantId: { $in: merchantIds } });
    const accountMap = accounts.reduce((acc, a) => {
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
  } catch (err) {
    next(err);
  }
};
