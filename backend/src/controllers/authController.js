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
    const { name, phone, email, password, pin, role, businessName } = req.body;

    // Seul un super_admin peut créer des marchands
    if (role === 'merchant' && (!req.user || req.user.role !== 'super_admin')) {
      return res.status(403).json({ error: 'Seul un super admin peut créer un marchand.' });
    }

    if (!password && !pin) {
      return res.status(400).json({ error: 'Un mot de passe (web) ou un PIN (mobile) est requis.' });
    }

    const user = await User.create({
      name,
      phone,
      email,
      passwordHash: password || null,
      pinHash:      pin      || null,
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
    const { phone, password, pin, loginType } = req.body;

    // loginType: 'pin' → mobile, 'password' → web-admin
    // Fallback : si loginType absent, on devine selon ce qui est fourni
    const isMobile = loginType === 'pin' || (!loginType && pin && !password);
    const credential = isMobile ? pin : password;

    if (!credential) {
      return res.status(400).json({ error: 'Identifiant de connexion manquant (password ou pin).' });
    }

    const user = await User.findOne({ phone }).select('+passwordHash +pinHash +refreshToken');
    if (!user) {
      await AuditFail(req, phone);
      return res.status(401).json({ error: 'Numéro de téléphone ou identifiant incorrect.' });
    }

    // Vérifie le bon champ selon le type de connexion
    const isValid = isMobile
      ? await user.comparePin(credential)
      : await user.comparePassword(credential);

    if (!isValid) {
      await AuditFail(req, phone);
      const msg = isMobile
        ? 'Numéro de téléphone ou PIN incorrect.'
        : 'Numéro de téléphone ou mot de passe incorrect.';
      return res.status(401).json({ error: msg });
    }

    // Le web-admin ne peut pas se connecter avec un PIN, et vice-versa
    if (isMobile && !user.pinHash) {
      return res.status(403).json({ error: 'Ce compte ne possède pas de PIN mobile. Contactez l\'administrateur.' });
    }
    if (!isMobile && !user.passwordHash) {
      return res.status(403).json({ error: 'Ce compte ne possède pas de mot de passe web. Contactez l\'administrateur.' });
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
    const user = await User.findById(req.user._id).select('+pinHash');

    if (!(await user.comparePin(currentPin))) {
      return res.status(400).json({ error: 'PIN actuel incorrect.' });
    }

    user.pinHash = newPin;
    await user.save();
    await auditAction('pin_changed', req, user._id, 'User');

    res.json({ message: 'PIN modifié avec succès.' });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/verify-pin  — Mobile : vérifie l'ancien PIN avant changement
exports.verifyPin = async (req, res, next) => {
  try {
    const { pin } = req.body;
    if (!pin || pin.length !== 5) {
      return res.status(400).json({ error: 'PIN invalide.' });
    }
    const user = await User.findById(req.user._id).select('+pinHash');
    const valid = await user.comparePin(pin);
    if (!valid) {
      return res.status(400).json({ error: 'PIN actuel incorrect.' });
    }
    res.json({ valid: true });
  } catch (err) {
    next(err);
  }
};
