const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect);
router.use(restrictTo('super_admin', 'merchant'));

router.get('/daily', reportController.getDailyReport);
router.get('/range', reportController.getRangeReport);
router.get('/global', restrictTo('super_admin'), reportController.getGlobalReport);
router.get('/chart', reportController.getChartData);

module.exports = router;
