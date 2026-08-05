const express = require('express');
const router  = express.Router();
const { body } = require('express-validator');
const transactionController = require('../controllers/transactionController');
const { protect, restrictTo } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(protect);

// ─── Types valides ─────────────────────────────────────────────────────────────
const VALID_TYPES = [
  'deposit', 'withdrawal', 'transfer',
  'credit_sale', 'data_sale', 'unlimited',
  'payment', 'refund',
];

// ─── Routes lecture ────────────────────────────────────────────────────────────
router.get('/packages', transactionController.getPackages);   // avant /:id !
router.get('/stats',    transactionController.getStats);
router.get('/',         transactionController.getTransactions);
router.get('/:id',      transactionController.getTransactionById);

// ─── Création ─────────────────────────────────────────────────────────────────
router.post(
  '/',
  restrictTo('merchant', 'super_admin'),
  [
    body('type')
      .isIn(VALID_TYPES)
      .withMessage(`Type invalide. Valeurs acceptées : ${VALID_TYPES.join(', ')}`),

    body('amount')
      .if((value, { req }) => !['data_sale', 'unlimited'].includes(req.body.type))
      .isFloat({ min: 1 })
      .withMessage('Montant invalide (minimum 1 XOF)'),

    body('clientPhone')
      .notEmpty()
      .withMessage('Numéro client requis')
      .matches(/^\+?[0-9]{8,15}$/)
      .withMessage('Format de numéro invalide'),

    body('packageCode')
      .if((value, { req }) => ['data_sale', 'unlimited'].includes(req.body.type))
      .notEmpty()
      .withMessage('packageCode requis pour les forfaits data et illimités'),
  ],
  validate,
  transactionController.createTransaction
);

// ─── Mise à jour statut ────────────────────────────────────────────────────────
router.patch(
  '/:id/status',
  restrictTo('super_admin', 'merchant'),
  transactionController.updateTransactionStatus
);

// ─── Suppression / restauration ───────────────────────────────────────────────
router.delete('/:id',         restrictTo('super_admin', 'merchant'), transactionController.deleteTransaction);
router.patch( '/:id/restore', restrictTo('super_admin'),             transactionController.restoreTransaction);

module.exports = router;
