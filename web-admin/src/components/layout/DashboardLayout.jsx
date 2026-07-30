import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import ToastContainer from '../ui/Toast';
import { useLocation } from 'react-router-dom';

const PAGE_TITLES = {
  '/':              'Tableau de bord',
  '/transactions':  'Transactions',
  '/accounts':      'Comptes',
  '/reports':       'Rapports',
  '/merchants':     'Marchands',
  '/users':         'Utilisateurs',
  '/notifications': 'Notifications',
  '/audit':         'Journal d\'audit',
  '/settings':      'Paramètres',
};

const DashboardLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || 'GestionMoMo';

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
