const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    type: {
      type: String,
      enum: ['success', 'error', 'info', 'warning', 'transaction', 'system'],
      default: 'info',
    },
    // Lien vers la ressource concernée
    resourceType: {
      type: String,
      enum: ['transaction', 'account', 'user', 'report', null],
      default: null,
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
    // Broadcast : notification pour tous les utilisateurs d'un rôle
    isBroadcast: { type: Boolean, default: false },
    broadcastRole: {
      type: String,
      enum: ['super_admin', 'merchant', 'client', 'all', null],
      default: null,
    },
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

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ isBroadcast: 1, broadcastRole: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
