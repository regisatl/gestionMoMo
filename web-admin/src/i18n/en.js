const en = {
  // ─── Common ───────────────────────────────────────────────────
  common: {
    appName: 'GestionMoMo',
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    delete: 'Delete',
    edit: 'Edit',
    seeAll: 'See all →',
    noData: 'No data yet',
    error: 'An error occurred',
    retry: 'Retry',
    search: 'Search',
    all: 'All',
    version: '© 2025 GestionMoMo — v1.0.0',
    actions: 'Actions',
    status: 'Status',
    date: 'Date',
    previous: '← Prev.',
    next: 'Next →',
    page: 'Page {{current}} of {{total}}',
    of: '/',
  },

  // ─── Auth ─────────────────────────────────────────────────────
  auth: {
    subtitle: 'Sign in to the admin panel',
    phoneLabel: 'Phone number',
    phonePlaceholder: '+229 00 00 00 00 00 00',
    passwordLabel: 'Password',
    passwordPlaceholder: '••••••••',
    loginButton: 'Sign in',
    invalidCredentials: 'Invalid credentials.',
    logoutConfirmTitle: 'Sign out',
    logoutConfirmMessage: 'Are you sure you want to sign out?',
  },

  // ─── Toast messages ───────────────────────────────────────────
  toast: {
    // Settings
    profileSaved:        'Profile updated',
    profileSavedMsg:     'Your information has been saved.',
    profileError:        'Save failed',
    passwordChanged:     'Password changed',
    passwordChangedMsg:  'Your new password is active.',
    passwordError:       'Error',
    passwordMismatch:    'Passwords do not match.',
    passwordTooShort:    'Minimum 8 characters required.',
    // Merchants
    merchantSuspended:   'Merchant suspended',
    merchantActivated:   'Merchant activated',
    merchantActionError: 'Action failed',
    // Notifications
    allMarkedRead:       'All notifications read',
    allMarkedReadMsg:    'Your inbox is now empty.',
    // Auth
    logoutSuccess:       'Signed out',
    logoutSuccessMsg:    'See you next time.',
  },

  // ─── Sidebar / Navigation ─────────────────────────────────────
  nav: {
    dashboard: 'Dashboard',
    transactions: 'Transactions',
    accounts: 'Accounts',
    reports: 'Reports',
    merchants: 'Merchants',
    users: 'Users',
    notifications: 'Notifications',
    audit: 'Audit',
    settings: 'Settings',
    logout: 'Sign out',
  },

  // ─── Header ───────────────────────────────────────────────────
  header: {
    lightMode: 'Light mode',
    darkMode: 'Dark mode',
    notifications: 'Notifications',
    notifCount: '({{count}})',
    markAllRead: 'Mark all as read',
    noNotifications: 'No notifications',
    seeAllNotifications: 'See all notifications',
  },

  // ─── Dashboard ────────────────────────────────────────────────
  dashboard: {
    todayDeposits: "Today's deposits",
    todayWithdrawals: "Today's withdrawals",
    transactions: 'Transactions',
    todayBenefit: "Today's benefit",
    globalRevenue: 'Global revenue',
    depositsWithdrawals30: 'Deposits & Withdrawals (30 days)',
    benefitEvolution: 'Benefit trend',
    transactionStatusToday: "Today's transaction status",
    recentTransactions: 'Recent transactions',
    noTransactions: 'No transactions',
    tableHeaders: {
      reference: 'Reference',
      client: 'Client',
      type: 'Type',
      amount: 'Amount',
      status: 'Status',
      date: 'Date',
    },
    chartLabels: {
      deposits: 'Deposits',
      withdrawals: 'Withdrawals',
      benefit: 'Benefit',
      completed: 'Completed',
      pending: 'Pending',
      failed: 'Failed',
    },
  },

  // ─── Transactions ─────────────────────────────────────────────
  transactions: {
    tableHeaders: {
      reference: 'Reference',
      merchant: 'Merchant',
      client: 'Client',
      type: 'Type',
      amount: 'Amount',
      fees: 'Fees',
      status: 'Status',
      date: 'Date',
    },
    filters: {
      allStatuses: 'All statuses',
      pending: 'Pending',
      completed: 'Completed',
      failed: 'Failed',
      cancelled: 'Cancelled',
      all: 'All',
      deposits: 'Deposits',
      withdrawals: 'Withdrawals',
      transfers: 'Transfers',
    },
    searchPlaceholder: 'Reference, phone, name...',
    loadingText: 'Loading...',
    noTransactions: 'No transactions',
    transactionCount: '{{count}} transaction',
    transactionCountPlural: '{{count}} transactions',
    view: 'View',
    types: {
      deposit: 'Deposit',
      withdrawal: 'Withdrawal',
      transfer: 'Transfer',
      payment: 'Payment',
      refund: 'Refund',
    },
  },

  // ─── Reports ──────────────────────────────────────────────────
  reports: {
    periodDays: '{{days}}d',
    totalDeposits: 'Total deposits',
    totalWithdrawals: 'Total withdrawals',
    totalRevenue: 'Total revenue',
    totalBenefit: 'Total benefit',
    activeMerchants: 'Active merchants',
    transactionsCount: 'No. transactions',
    depositsWithdrawals: 'Deposits & Withdrawals — last {{days}} days',
    benefitVolume: 'Benefit & Transaction volume',
    dailyDetail: 'Daily breakdown',
    tableHeaders: {
      date: 'Date',
      deposits: 'Deposits',
      withdrawals: 'Withdrawals',
      transactions: 'Transactions',
      benefit: 'Benefit',
    },
    chartLabels: {
      deposits: 'Deposits',
      withdrawals: 'Withdrawals',
      benefit: 'Benefit',
      transactions: 'Transactions',
    },
    noData: 'No data yet',
  },

  // ─── Merchants ────────────────────────────────────────────────
  merchants: {
    newMerchant: 'New merchant',
    searchPlaceholder: 'Name, phone...',
    tableHeaders: {
      merchant: 'Merchant',
      phone: 'Phone',
      momoAccount: 'MoMo Account',
      balance: 'Balance',
      status: 'Status',
      createdAt: 'Created on',
      actions: 'Actions',
    },
    filters: {
      allStatuses: 'All statuses',
      active: 'Active',
      inactive: 'Inactive',
      suspended: 'Suspended',
    },
    loading: 'Loading...',
    noMerchants: 'No merchants',
    merchantCount: '{{count}} merchant',
    merchantCountPlural: '{{count}} merchants',
    suspend: 'Suspend',
    activate: 'Activate',
  },

  // ─── Notifications ────────────────────────────────────────────
  notifications: {
    unread: '{{count}} unread',
    unreadPlural: '{{count}} unread',
    allRead: 'All caught up',
    markAllRead: 'Mark all as read',
    noNotifications: 'No notifications',
  },

  // ─── Audit ────────────────────────────────────────────────────
  audit: {
    allActions: 'All actions',
    actions: {
      user_login: 'Login',
      user_login_failed: 'Failed login',
      user_created: 'User created',
      user_suspended: 'Suspension',
      transaction_created: 'Transaction created',
      transaction_deleted: 'Transaction deleted',
      password_changed: 'Password changed',
      momo_callback_received: 'MoMo callback',
    },
    tableHeaders: {
      timestamp: 'Timestamp',
      action: 'Action',
      performedBy: 'Performed by',
      target: 'Target',
      ip: 'IP',
      details: 'Details',
    },
    loading: 'Loading...',
    noLogs: 'No audit logs',
    entryCount: '{{count}} entry',
    entryCountPlural: '{{count}} entries',
  },

  // ─── Settings ─────────────────────────────────────────────────
  settings: {
    profileTitle: 'Profile information',
    fullNameLabel: 'Full name',
    emailLabel: 'Email',
    businessNameLabel: 'Business name',
    phoneLabel: 'Phone',
    roleLabel: 'Role',
    saveProfile: 'Save',
    profileSuccess: 'Profile updated successfully.',
    profileError: 'Error saving profile.',
    appearanceTitle: 'Appearance',
    darkModeLabel: 'Dark mode',
    darkModeDesc: 'Switch between light and dark theme',
    languageTitle: 'Language',
    languageDesc: 'Choose the interface language',
    securityTitle: 'Security — Change password',
    currentPasswordLabel: 'Current password',
    newPasswordLabel: 'New password',
    confirmPasswordLabel: 'Confirm new password',
    changePasswordButton: 'Change password',
    passwordMismatch: 'Passwords do not match.',
    passwordTooShort: 'Minimum 8 characters required.',
    passwordSuccess: 'Password changed successfully.',
    passwordError: 'Error.',
    roles: {
      super_admin: 'Super Administrator',
      merchant: 'Merchant',
      client: 'Client',
    },
    languageNames: {
      fr: 'Français',
      en: 'English',
    },
  },

  // ─── Badges/Statuses ──────────────────────────────────────────
  badge: {
    active: 'Active',
    inactive: 'Inactive',
    suspended: 'Suspended',
    pending: 'Pending',
    completed: 'Completed',
    failed: 'Failed',
    cancelled: 'Cancelled',
  },
};

export default en;
