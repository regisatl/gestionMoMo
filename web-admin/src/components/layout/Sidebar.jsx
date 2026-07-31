import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ArrowLeftRight, CreditCard, BarChart2,
  Store, Users, Bell, ClipboardList, Settings, LogOut,
  Wallet, ChevronLeft,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  { path: '/',              label: 'Tableau de bord', Icon: LayoutDashboard, roles: ['super_admin', 'merchant'] },
  { path: '/transactions',  label: 'Transactions',    Icon: ArrowLeftRight,  roles: ['super_admin', 'merchant'] },
  { path: '/accounts',      label: 'Comptes',         Icon: CreditCard,      roles: ['super_admin', 'merchant'] },
  { path: '/reports',       label: 'Rapports',        Icon: BarChart2,       roles: ['super_admin', 'merchant'] },
  { path: '/merchants',     label: 'Marchands',       Icon: Store,           roles: ['super_admin'] },
  { path: '/users',         label: 'Utilisateurs',    Icon: Users,           roles: ['super_admin'] },
  { path: '/notifications', label: 'Notifications',   Icon: Bell,            roles: ['super_admin', 'merchant'] },
  { path: '/audit',         label: 'Audit',           Icon: ClipboardList,   roles: ['super_admin'] },
  { path: '/settings',      label: 'Paramètres',      Icon: Settings,        roles: ['super_admin', 'merchant'] },
];

const Sidebar = ({ collapsed, onToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(user?.role));

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside style={{
      width: collapsed ? '64px' : '240px',
      minHeight: '100vh',
      background: 'var(--sidebar-bg)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      transition: 'width 0.25s ease',
      overflow: 'hidden',
      flexShrink: 0,
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
              GestionMoMo
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
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              title={collapsed ? item.label : undefined}
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
                  {!collapsed && item.label}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Utilisateur connecté */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '12px 8px' }}>
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
              <div style={{ fontFamily: 'var(--font)', fontSize: '11px', color: 'var(--text-secondary)' }}>
                {user?.role === 'super_admin' ? 'Super Admin'
                  : user?.role === 'merchant' ? 'Marchand' : 'Client'}
              </div>
            </div>
          </div>
        )}

        {/* Bouton déconnexion */}
        <button
          onClick={handleLogout}
          title="Déconnexion"
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            width: '100%', padding: '10px 12px', borderRadius: '10px',
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'var(--color-error)',
            fontFamily: 'var(--font)', fontWeight: 500, fontSize: '14px',
            transition: 'background 0.15s',
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-error-light)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <LogOut size={18} strokeWidth={2} style={{ flexShrink: 0 }} />
          {!collapsed && 'Déconnexion'}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
