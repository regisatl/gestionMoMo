const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const transactionSchema = new mongoose.Schema(
  {
    reference: {
      type: String,
      unique: true,
      default: () => `TXN-${uuidv4().toUpperCase().replace(/-/g, '').slice(0, 12)}`,
    },
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // Numéro MoMo du client (peut être extérieur au système)
    clientPhone: { type: String, trim: true, default: null },
    clientName: { type: String, trim: true, default: null },

    type: {
      type: String,
      enum: ['deposit', 'withdrawal', 'transfer', 'payment', 'refund'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [1, 'Le montant doit être supérieur à 0'],
    },
    fee: { type: Number, default: 0 },
    currency: { type: String, default: 'XOF' },

    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
      default: 'pending',
    },

    // Données MTN MoMo
    momoReferenceId: { type: String, default: null },
    momoStatus: { type: String, default: null },
    momoReason: { type: String, default: null },

    description: { type: String, trim: true, default: null },

    // Soft delete
    isDeleted: { type: Boolean, default: false },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    deletedAt: { type: Date, default: null },
    deleteReason: { type: String, default: null },
    restoredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    restoredAt: { type: Date, default: null },

    // Metadata
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
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

// Index pour filtres fréquents
transactionSchema.index({ merchantId: 1, createdAt: -1 });
transactionSchema.index({ clientId: 1, createdAt: -1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ isDeleted: 1 });
transactionSchema.index({ reference: 1 });

// Filtre automatique des transactions supprimées
transactionSchema.pre(/^find/, function (next) {
  if (this.getOptions().includeDeleted !== true) {
    this.where({ isDeleted: false });
  }
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);
