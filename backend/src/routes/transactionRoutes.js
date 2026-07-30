const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const transactionController = require('../controllers/transactionController');
const { protect, restrictTo } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(protect);

router.get('/', transactionController.getTransactions);
router.get('/stats', transactionController.getStats);
router.get('/:id', transactionController.getTransactionById);

router.post(
  '/',
  restrictTo('merchant', 'super_admin'),
  [
    body('type').isIn(['deposit', 'withdrawal', 'transfer', 'payment', 'refund']).withMessage('Type invalide'),
    body('amount').isFloat({ min: 1 }).withMessage('Montant invalide'),
    body('clientPhone').notEmpty().withMessage('Numéro client requis'),
  ],
  validate,
  transactionController.createTransaction
);

router.patch('/:id/status', restrictTo('super_admin', 'merchant'), transactionController.updateTransactionStatus);
router.delete('/:id', restrictTo('super_admin', 'merchant'), transactionController.deleteTransaction);
router.patch('/:id/restore', restrictTo('super_admin'), transactionController.restoreTransaction);

module.exports = router;
