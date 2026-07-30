const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Date du rapport (YYYY-MM-DD)
    date: { type: String, required: true },
    period: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'daily',
    },

    // Agrégats
    totalDeposits: { type: Number, default: 0 },
    totalWithdrawals: { type: Number, default: 0 },
    totalTransfers: { type: Number, default: 0 },
    totalRefunds: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    totalFees: { type: Number, default: 0 },
    benefit: { type: Number, default: 0 },
    transactionsCount: { type: Number, default: 0 },

    // Breakdown par statut
    completedCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    pendingCount: { type: Number, default: 0 },

    // Solde début/fin de période
    openingBalance: { type: Number, default: 0 },
    closingBalance: { type: Number, default: 0 },

    generatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Un seul rapport par marchand par date/période
reportSchema.index({ merchantId: 1, date: 1, period: 1 }, { unique: true });

module.exports = mongoose.model('Report', reportSchema);
