const Report = require('../models/Report');
const Transaction = require('../models/Transaction');
const { auditAction } = require('../middleware/auditMiddleware');
const mongoose = require('mongoose');

// Génère ou met à jour un rapport journalier
const generateDailyReport = async (merchantId, dateStr) => {
  const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
  const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

  const mId = typeof merchantId === 'string'
    ? mongoose.Types.ObjectId.createFromHexString(merchantId)
    : merchantId;

  const agg = await Transaction.aggregate([
    {
      $match: {
        merchantId: mId,
        isDeleted: false,
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      },
    },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
        fees: { $sum: '$fee' },
      },
    },
  ]);

  const statusAgg = await Transaction.aggregate([
    {
      $match: {
        merchantId: mId,
        isDeleted: false,
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      },
    },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const byType = agg.reduce((acc, row) => { acc[row._id] = row; return acc; }, {});
  const byStatus = statusAgg.reduce((acc, row) => { acc[row._id] = row.count; return acc; }, {});

  const totalDeposits = byType.deposit?.total || 0;
  const totalWithdrawals = byType.withdrawal?.total || 0;
  const totalTransfers = byType.transfer?.total || 0;
  const totalRefunds = byType.refund?.total || 0;
  const totalFees = agg.reduce((sum, r) => sum + (r.fees || 0), 0);
  const totalRevenue = totalDeposits + totalRefunds;
  const benefit = totalRevenue - totalWithdrawals - totalTransfers - totalFees;
  const transactionsCount = agg.reduce((sum, r) => sum + r.count, 0);

  return Report.findOneAndUpdate(
    { merchantId: mId, date: dateStr, period: 'daily' },
    {
      totalDeposits, totalWithdrawals, totalTransfers, totalRefunds,
      totalRevenue, totalFees, benefit, transactionsCount,
      completedCount: byStatus.completed || 0,
      failedCount: byStatus.failed || 0,
      pendingCount: byStatus.pending || 0,
      generatedAt: new Date(),
    },
    { upsert: true, new: true }
  );
};

// GET /api/reports/daily
exports.getDailyReport = async (req, res, next) => {
  try {
    const { date = new Date().toISOString().slice(0, 10), merchantId } = req.query;
    const mId = req.user.role === 'merchant' ? req.user._id : merchantId;

    const report = await generateDailyReport(mId, date);
    await auditAction('report_generated', req, report._id, 'Report', { date, period: 'daily' });
    res.json({ report });
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/range — rapport sur une période
exports.getRangeReport = async (req, res, next) => {
  try {
    const { startDate, endDate, merchantId, period = 'daily' } = req.query;
    const mId = req.user.role === 'merchant' ? req.user._id.toString() : merchantId;

    const filter = { period };
    if (mId) filter.merchantId = mId;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = startDate;
      if (endDate) filter.date.$lte = endDate;
    }

    const reports = await Report.find(filter)
      .populate('merchantId', 'name businessName')
      .sort({ date: 1 });

    res.json({ reports });
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/global — vue super_admin multi-marchands
exports.getGlobalReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = {};
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = startDate;
      if (endDate) filter.date.$lte = endDate;
    }

    const global = await Report.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalDeposits: { $sum: '$totalDeposits' },
          totalWithdrawals: { $sum: '$totalWithdrawals' },
          totalRevenue: { $sum: '$totalRevenue' },
          totalFees: { $sum: '$totalFees' },
          benefit: { $sum: '$benefit' },
          transactionsCount: { $sum: '$transactionsCount' },
          merchantsCount: { $addToSet: '$merchantId' },
        },
      },
      {
        $project: {
          _id: 0,
          totalDeposits: 1,
          totalWithdrawals: 1,
          totalRevenue: 1,
          totalFees: 1,
          benefit: 1,
          transactionsCount: 1,
          merchantsCount: { $size: '$merchantsCount' },
        },
      },
    ]);

    res.json({ global: global[0] || {} });
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/chart — données pour graphiques
exports.getChartData = async (req, res, next) => {
  try {
    const { merchantId, days = 30 } = req.query;
    const mId = req.user.role === 'merchant' ? req.user._id.toString() : merchantId;

    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));
    const sinceStr = since.toISOString().slice(0, 10);

    const filter = { period: 'daily', date: { $gte: sinceStr } };
    if (mId) filter.merchantId = mId;

    const data = await Report.find(filter).sort({ date: 1 }).select('date totalDeposits totalWithdrawals benefit transactionsCount');

    res.json({ chartData: data });
  } catch (err) {
    next(err);
  }
};
