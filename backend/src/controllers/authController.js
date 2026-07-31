const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { auditAction } = require('../middleware/auditMiddleware');

// Génère un access token (courte durée)
const signAccessToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// Génère un refresh token (longue durée)
const signRefreshToken = (id) =>
  jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });

// POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, phone, email, password, role, businessName } = req.body;

    // Seul un super_admin peut créer des marchands
    if (role === 'merchant' && (!req.user || req.user.role !== 'super_admin')) {
      return res.status(403).json({ error: 'Seul un super admin peut créer un marchand.' });
    }

    const user = await User.create({
      name,
      phone,
      email,
      passwordHash: password,
      role: role || 'client',
      status: 'active',
      businessName: businessName || null,
    });

    await auditAction('user_created', { user: { _id: 'system' }, ip: req.ip, headers: req.headers }, user._id, 'User', { role, phone });

    const accessToken = signAccessToken(user._id);
    const refreshToken = signRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res.status(201).json({ user, accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { phone, password } = req.body;

    const user = await User.findOne({ phone }).select('+passwordHash +refreshToken');
    if (!user || !(await user.comparePassword(password))) {
      await AuditFail(req, phone);
      return res.status(401).json({ error: 'Numéro de téléphone ou mot de passe incorrect.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: `Compte ${user.status}. Contactez l\'administrateur.` });
    }

    const accessToken = signAccessToken(user._id);
    const refreshToken = signRefreshToken(user._id);

    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    await auditAction('user_login', { user, ip: req.ip, headers: req.headers });

    res.json({ user, accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
};

// Audit d'un échec de connexion (sans req.user)
async function AuditFail(req, phone) {
  const { AuditLog } = require('../models/AuditLog') || {};
  try {
    const AuditLogModel = require('../models/AuditLog');
    await AuditLogModel.create({
      action: 'user_login_failed',
      performedBy: '000000000000000000000000',
      details: { phone },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  } catch (_) {}
}

// POST /api/auth/refresh
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token manquant.' });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ error: 'Refresh token invalide ou expiré.' });
    }

    const newAccessToken = signAccessToken(user._id);
    const newRefreshToken = signRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/logout
exports.logout = async (req, res, next) => {
  try {
    req.user.refreshToken = undefined;
    await req.user.save({ validateBeforeSave: false });
    await auditAction('user_logout', req);
    res.json({ message: 'Déconnexion réussie.' });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  res.json({ user: req.user });
};

// PATCH /api/auth/change-password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+passwordHash');

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ error: 'Mot de passe actuel incorrect.' });
    }

    user.passwordHash = newPassword;
    await user.save();
    await auditAction('password_changed', req, user._id, 'User');

    res.json({ message: 'Mot de passe modifié avec succès.' });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/auth/change-pin  — Mobile : change le PIN à 5 chiffres
exports.changePin = async (req, res, next) => {
  try {
    const { currentPin, newPin } = req.body;
    const user = await User.findById(req.user._id).select('+passwordHash');

    if (!(await user.comparePassword(currentPin))) {
      return res.status(400).json({ error: 'PIN actuel incorrect.' });
    }

    user.passwordHash = newPin;
    await user.save();
    await auditAction('pin_changed', req, user._id, 'User');

    res.json({ message: 'PIN modifié avec succès.' });
  } catch (err) {
    next(err);
  }
};
