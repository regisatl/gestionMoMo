const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

// POST /api/auth/register
// Le mot de passe peut être un PIN à 5 chiffres (mobile) ou un mot de passe (web)
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Le nom est requis'),
    body('phone')
      .trim()
      .notEmpty().withMessage('Le numéro de téléphone est requis')
      .matches(/^\+22901\d{8}$/).withMessage('Numéro invalide. Format attendu : +229 01 XX XX XX XX'),
    body('password').isLength({ min: 5 }).withMessage('Mot de passe / PIN : minimum 5 caractères'),
  ],
  validate,
  authController.register
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('phone')
      .trim()
      .notEmpty().withMessage('Numéro de téléphone requis')
      .matches(/^\+22901\d{8}$/).withMessage('Numéro invalide. Format attendu : +229 01 XX XX XX XX'),
    body('password').notEmpty().withMessage('Mot de passe / PIN requis'),
  ],
  validate,
  authController.login
);

// POST /api/auth/refresh
router.post('/refresh', authController.refreshToken);

// POST /api/auth/logout — authentifié
router.post('/logout', protect, authController.logout);

// GET /api/auth/me
router.get('/me', protect, authController.getMe);

// PATCH /api/auth/change-password (web-admin, min 8 chars)
router.patch(
  '/change-password',
  protect,
  [
    body('currentPassword').notEmpty().withMessage('Mot de passe actuel requis'),
    body('newPassword').isLength({ min: 8 }).withMessage('Nouveau mot de passe : minimum 8 caractères'),
  ],
  validate,
  authController.changePassword
);

// PATCH /api/auth/change-pin (mobile, PIN à 5 chiffres)
router.patch(
  '/change-pin',
  protect,
  [
    body('currentPin')
      .notEmpty().withMessage('PIN actuel requis')
      .isLength({ min: 5, max: 5 }).withMessage('PIN actuel : exactement 5 chiffres')
      .isNumeric().withMessage('Le PIN doit contenir uniquement des chiffres'),
    body('newPin')
      .notEmpty().withMessage('Nouveau PIN requis')
      .isLength({ min: 5, max: 5 }).withMessage('Nouveau PIN : exactement 5 chiffres')
      .isNumeric().withMessage('Le PIN doit contenir uniquement des chiffres'),
  ],
  validate,
  authController.changePin
);

module.exports = router;
