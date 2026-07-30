const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['super_admin', 'merchant', 'client'],
      required: true,
      unique: true,
    },
    // Gestion des utilisateurs
    canCreateMerchant: { type: Boolean, default: false },
    canDeleteMerchant: { type: Boolean, default: false },
    canSuspendUser: { type: Boolean, default: false },
    canViewAllUsers: { type: Boolean, default: false },

    // Transactions
    canCreateTransaction: { type: Boolean, default: false },
    canDeleteTransaction: { type: Boolean, default: false },
    canRestoreTransaction: { type: Boolean, default: false },
    canViewAllTransactions: { type: Boolean, default: false },

    // Rapports
    canViewReports: { type: Boolean, default: false },
    canViewGlobalReports: { type: Boolean, default: false },
    canExportReports: { type: Boolean, default: false },

    // Comptes
    canViewAccounts: { type: Boolean, default: false },
    canManageAccounts: { type: Boolean, default: false },

    // Notifications
    canSendBroadcastNotification: { type: Boolean, default: false },

    // Audit
    canViewAuditLogs: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Permissions par défaut pour chaque rôle
permissionSchema.statics.getDefaults = () => [
  {
    role: 'super_admin',
    canCreateMerchant: true,
    canDeleteMerchant: true,
    canSuspendUser: true,
    canViewAllUsers: true,
    canCreateTransaction: true,
    canDeleteTransaction: true,
    canRestoreTransaction: true,
    canViewAllTransactions: true,
    canViewReports: true,
    canViewGlobalReports: true,
    canExportReports: true,
    canViewAccounts: true,
    canManageAccounts: true,
    canSendBroadcastNotification: true,
    canViewAuditLogs: true,
  },
  {
    role: 'merchant',
    canCreateTransaction: true,
    canViewReports: true,
    canExportReports: true,
    canViewAccounts: true,
  },
  {
    role: 'client',
    canCreateTransaction: false,
    canViewReports: false,
  },
];

module.exports = mongoose.model('Permission', permissionSchema);
