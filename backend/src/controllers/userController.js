const User = require('../models/User');
const Account = require('../models/Account');
const { auditAction } = require('../middleware/auditMiddleware');

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
