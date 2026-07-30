const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

// POST /api/auth/register
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Le nom est requis'),
    body('phone').trim().notEmpty().withMessage('Le numéro de téléphone est requis'),
    body('password').isLength({ min: 8 }).withMessage('Mot de passe : minimum 8 caractères'),
  ],
  validate,
  authController.register
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('phone').trim().notEmpty().withMessage('Numéro de téléphone requis'),
    body('password').notEmpty().withMessage('Mot de passe requis'),
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

// PATCH /api/auth/change-password
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

module.exports = router;
