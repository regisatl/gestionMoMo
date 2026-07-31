import React, { useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';

const SettingsPage = () => {
  const { user, updateUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [businessName, setBusinessName] = useState(user?.businessName || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg] = useState({ text: '', type: '' });

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const { data } = await api.patch(`/users/${user._id}`, { name, email, businessName });
      updateUser(data.user);
      setProfileMsg('Profil mis à jour avec succès.');
    } catch (err) {
      setProfileMsg(err.response?.data?.error || 'Erreur lors de la sauvegarde.');
    } finally {
      setProfileLoading(false);
      setTimeout(() => setProfileMsg(''), 3000);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPwd !== confirmPwd) {
      setPwdMsg({ text: 'Les mots de passe ne correspondent pas.', type: 'error' });
      return;
    }
    if (newPwd.length < 8) {
      setPwdMsg({ text: 'Minimum 8 caractères requis.', type: 'error' });
      return;
    }
    setPwdLoading(true);
    try {
      await api.patch('/auth/change-password', { currentPassword: currentPwd, newPassword: newPwd });
      setPwdMsg({ text: 'Mot de passe modifié avec succès.', type: 'success' });
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
    } catch (err) {
      setPwdMsg({ text: err.response?.data?.error || 'Erreur.', type: 'error' });
    } finally {
      setPwdLoading(false);
      setTimeout(() => setPwdMsg({ text: '', type: '' }), 3000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '640px' }}>
      {/* Profil */}
      <Card title="Informations du profil">
        <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input label="Nom complet" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          {user?.role === 'merchant' && (
            <Input label="Nom de l'entreprise" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
          )}
          <Input label="Téléphone" value={user?.phone || ''} disabled />
          <Input label="Rôle" value={user?.role === 'super_admin' ? 'Super Administrateur' : user?.role === 'merchant' ? 'Marchand' : 'Client'} disabled />
          {profileMsg && (
            <p style={{ fontFamily: 'var(--font)', fontSize: '13px', color: profileMsg.includes('succès') ? 'var(--color-success)' : 'var(--color-error)' }}>
              {profileMsg}
            </p>
          )}
          <Button type="submit" variant="primary" loading={profileLoading}>Enregistrer</Button>
        </form>
      </Card>

      {/* Apparence */}
      <Card title="Apparence">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--color-primary-alpha)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isDark ? <Moon size={18} color="var(--color-primary)" strokeWidth={2} /> : <Sun size={18} color="var(--color-primary)" strokeWidth={2} />}
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font)', fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>Mode sombre</p>
              <p style={{ fontFamily: 'var(--font)', fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>Basculer entre le thème clair et sombre</p>
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

      {/* Mot de passe */}
      <Card title="Sécurité — Modifier le mot de passe">
        <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input label="Mot de passe actuel" type="password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} required />
          <Input label="Nouveau mot de passe" type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} required />
          <Input label="Confirmer le nouveau mot de passe" type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} required />
          {pwdMsg.text && (
            <p style={{ fontFamily: 'var(--font)', fontSize: '13px', color: pwdMsg.type === 'success' ? 'var(--color-success)' : 'var(--color-error)' }}>
              {pwdMsg.text}
            </p>
          )}
          <Button type="submit" variant="primary" loading={pwdLoading}>Modifier le mot de passe</Button>
        </form>
      </Card>
    </div>
  );
};

export default SettingsPage;
