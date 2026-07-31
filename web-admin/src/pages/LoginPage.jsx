import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, Smartphone, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phone.trim() || !password) return;
    setLoading(true);
    setError('');
    try {
      const user = await login(phone.trim(), password);
      navigate(user.role === 'client' ? '/' : '/');
    } catch (err) {
      setError(err.response?.data?.error || t('auth.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-secondary)', padding: '24px',
    }}>
      <div style={{
        width: '100%', maxWidth: '400px',
        background: 'var(--bg-card)', borderRadius: '20px',
        border: '1px solid var(--border)',
        padding: '40px', boxShadow: '0 4px 24px var(--shadow)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '18px',
            background: 'var(--color-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px',
            boxShadow: '0 4px 16px rgba(10,102,194,0.3)',
          }}>
            <Wallet size={30} color="#fff" strokeWidth={2} />
          </div>
          <h1 style={{ fontFamily: 'var(--font)', fontWeight: 800, fontSize: '24px', color: 'var(--text)', letterSpacing: '-0.5px' }}>
            {t('common.appName')}
          </h1>
          <p style={{ fontFamily: 'var(--font)', fontWeight: 400, fontSize: '14px', color: 'var(--text-secondary)', marginTop: '6px' }}>
            {t('auth.subtitle')}
          </p>
        </div>

        {/* Erreur */}
        {error && (
          <div style={{
            background: 'var(--color-error-light)', border: '1px solid var(--color-error)',
            borderRadius: '10px', padding: '12px 14px', marginBottom: '20px',
          }}>
            <span style={{ fontFamily: 'var(--font)', fontWeight: 500, fontSize: '13px', color: 'var(--color-error)' }}>
              {error}
            </span>
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label={t('auth.phoneLabel')}
            name="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t('auth.phonePlaceholder')}
            icon={<Smartphone size={16} color="var(--text-secondary)" />}
            required
          />
          <Input
            label={t('auth.passwordLabel')}
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('auth.passwordPlaceholder')}
            icon={<Lock size={16} color="var(--text-secondary)" />}
            required
          />
          <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
            {t('auth.loginButton')}
          </Button>
        </form>

        <p style={{ fontFamily: 'var(--font)', fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '24px' }}>
          {t('common.version')}
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
