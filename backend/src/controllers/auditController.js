const AuditLog = require('../models/AuditLog');

// GET /api/audit — super_admin seulement
exports.getAuditLogs = async (req, res, next) => {
  try {
    const { action, userId, startDate, endDate, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (action) filter.action = action;
    if (userId) filter.performedBy = userId;
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('performedBy', 'name phone role')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      AuditLog.countDocuments(filter),
    ]);

    res.json({
      logs,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};
