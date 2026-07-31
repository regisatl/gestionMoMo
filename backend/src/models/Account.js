const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema(
  {
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    momoAccountNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: [0, 'Le solde ne peut pas être négatif'],
    },
    currency: {
      type: String,
      default: 'XOF',
      enum: ['XOF', 'XAF', 'USD', 'EUR'],
    },
    // Identifiants API MTN MoMo
    momoUserId: { type: String, default: null },
    momoApiKey: { type: String, default: null, select: false },
    momoEnvironment: {
      type: String,
      enum: ['sandbox', 'production'],
      default: 'sandbox',
    },
    lastSync: { type: Date, default: null },
    isActive: { type: Boolean, default: true },

    // Stats rapides
    totalDeposits: { type: Number, default: 0 },
    totalWithdrawals: { type: Number, default: 0 },
    totalTransactions: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.momoApiKey;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// merchantId et momoAccountNumber ont déjà un index via unique:true dans le schema

module.exports = mongoose.model('Account', accountSchema);
