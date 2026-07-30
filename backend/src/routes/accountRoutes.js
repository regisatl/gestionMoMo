const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect);

router.get('/me', restrictTo('merchant'), accountController.getMyAccount);
router.get('/', restrictTo('super_admin'), accountController.getAllAccounts);
router.post('/', restrictTo('super_admin'), accountController.createAccount);
router.patch('/:id', restrictTo('super_admin'), accountController.updateAccount);
router.post('/:id/sync', restrictTo('super_admin', 'merchant'), accountController.syncBalance);

module.exports = router;
