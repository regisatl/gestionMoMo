import React, { useState } from 'react';
import { Sun, Moon, Globe, Monitor, User, Lock, Palette, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Loader from '../components/ui/Loader';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationContext';
import api from '../services/api';

/* ── Tab bar ──────────────────────────────────────────────────── */
const TABS = [
  { key: 'profile',    icon: User,      labelKey: 'settings.tabs.profile'    },
  { key: 'appearance', icon: Palette,   labelKey: 'settings.tabs.appearance' },
  { key: 'language',   icon: Languages, labelKey: 'settings.tabs.language'   },
  { key: 'security',   icon: Lock,      labelKey: 'settings.tabs.security'   },
];

const TabBar = ({ active, onChange, t }) => (
  <div style={{
    display: 'flex', gap: '2px',
    borderBottom: '1px solid var(--border)',
    marginBottom: '24px',
  }}>
    {TABS.map(({ key, icon: Icon, labelKey }) => {
      const isActive = active === key;
      return (
        <button
          key={key}
          onClick={() => onChange(key)}
          style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '10px 16px',
            border: 'none', background: 'none', cursor: 'pointer',
            fontFamily: 'var(--font)', fontWeight: isActive ? 600 : 400,
            fontSize: '14px',
            color: isActive ? 'var(--color-primary)' : 'var(--text-secondary)',
            borderBottom: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
            marginBottom: '-1px',
            transition: 'color 0.15s, border-color 0.15s',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = 'var(--text)'; }}
          onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          <Icon size={15} strokeWidth={2} />
          {t(labelKey)}
        </button>
      );
    })}
  </div>
);

/* ── Theme selector ───────────────────────────────────────────── */
const ThemeSelector = ({ themeMode, setTheme, t }) => {
  const options = [
    { value: 'system', label: t('settings.themeSystem'), Icon: Monitor },
    { value: 'light',  label: t('settings.themeLight'),  Icon: Sun    },
    { value: 'dark',   label: t('settings.themeDark'),   Icon: Moon   },
  ];
  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      {options.map(({ value, label, Icon }) => {
        const on = themeMode === value;
        return (
          <button key={value} onClick={() => setTheme(value)} style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: '7px', padding: '12px 8px',
            borderRadius: '10px',
            border: on ? '2px solid var(--color-primary)' : '2px solid var(--border)',
            background: on ? 'var(--color-primary-alpha)' : 'var(--surface)',
            cursor: 'pointer', transition: 'all 0.15s',
          }}
            onMouseEnter={(e) => { if (!on) e.currentTarget.style.borderColor = 'var(--color-primary-light)'; }}
            onMouseLeave={(e) => { if (!on) e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            <Icon size={18} strokeWidth={2} color={on ? 'var(--color-primary)' : 'var(--text-secondary)'} />
            <span style={{ fontFamily: 'var(--font)', fontWeight: on ? 600 : 400, fontSize: '12px', color: on ? 'var(--color-primary)' : 'var(--text-secondary)' }}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

/* ── Section title ────────────────────────────────────────────── */
const SectionTitle = ({ children }) => (
  <p style={{
    fontFamily: 'var(--font)', fontWeight: 600, fontSize: '11px',
    color: 'var(--text-secondary)', textTransform: 'uppercase',
    letterSpacing: '0.6px', marginBottom: '10px',
  }}>
    {children}
  </p>
);

/* ── Avatar initials ──────────────────────────────────────────── */
const Avatar = ({ name }) => (
  <div style={{
    width: '64px', height: '64px', borderRadius: '18px',
    background: 'var(--color-primary-alpha)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--font)', fontWeight: 800, fontSize: '24px',
    color: 'var(--color-primary)', flexShrink: 0,
    border: '2px solid var(--border)',
  }}>
    {name?.charAt(0)?.toUpperCase() || '?'}
  </div>
);

/* ── Main page ────────────────────────────────────────────────── */
const SettingsPage = () => {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const { isDark, themeMode, setTheme } = useTheme();
  const { language, langMode, changeLanguage, systemLang } = useLanguage();
  const { addToast } = useNotifications();

  const [tab, setTab] = useState('profile');

  /* profile */
  const [name,         setName]         = useState(user?.name || '');
  const [email,        setEmail]        = useState(user?.email || '');
  const [businessName, setBusinessName] = useState(user?.businessName || '');
  const [profileLoading, setProfileLoading] = useState(false);

  /* security */
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd,     setNewPwd]     = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  const roleLabels = {
    super_admin: t('settings.roles.super_admin'),
    merchant:    t('settings.roles.merchant'),
    client:      t('settings.roles.client'),
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const { data } = await api.patch(`/users/${user._id}`, { name, email, businessName });
      updateUser(data.user);
      addToast({ type: 'success', title: t('toast.profileSaved'), message: t('toast.profileSavedMsg') });
    } catch (err) {
      addToast({ type: 'error', title: t('toast.profileError'), message: err.response?.data?.error || t('settings.profileError') });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPwd !== confirmPwd) { addToast({ type: 'error', title: t('toast.passwordError'), message: t('toast.passwordMismatch') }); return; }
    if (newPwd.length < 8)    { addToast({ type: 'error', title: t('toast.passwordError'), message: t('toast.passwordTooShort') }); return; }
    setPwdLoading(true);
    try {
      await api.patch('/auth/change-password', { currentPassword: currentPwd, newPassword: newPwd });
      addToast({ type: 'success', title: t('toast.passwordChanged'), message: t('toast.passwordChangedMsg') });
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
    } catch (err) {
      addToast({ type: 'error', title: t('toast.passwordError'), message: err.response?.data?.error || t('settings.passwordError') });
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '580px', margin: '0 auto', width: '100%', position: 'relative' }}>
      {/* Overlay loader pendant sauvegarde */}
      {(profileLoading || pwdLoading) && (
        <Loader
          message={profileLoading ? 'loader.saving' : 'loader.updatingPassword'}
          overlay
        />
      )}
      <Card>
        <TabBar active={tab} onChange={setTab} t={t} />

        {/* ── Profil ── */}
        {tab === 'profile' && (
          <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {/* Avatar row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <Avatar name={user?.name} />
              <div>
                <p style={{ fontFamily: 'var(--font)', fontWeight: 700, fontSize: '16px', color: 'var(--text)', margin: 0 }}>
                  {user?.name}
                </p>
                <p style={{ fontFamily: 'var(--font)', fontSize: '13px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                  {roleLabels[user?.role] || user?.role}
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <Input label={t('settings.fullNameLabel')} value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <Input label={t('settings.emailLabel')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Input label={t('settings.phoneLabel')} value={user?.phone || ''} disabled />
              {user?.role === 'merchant' && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <Input label={t('settings.businessNameLabel')} value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
                </div>
              )}
              <div style={{ gridColumn: '1 / -1' }}>
                <Input label={t('settings.roleLabel')} value={roleLabels[user?.role] || user?.role} disabled />
              </div>
            </div>

            <Button type="submit" variant="primary" loading={profileLoading} style={{ alignSelf: 'flex-start', marginTop: '4px' }}>
              {t('settings.saveProfile')}
            </Button>
          </form>
        )}

        {/* ── Apparence ── */}
        {tab === 'appearance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Current mode banner */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '12px 14px', borderRadius: '10px',
              background: 'var(--surface)', border: '1px solid var(--border)',
            }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '9px',
                background: 'var(--color-primary-alpha)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                {isDark
                  ? <Moon size={16} color="var(--color-primary)" strokeWidth={2} />
                  : <Sun  size={16} color="var(--color-primary)" strokeWidth={2} />
                }
              </div>
              <div>
                <p style={{ fontFamily: 'var(--font)', fontWeight: 600, fontSize: '13px', color: 'var(--text)', margin: 0 }}>
                  {isDark ? t('settings.themeDark') : t('settings.themeLight')}
                </p>
                <p style={{ fontFamily: 'var(--font)', fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                  {themeMode === 'system' ? t('settings.themeSystemActive') : t('settings.darkModeDesc')}
                </p>
              </div>
            </div>

            <div>
              <SectionTitle>{t('settings.selectTheme')}</SectionTitle>
              <ThemeSelector themeMode={themeMode} setTheme={setTheme} t={t} />
            </div>
          </div>
        )}

        {/* ── Langue ── */}
        {tab === 'language' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Current lang banner */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '12px 14px', borderRadius: '10px',
              background: 'var(--surface)', border: '1px solid var(--border)',
            }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '9px',
                background: 'var(--color-primary-alpha)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Globe size={16} color="var(--color-primary)" strokeWidth={2} />
              </div>
              <div>
                <p style={{ fontFamily: 'var(--font)', fontWeight: 600, fontSize: '13px', color: 'var(--text)', margin: 0 }}>
                  {language === 'fr' ? '🇫🇷 Français' : '🇬🇧 English'}
                </p>
                <p style={{ fontFamily: 'var(--font)', fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                  {langMode === 'system'
                    ? t('settings.langSystemActive', { lang: systemLang === 'fr' ? 'Français' : 'English' })
                    : t('settings.languageDesc')}
                </p>
              </div>
            </div>

            <div>
              <SectionTitle>{t('settings.selectLanguage')}</SectionTitle>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[
                  { value: 'system', label: t('settings.langSystem'), icon: <Monitor size={18} strokeWidth={2} /> },
                  { value: 'fr',     label: 'Français',               icon: <span style={{ fontSize: '18px', lineHeight: 1 }}>🇫🇷</span> },
                  { value: 'en',     label: 'English',                icon: <span style={{ fontSize: '18px', lineHeight: 1 }}>🇬🇧</span> },
                ].map(({ value, label, icon }) => {
                  const on = langMode === value;
                  return (
                    <button key={value} onClick={() => changeLanguage(value)} style={{
                      flex: 1, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', gap: '7px', padding: '12px 8px',
                      borderRadius: '10px',
                      border: on ? '2px solid var(--color-primary)' : '2px solid var(--border)',
                      background: on ? 'var(--color-primary-alpha)' : 'var(--surface)',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                      onMouseEnter={(e) => { if (!on) e.currentTarget.style.borderColor = 'var(--color-primary-light)'; }}
                      onMouseLeave={(e) => { if (!on) e.currentTarget.style.borderColor = 'var(--border)'; }}
                    >
                      <span style={{ color: on ? 'var(--color-primary)' : 'var(--text-secondary)', display: 'flex' }}>{icon}</span>
                      <span style={{ fontFamily: 'var(--font)', fontWeight: on ? 600 : 400, fontSize: '12px', color: on ? 'var(--color-primary)' : 'var(--text-secondary)' }}>
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Sécurité ── */}
        {tab === 'security' && (
          <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <SectionTitle>{t('settings.securityTitle')}</SectionTitle>
            <Input
              label={t('settings.currentPasswordLabel')}
              type="password"
              value={currentPwd}
              onChange={(e) => setCurrentPwd(e.target.value)}
              required
            />
            <Input
              label={t('settings.newPasswordLabel')}
              type="password"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              required
            />
            <Input
              label={t('settings.confirmPasswordLabel')}
              type="password"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              required
            />
            <Button type="submit" variant="primary" loading={pwdLoading} style={{ alignSelf: 'flex-start', marginTop: '4px' }}>
              {t('settings.changePasswordButton')}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
};

export default SettingsPage;
