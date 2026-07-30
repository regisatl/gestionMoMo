import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { path: '/',              label: 'Tableau de bord', icon: '🏠', roles: ['super_admin', 'merchant'] },
  { path: '/transactions',  label: 'Transactions',     icon: '↔',  roles: ['super_admin', 'merchant'] },
  { path: '/accounts',      label: 'Comptes',          icon: '💳',  roles: ['super_admin', 'merchant'] },
  { path: '/reports',       label: 'Rapports',         icon: '📊',  roles: ['super_admin', 'merchant'] },
  { path: '/merchants',     label: 'Marchands',        icon: '🏪',  roles: ['super_admin'] },
  { path: '/users',         label: 'Utilisateurs',     icon: '👥',  roles: ['super_admin'] },
  { path: '/notifications', label: 'Notifications',    icon: '🔔',  roles: ['super_admin', 'merchant'] },
  { path: '/audit',         label: 'Audit',            icon: '📋',  roles: ['super_admin'] },
  { path: '/settings',      label: 'Paramètres',       icon: '⚙️',  roles: ['super_admin', 'merchant'] },
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
      <div style={{
        height: '64px', display: 'flex', alignItems: 'center',
        padding: collapsed ? '0 16px' : '0 20px',
        gap: '10px', borderBottom: '1px solid var(--border)',
        cursor: 'pointer',
      }} onClick={onToggle}>
        <div style={{
          width: '34px', height: '34px', borderRadius: '10px',
          background: 'var(--color-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px', flexShrink: 0,
        }}>
          💸
        </div>
        {!collapsed && (
          <span style={{ fontFamily: 'var(--font)', fontWeight: 800, fontSize: '16px', color: 'var(--text)', whiteSpace: 'nowrap' }}>
            GestionMoMo
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center',
              gap: '10px', padding: collapsed ? '10px 12px' : '10px 12px',
              borderRadius: '10px', cursor: 'pointer',
              background: isActive ? 'var(--color-primary-alpha)' : 'transparent',
              color: isActive ? 'var(--color-primary)' : 'var(--text-secondary)',
              fontFamily: 'var(--font)', fontWeight: isActive ? 600 : 500,
              fontSize: '14px', textDecoration: 'none',
              transition: 'background 0.15s, color 0.15s',
              whiteSpace: 'nowrap', overflow: 'hidden',
            })}
            title={collapsed ? item.label : undefined}
          >
            <span style={{ fontSize: '18px', flexShrink: 0 }}>{item.icon}</span>
            {!collapsed && item.label}
          </NavLink>
        ))}
      </nav>

      {/* Utilisateur connecté */}
      <div style={{
        borderTop: '1px solid var(--border)',
        padding: '12px 8px',
      }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', marginBottom: '4px' }}>
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
              <div style={{ fontFamily: 'var(--font)', fontWeight: 600, fontSize: '13px', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name}
              </div>
              <div style={{ fontFamily: 'var(--font)', fontSize: '11px', color: 'var(--text-secondary)' }}>
                {user?.role === 'super_admin' ? 'Super Admin' : user?.role === 'merchant' ? 'Marchand' : 'Client'}
              </div>
            </div>
          </div>
        )}
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
          <span style={{ fontSize: '18px' }}>🚪</span>
          {!collapsed && 'Déconnexion'}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
