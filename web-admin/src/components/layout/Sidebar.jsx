import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ArrowLeftRight, CreditCard, BarChart2,
  Store, Users, Bell, ClipboardList, Settings, LogOut,
  Wallet, ChevronLeft,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import styles from './Sidebar.module.css';
import Tooltip from '../ui/Tooltip';

const Sidebar = ({ collapsed, onToggle }) => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { addToast } = useNotifications();
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = React.useState(false);

  const NAV_ITEMS = [
    { path: '/',              labelKey: 'nav.dashboard',     Icon: LayoutDashboard, roles: ['super_admin', 'merchant'] },
    { path: '/transactions',  labelKey: 'nav.transactions',  Icon: ArrowLeftRight,  roles: ['super_admin', 'merchant'] },
    { path: '/accounts',      labelKey: 'nav.accounts',      Icon: CreditCard,      roles: ['super_admin', 'merchant'] },
    { path: '/reports',       labelKey: 'nav.reports',       Icon: BarChart2,       roles: ['super_admin', 'merchant'] },
    { path: '/merchants',     labelKey: 'nav.merchants',     Icon: Store,           roles: ['super_admin'] },
    { path: '/users',         labelKey: 'nav.users',         Icon: Users,           roles: ['super_admin'] },
    { path: '/notifications', labelKey: 'nav.notifications', Icon: Bell,            roles: ['super_admin', 'merchant'] },
    { path: '/audit',         labelKey: 'nav.audit',         Icon: ClipboardList,   roles: ['super_admin'] },
    { path: '/settings',      labelKey: 'nav.settings',      Icon: Settings,        roles: ['super_admin', 'merchant'] },
  ];

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(user?.role));

  const handleLogoutConfirmed = async () => {
    setShowConfirm(false);
    await logout();
    addToast({ type: 'success', title: t('toast.logoutSuccess'), message: t('toast.logoutSuccessMsg') });
    navigate('/login');
  };

  return (
    <>
      <aside style={{
        width: collapsed ? '64px' : '240px',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.25s ease',
        overflow: 'hidden',
        flexShrink: 0,
        zIndex: 100,
      }}>
      {/* Logo */}
      <div
        onClick={onToggle}
        style={{
          height: '64px', display: 'flex', alignItems: 'center',
          padding: collapsed ? '0 15px' : '0 16px',
          gap: '10px', borderBottom: '1px solid var(--border)',
          cursor: 'pointer',
          justifyContent: collapsed ? 'center' : 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '34px', height: '34px', borderRadius: '10px',
            background: 'var(--color-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Wallet size={18} color="#fff" strokeWidth={2} />
          </div>
          {!collapsed && (
            <span style={{
              fontFamily: 'var(--font)', fontWeight: 800, fontSize: '16px',
              color: 'var(--text)', whiteSpace: 'nowrap',
            }}>
              {t('common.appName')}
            </span>
          )}
        </div>
        {!collapsed && <ChevronLeft size={16} color="var(--text-secondary)" />}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {visibleItems.map((item) => {
          const { Icon } = item;
          return (
            <Tooltip key={item.path} content={collapsed ? t(item.labelKey) : null} placement="right">
              <NavLink
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  [
                    styles.navLink,
                    collapsed ? styles.navLinkCollapsed : '',
                    isActive ? styles.navLinkActive : '',
                  ].join(' ')
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 2} style={{ flexShrink: 0 }} />
                    {!collapsed && t(item.labelKey)}
                  </>
                )}
              </NavLink>
            </Tooltip>
          );
        })}
      </nav>

      {/* Utilisateur connecté — fixé en bas */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '12px 8px', marginTop: 'auto' }}>
        {!collapsed && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '8px 12px', marginBottom: '4px',
          }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'var(--color-primary-alpha)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font)', fontWeight: 700, fontSize: '14px',
              color: 'var(--color-primary)', flexShrink: 0,
            }}>
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{
                fontFamily: 'var(--font)', fontWeight: 600, fontSize: '13px',
                color: 'var(--text)', overflow: 'hidden',
                textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {user?.name}
              </div>
              <div style={{
                fontFamily: 'var(--font)', fontWeight: 400, fontSize: '11px',
                color: 'var(--text-secondary)', overflow: 'hidden',
                textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {user?.phone}
              </div>
            </div>
          </div>
        )}

        {/* Bouton déconnexion */}
        <Tooltip content={collapsed ? t('nav.logout') : null} placement="right">
          <button
            onClick={() => setShowConfirm(true)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              gap: collapsed ? '0' : '10px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              padding: collapsed ? '10px' : '10px 12px',
              borderRadius: '10px', border: 'none',
              background: 'transparent', cursor: 'pointer',
              fontFamily: 'var(--font)', fontWeight: 500, fontSize: '13px',
              color: 'var(--color-error)',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-error-light)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <LogOut size={16} strokeWidth={2} />
            {!collapsed && t('nav.logout')}
          </button>
        </Tooltip>
      </div>
    </aside>

      {/* Modale de confirmation de déconnexion */}
      {showConfirm && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 999,
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '32px',
            width: '360px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            display: 'flex', flexDirection: 'column', gap: '20px',
          }}>
            {/* Icône */}
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%',
              background: 'var(--color-error-light, #fee2e2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto',
            }}>
              <LogOut size={22} color="var(--color-error)" strokeWidth={2} />
            </div>

            {/* Texte */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: 'var(--font)', fontWeight: 700, fontSize: '16px',
                color: 'var(--text)', marginBottom: '8px',
              }}>
                {t('auth.logoutConfirmTitle')}
              </div>
              <div style={{
                fontFamily: 'var(--font)', fontWeight: 400, fontSize: '13px',
                color: 'var(--text-secondary)',
              }}>
                {t('auth.logoutConfirmMessage')}
              </div>
            </div>

            {/* Boutons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowConfirm(false)}
                style={{
                  flex: 1, padding: '10px',
                  borderRadius: '10px', border: '1px solid var(--border)',
                  background: 'transparent', cursor: 'pointer',
                  fontFamily: 'var(--font)', fontWeight: 500, fontSize: '13px',
                  color: 'var(--text)',
                }}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleLogoutConfirmed}
                style={{
                  flex: 1, padding: '10px',
                  borderRadius: '10px', border: 'none',
                  background: 'var(--color-error)', cursor: 'pointer',
                  fontFamily: 'var(--font)', fontWeight: 600, fontSize: '13px',
                  color: '#fff',
                }}
              >
                {t('nav.logout')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
