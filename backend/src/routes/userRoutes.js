const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect);

router.get('/', restrictTo('super_admin'), userController.getAllUsers);
router.get('/merchants', restrictTo('super_admin'), userController.getMerchants);
router.get('/:id', userController.getUserById);
router.patch('/:id', userController.updateUser);
router.patch('/:id/status', restrictTo('super_admin'), userController.updateUserStatus);
router.delete('/:id', restrictTo('super_admin'), userController.deleteUser);

module.exports = router;
