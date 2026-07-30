const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect);
router.use(restrictTo('super_admin'));

router.get('/', auditController.getAuditLogs);

module.exports = router;
