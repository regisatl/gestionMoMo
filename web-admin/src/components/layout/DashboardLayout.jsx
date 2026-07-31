import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Sidebar from './Sidebar';
import Header from './Header';
import ToastContainer from '../ui/Toast';

const PAGE_TITLE_KEYS = {
  '/':              'nav.dashboard',
  '/transactions':  'nav.transactions',
  '/accounts':      'nav.accounts',
  '/reports':       'nav.reports',
  '/merchants':     'nav.merchants',
  '/users':         'nav.users',
  '/notifications': 'nav.notifications',
  '/audit':         'nav.audit',
  '/settings':      'nav.settings',
};

const DashboardLayout = ({ children }) => {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const titleKey = PAGE_TITLE_KEYS[location.pathname] || 'common.appName';
  const title = t(titleKey);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header title={title} sidebarCollapsed={collapsed} onToggleSidebar={() => setCollapsed((v) => !v)} />
        <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          {children}
        </main>
      </div>
      <ToastContainer />
    </div>
  );
};

export default DashboardLayout;
