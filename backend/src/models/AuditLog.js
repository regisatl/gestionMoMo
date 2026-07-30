const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        'user_created',
        'user_updated',
        'user_deleted',
        'user_suspended',
        'user_activated',
        'user_login',
        'user_logout',
        'user_login_failed',
        'password_changed',
        'password_reset',
        'transaction_created',
        'transaction_updated',
        'transaction_deleted',
        'transaction_restored',
        'account_created',
        'account_updated',
        'report_generated',
        'permission_updated',
        'notification_sent',
        'momo_callback_received',
        'api_key_generated',
      ],
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    targetModel: {
      type: String,
      enum: ['User', 'Transaction', 'Account', 'Report', 'Permission', null],
      default: null,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
    timestamp: { type: Date, default: Date.now },
  },
  {
    timestamps: false, // On utilise 'timestamp' manuellement
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

auditLogSchema.index({ performedBy: 1, timestamp: -1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ targetId: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
