import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Sun, Moon, Bell, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useLanguage } from '../../context/LanguageContext';
import Tooltip from '../ui/Tooltip';

const Header = ({ title, sidebarCollapsed, onToggleSidebar }) => {
  const { t } = useTranslation();
  const { isDark, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { language, changeLanguage, supportedLanguages } = useLanguage();
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [showLangPanel, setShowLangPanel] = useState(false);
  const notifRef = useRef(null);
  const langRef = useRef(null);
  const navigate = useNavigate();

  const roleLabel = t(`settings.roles.${user?.role}`, { defaultValue: user?.role });

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifPanel(false);
      }
      if (langRef.current && !langRef.current.contains(e.target)) {
        setShowLangPanel(false);
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
        <Tooltip content={isDark ? t('header.lightMode') : t('header.darkMode')} placement="bottom">
          <button
            onClick={toggleTheme}
            aria-label={isDark ? t('header.lightMode') : t('header.darkMode')}
            style={iconBtnStyle}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-primary-alpha)'; e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            {isDark ? <Sun size={18} strokeWidth={2} /> : <Moon size={18} strokeWidth={2} />}
          </button>
        </Tooltip>

        {/* Sélecteur de langue */}
        <div ref={langRef} style={{ position: 'relative' }}>
          <Tooltip content={t('settings.languageTitle')} placement="bottom">
            <button
              onClick={() => setShowLangPanel((v) => !v)}
              aria-label={t('settings.languageTitle')}
              style={{
                ...iconBtnStyle,
                gap: '5px',
                width: 'auto',
                padding: '0 10px',
                minWidth: '38px',
                fontFamily: 'var(--font)',
                fontWeight: 700,
                fontSize: '12px',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-primary-alpha)'; e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              <Languages size={16} strokeWidth={2} />
              <span style={{ letterSpacing: '0.3px', textTransform: 'uppercase' }}>{language}</span>
            </button>
          </Tooltip>

          {/* Dropdown langue */}
          {showLangPanel && (
            <div style={{
              position: 'absolute', top: '46px', right: 0,
              width: '160px',
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: '12px', boxShadow: '0 8px 24px var(--shadow)',
              overflow: 'hidden', zIndex: 200,
            }}>
              {supportedLanguages.map((lang, idx) => {
                const isActive = language === lang;
                const flag = lang === 'fr' ? '🇫🇷' : '🇬🇧';
                const label = lang === 'fr' ? 'Français' : 'English';
                return (
                  <button
                    key={lang}
                    onClick={() => { changeLanguage(lang); setShowLangPanel(false); }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 14px',
                      background: isActive ? 'var(--color-primary-alpha)' : 'transparent',
                      border: 'none',
                      borderBottom: idx < supportedLanguages.length - 1 ? '1px solid var(--border)' : 'none',
                      cursor: 'pointer',
                      fontFamily: 'var(--font)', fontWeight: isActive ? 700 : 500,
                      fontSize: '13px',
                      color: isActive ? 'var(--color-primary)' : 'var(--text)',
                      textAlign: 'left',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--surface)'; }}
                    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span style={{ fontSize: '16px' }}>{flag}</span>
                    <span style={{ flex: 1 }}>{label}</span>
                    {isActive && <span style={{ fontSize: '14px', color: 'var(--color-primary)' }}>✓</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <Tooltip content={t('header.notifications')} placement="bottom" maxWidth={120}>
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
          </Tooltip>

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
        {/* Avatar profil — cliquable vers /settings */}
        <Tooltip content={roleLabel} placement="bottom">
          <button
            onClick={() => navigate('/settings')}
            aria-label={t('nav.settings')}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: '2px', background: 'none', border: 'none',
              cursor: 'pointer', padding: '2px 4px', borderRadius: '10px',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-primary-alpha)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
          >
            {/* Cercle initial */}
            <div style={{
              width: '34px', height: '34px', borderRadius: '50%',
              background: 'var(--color-primary-alpha)',
              border: '2px solid var(--color-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font)', fontWeight: 700, fontSize: '14px',
              color: 'var(--color-primary)', flexShrink: 0,
            }}>
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            {/* Label rôle */}
            <span style={{
              fontFamily: 'var(--font)', fontWeight: 600, fontSize: '9px',
              color: 'var(--color-primary)', letterSpacing: '0.3px',
              textTransform: 'uppercase', lineHeight: 1, whiteSpace: 'nowrap',
            }}>
              {roleLabel}
            </span>
          </button>
        </Tooltip>

      </div>
    </header>
  );
};

export default Header;
