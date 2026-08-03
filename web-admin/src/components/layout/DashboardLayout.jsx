import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import Sidebar from './Sidebar';
import Header from './Header';
import ToastContainer from '../ui/Toast';
import PlexusBackground from '../ui/PlexusBackground';

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
  const { user } = useAuth();
  const { addToast } = useNotifications();

  // Toast de bienvenue affiché une seule fois après la connexion
  // La ref évite le double-déclenchement causé par React.StrictMode
  const welcomeToastFired = React.useRef(false);
  useEffect(() => {
    if (location.state?.justLoggedIn && !welcomeToastFired.current) {
      welcomeToastFired.current = true;
      const firstName = user?.name?.split(' ')[0] || user?.name || '';
      addToast({
        type: 'success',
        title: t('toast.loginSuccess', { name: firstName }),
        message: t('toast.loginSuccessMsg'),
      });
      window.history.replaceState({}, '');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const titleKey = PAGE_TITLE_KEYS[location.pathname] || 'common.appName';
  const title = t(titleKey);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', position: 'relative', overflow: 'hidden' }}>
      {/* Plexus derrière tout le contenu */}
      <PlexusBackground fixed />
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        marginLeft: collapsed ? '64px' : '240px',
        transition: 'margin-left 0.25s ease',
        position: 'relative',
        zIndex: 1,
      }}>
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
