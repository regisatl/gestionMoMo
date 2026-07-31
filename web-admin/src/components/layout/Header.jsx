import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Sun, Moon, Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';

const Header = ({ title, sidebarCollapsed, onToggleSidebar }) => {
  const { t } = useTranslation();
  const { isDark, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const notifRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifPanel(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const iconBtnStyle = {
    width: '38px', height: '38px', borderRadius: '10px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.15s, border-color 0.15s',
    color: 'var(--text-secondary)',
  };

  return (
    <header style={{
      height: '64px', background: 'var(--header-bg)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center',
      padding: '0 24px', gap: '16px',
      position: 'sticky', top: 0, zIndex: 100,
      transition: 'background var(--transition)',
    }}>
      {/* Hamburger */}
      <button
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
        style={iconBtnStyle}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-primary-alpha)'; e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
      >
        <Menu size={18} strokeWidth={2} />
      </button>

      {/* Titre */}
      <h1 style={{ fontFamily: 'var(--font)', fontWeight: 700, fontSize: '18px', color: 'var(--text)', flex: 1 }}>
        {title}
      </h1>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

        {/* Toggle thème */}
        <button
          onClick={toggleTheme}
          aria-label={isDark ? t('header.lightMode') : t('header.darkMode')}
          title={isDark ? t('header.lightMode') : t('header.darkMode')}
          style={iconBtnStyle}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-primary-alpha)'; e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          {isDark ? <Sun size={18} strokeWidth={2} /> : <Moon size={18} strokeWidth={2} />}
        </button>

        {/* Notifications */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifPanel((v) => !v)}
            aria-label={t('header.notifications')}
            style={{ ...iconBtnStyle, position: 'relative' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-primary-alpha)'; e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <Bell size={18} strokeWidth={2} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: '4px', right: '4px',
                width: '16px', height: '16px', borderRadius: '50%',
                background: 'var(--color-error)', color: '#fff',
                fontSize: '9px', fontFamily: 'var(--font)', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none',
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Panel notifications */}
          {showNotifPanel && (
            <div style={{
              position: 'absolute', top: '46px', right: 0,
              width: '360px', maxHeight: '460px',
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: '14px', boxShadow: '0 8px 32px var(--shadow)',
              overflow: 'hidden', zIndex: 200,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontFamily: 'var(--font)', fontWeight: 700, fontSize: '14px', color: 'var(--text)' }}>
                  {t('header.notifications')} {unreadCount > 0 && t('header.notifCount', { count: unreadCount })}
                </span>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: '12px', color: 'var(--color-primary)', fontWeight: 600 }}>
                    {t('header.markAllRead')}
                  </button>
                )}
              </div>
              <div style={{ overflowY: 'auto', maxHeight: '380px' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)', fontFamily: 'var(--font)', fontSize: '13px' }}>
                    {t('header.noNotifications')}
                  </div>
                ) : notifications.slice(0, 15).map((n) => (
                  <div
                    key={n._id}
                    onClick={() => { markAsRead(n._id); setShowNotifPanel(false); navigate('/notifications'); }}
                    style={{
                      padding: '12px 16px',
                      background: n.isRead ? 'transparent' : 'var(--color-primary-alpha)',
                      borderBottom: '1px solid var(--border)',
                      cursor: 'pointer', display: 'flex', gap: '10px',
                      alignItems: 'flex-start', transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = n.isRead ? 'transparent' : 'var(--color-primary-alpha)'}
                  >
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: n.isRead ? 'transparent' : 'var(--color-primary)', marginTop: '5px', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'var(--font)', fontWeight: n.isRead ? 500 : 600, fontSize: '13px', color: 'var(--text)' }}>{n.title}</div>
                      <div style={{ fontFamily: 'var(--font)', fontWeight: 400, fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{n.message}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)' }}>
                <button
                  onClick={() => { setShowNotifPanel(false); navigate('/notifications'); }}
                  style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: '13px', color: 'var(--color-primary)', fontWeight: 600, padding: '4px' }}
                >
                  {t('header.seeAllNotifications')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
