const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect);

// Liste & création
router.get('/',          restrictTo('super_admin'), userController.getAllUsers);
router.post('/',         restrictTo('super_admin'), userController.createUser);
router.get('/merchants', restrictTo('super_admin'), userController.getMerchants);

// Actions sur un utilisateur spécifique
router.get('/:id',              userController.getUserById);
router.patch('/:id',            userController.updateUser);
router.patch('/:id/status',     restrictTo('super_admin'), userController.updateUserStatus);
router.patch('/:id/reset-password', restrictTo('super_admin'), userController.resetPassword);
router.patch('/:id/reset-pin',  restrictTo('super_admin'), userController.resetPin);
router.patch('/:id/restore',    restrictTo('super_admin'), userController.restoreUser);
router.delete('/:id',           restrictTo('super_admin'), userController.deleteUser);

module.exports = router;
