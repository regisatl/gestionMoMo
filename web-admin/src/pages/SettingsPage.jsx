import React, { useState } from 'react';
import { Sun, Moon, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationContext';
import api from '../services/api';

const SettingsPage = () => {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '640px' }}>
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
          <Button type="submit" variant="primary" loading={profileLoading}>{t('settings.saveProfile')}</Button>
        </form>
      </Card>

      {/* Apparence */}
      <Card title={t('settings.appearanceTitle')}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--color-primary-alpha)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isDark ? <Moon size={18} color="var(--color-primary)" strokeWidth={2} /> : <Sun size={18} color="var(--color-primary)" strokeWidth={2} />}
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font)', fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>{t('settings.darkModeLabel')}</p>
              <p style={{ fontFamily: 'var(--font)', fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>{t('settings.darkModeDesc')}</p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            role="switch"
            aria-checked={isDark}
            style={{
              width: '52px', height: '28px', borderRadius: '14px',
              background: isDark ? 'var(--color-primary)' : 'var(--border)',
              border: 'none', cursor: 'pointer', position: 'relative',
              transition: 'background 0.25s',
            }}
          >
            <span style={{
              position: 'absolute', top: '3px',
              left: isDark ? '27px' : '3px',
              width: '22px', height: '22px', borderRadius: '50%',
              background: '#fff', transition: 'left 0.25s',
              boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
            }} />
          </button>
        </div>
      </Card>

      {/* Langue */}
      <Card title={t('settings.languageTitle')}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--color-primary-alpha)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Globe size={18} color="var(--color-primary)" strokeWidth={2} />
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font)', fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>{t('settings.languageTitle')}</p>
              <p style={{ fontFamily: 'var(--font)', fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>{t('settings.languageDesc')}</p>
            </div>
          </div>
          <select
            value={language}
            onChange={(e) => changeLanguage(e.target.value)}
            style={{
              height: '42px', padding: '0 16px', borderRadius: '10px',
              border: '1.5px solid var(--input-border)', background: 'var(--input-bg)',
              color: 'var(--text)', fontFamily: 'var(--font)', fontSize: '14px', fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {supportedLanguages.map((lang) => (
              <option key={lang} value={lang}>
                {lang === 'fr' ? '🇫🇷' : '🇬🇧'} {langNames[lang]}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Mot de passe */}
      <Card title={t('settings.securityTitle')}>
        <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input label={t('settings.currentPasswordLabel')} type="password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} required />
          <Input label={t('settings.newPasswordLabel')} type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} required />
          <Input label={t('settings.confirmPasswordLabel')} type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} required />
          <Button type="submit" variant="primary" loading={pwdLoading}>{t('settings.changePasswordButton')}</Button>
        </form>
      </Card>
    </div>
  );
};

export default SettingsPage;
