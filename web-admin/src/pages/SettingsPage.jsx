import React, { useState } from 'react';
import { Sun, Moon, Globe, Monitor } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationContext';
import api from '../services/api';

/* ─── Sélecteur de thème — 3 boutons (Système / Clair / Sombre) ─── */
const ThemeSelector = ({ themeMode, setTheme, t }) => {
  const options = [
    { value: 'system', label: t('settings.themeSystem'), Icon: Monitor },
    { value: 'light',  label: t('settings.themeLight'),  Icon: Sun    },
    { value: 'dark',   label: t('settings.themeDark'),   Icon: Moon   },
  ];

  return (
    <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
      {options.map(({ value, label, Icon }) => {
        const isActive = themeMode === value;
        return (
          <button
            key={value}
            onClick={() => setTheme(value)}
            style={{
              flex: 1,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '8px',
              padding: '14px 8px',
              borderRadius: '12px',
              border: isActive
                ? '2px solid var(--color-primary)'
                : '2px solid var(--border)',
              background: isActive
                ? 'var(--color-primary-alpha)'
                : 'var(--surface)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.borderColor = 'var(--color-primary-light)';
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.borderColor = 'var(--border)';
            }}
          >
            <Icon
              size={20}
              strokeWidth={2}
              color={isActive ? 'var(--color-primary)' : 'var(--text-secondary)'}
            />
            <span style={{
              fontFamily: 'var(--font)',
              fontWeight: isActive ? 700 : 500,
              fontSize: '12px',
              color: isActive ? 'var(--color-primary)' : 'var(--text-secondary)',
              whiteSpace: 'nowrap',
            }}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

/* ─── Page ─── */
const SettingsPage = () => {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const { isDark, themeMode, setTheme } = useTheme();
  const { language, changeLanguage, supportedLanguages } = useLanguage();
  const { addToast } = useNotifications();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [businessName, setBusinessName] = useState(user?.businessName || '');
  const [profileLoading, setProfileLoading] = useState(false);

  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  const roleLabels = {
    super_admin: t('settings.roles.super_admin'),
    merchant:    t('settings.roles.merchant'),
    client:      t('settings.roles.client'),
  };

  const langNames = {
    fr: t('settings.languageNames.fr'),
    en: t('settings.languageNames.en'),
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
    if (newPwd !== confirmPwd) {
      addToast({ type: 'error', title: t('toast.passwordError'), message: t('toast.passwordMismatch') });
      return;
    }
    if (newPwd.length < 8) {
      addToast({ type: 'error', title: t('toast.passwordError'), message: t('toast.passwordTooShort') });
      return;
    }
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── Ligne 1 : Apparence + Langue côte à côte ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        alignItems: 'start',
      }}>

        {/* Apparence */}
        <Card title={t('settings.appearanceTitle')}>
          {/* Aperçu du mode actif */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '12px 14px', borderRadius: '10px',
            background: 'var(--surface)', border: '1px solid var(--border)',
          }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'var(--color-primary-alpha)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {isDark
                ? <Moon size={18} color="var(--color-primary)" strokeWidth={2} />
                : <Sun  size={18} color="var(--color-primary)" strokeWidth={2} />
              }
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font)', fontWeight: 600, fontSize: '14px', color: 'var(--text)', margin: 0 }}>
                {isDark ? t('settings.themeDark') : t('settings.themeLight')}
              </p>
              <p style={{ fontFamily: 'var(--font)', fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                {themeMode === 'system'
                  ? t('settings.themeSystemActive')
                  : t('settings.darkModeDesc')}
              </p>
            </div>
          </div>

          {/* Sélecteur 3 modes */}
          <ThemeSelector themeMode={themeMode} setTheme={setTheme} t={t} />
        </Card>

        {/* Langue */}
        <Card title={t('settings.languageTitle')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'var(--color-primary-alpha)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Globe size={18} color="var(--color-primary)" strokeWidth={2} />
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font)', fontWeight: 600, fontSize: '14px', color: 'var(--text)', margin: 0 }}>
                {t('settings.languageTitle')}
              </p>
              <p style={{ fontFamily: 'var(--font)', fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                {t('settings.languageDesc')}
              </p>
            </div>
          </div>

          {/* Boutons langue */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {supportedLanguages.map((lang) => {
              const isActive = language === lang;
              const flag  = lang === 'fr' ? '🇫🇷' : '🇬🇧';
              return (
                <button
                  key={lang}
                  onClick={() => changeLanguage(lang)}
                  style={{
                    flex: 1,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: '8px',
                    padding: '14px 8px',
                    borderRadius: '12px',
                    border: isActive
                      ? '2px solid var(--color-primary)'
                      : '2px solid var(--border)',
                    background: isActive
                      ? 'var(--color-primary-alpha)'
                      : 'var(--surface)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.borderColor = 'var(--color-primary-light)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                >
                  <span style={{ fontSize: '22px', lineHeight: 1 }}>{flag}</span>
                  <span style={{
                    fontFamily: 'var(--font)',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '12px',
                    color: isActive ? 'var(--color-primary)' : 'var(--text-secondary)',
                  }}>
                    {langNames[lang]}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      {/* ── Ligne 2 : Profil + Mot de passe côte à côte ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        alignItems: 'start',
      }}>

        {/* Profil */}
        <Card title={t('settings.profileTitle')}>
          <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input label={t('settings.fullNameLabel')} value={name} onChange={(e) => setName(e.target.value)} required />
            <Input label={t('settings.emailLabel')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            {user?.role === 'merchant' && (
              <Input label={t('settings.businessNameLabel')} value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
            )}
            <Input label={t('settings.phoneLabel')} value={user?.phone || ''} disabled />
            <Input label={t('settings.roleLabel')} value={roleLabels[user?.role] || user?.role} disabled />
            <Button type="submit" variant="primary" loading={profileLoading} fullWidth>
              {t('settings.saveProfile')}
            </Button>
          </form>
        </Card>

        {/* Mot de passe */}
        <Card title={t('settings.securityTitle')}>
          <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input label={t('settings.currentPasswordLabel')} type="password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} required />
            <Input label={t('settings.newPasswordLabel')}     type="password" value={newPwd}     onChange={(e) => setNewPwd(e.target.value)}     required />
            <Input label={t('settings.confirmPasswordLabel')} type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} required />
            <Button type="submit" variant="primary" loading={pwdLoading} fullWidth>
              {t('settings.changePasswordButton')}
            </Button>
          </form>
        </Card>
      </div>

    </div>
  );
};

export default SettingsPage;
