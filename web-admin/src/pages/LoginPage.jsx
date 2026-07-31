import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, Lock, ArrowRight, TrendingUp, Shield, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import Input from '../components/ui/Input';

/* ─── Floating geometric shapes (decorative, left panel) ────────── */
const FloatingShape = ({ size, top, left, delay, color, blur }) => (
  <div style={{
    position: 'absolute', top, left,
    width: size, height: size,
    borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
    background: color,
    filter: `blur(${blur || 0}px)`,
    animation: `floatShape ${4 + delay}s ease-in-out ${delay}s infinite alternate`,
    pointerEvents: 'none',
    zIndex: 0,
  }} />
);

/* ─── Animated stat pill ─────────────────────────────────────────── */
const StatPill = ({ icon: Icon, label, value, delay }) => (
  <div style={{
    display: 'inline-flex', alignItems: 'center', gap: '10px',
    background: 'rgba(255,255,255,0.12)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '14px', padding: '12px 18px',
    animation: `slideUpFade 0.6s ease ${delay}s both`,
  }}>
    <div style={{
      width: '36px', height: '36px', borderRadius: '10px',
      background: 'rgba(255,255,255,0.2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon size={18} color="#fff" strokeWidth={2} />
    </div>
    <div>
      <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: '18px', color: '#fff', letterSpacing: '-0.5px', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 400, fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>
        {label}
      </div>
    </div>
  </div>
);

/* ─── Page ───────────────────────────────────────────────────────── */
const LoginPage = () => {
  const { t }        = useTranslation();
  const { isDark }   = useTheme();
  const navigate     = useNavigate();
  const { login }    = useAuth();

  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [mounted, setMounted]   = useState(false);

  useEffect(() => {
    // Légère tempo pour déclencher l'animation d'entrée
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

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

  /* ── Couleurs adaptées au thème ── */
  const leftBg = isDark
    ? 'linear-gradient(145deg, #0A3A6B 0%, #0A66C2 50%, #084E96 100%)'
    : 'linear-gradient(145deg, #0A66C2 0%, #1D8CF8 55%, #0A3A6B 100%)';

  const rightBg = isDark ? '#1E1E1E' : '#FFFFFF';

  const stats = [
    { icon: TrendingUp, label: t('login.statTransactions'), value: '12 450+' },
    { icon: Shield,     label: t('login.statSecurity'),     value: '100%'    },
    { icon: Zap,        label: t('login.statUptime'),       value: '99.9%'   },
  ];

  const features = [
    t('login.featureRealtime'),
    t('login.featureMultiCurrency'),
    t('login.featureAnalytics'),
  ];

  return (
    <>
      {/* Keyframe animations injectées en <style> */}
      <style>{`
        @keyframes floatShape {
          from { transform: translateY(0px) rotate(0deg) scale(1); }
          to   { transform: translateY(-24px) rotate(8deg) scale(1.06); }
        }
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes formEntry {
          from { opacity: 0; transform: translateX(32px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulseRing {
          0%   { transform: scale(1);    opacity: 0.6; }
          100% { transform: scale(1.18); opacity: 0;   }
        }
        @keyframes spinSlow {
          from { transform: rotate(0deg);   }
          to   { transform: rotate(360deg); }
        }
      `}</style>

      <div style={{
        display: 'flex', minHeight: '100vh',
        fontFamily: 'Manrope, sans-serif',
        overflow: 'hidden',
      }}>

        {/* ══════════════════════════════════════════════════════════
            PANNEAU GAUCHE — Décoratif / Brand
        ══════════════════════════════════════════════════════════ */}
        <div style={{
          flex: '0 0 52%',
          background: leftBg,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px',
          // Masqué sur petits écrans (< 768px)
        }}
          className="login-left-panel"
        >
          {/* Formes flottantes décoratives */}
          <FloatingShape size="320px" top="-80px"  left="-60px" delay={0}   color="rgba(255,255,255,0.06)" blur={0} />
          <FloatingShape size="200px" top="30%"    left="60%"   delay={1.2} color="rgba(255,255,255,0.05)" blur={0} />
          <FloatingShape size="160px" top="65%"    left="10%"   delay={2.1} color="rgba(255,255,255,0.08)" blur={0} />
          <FloatingShape size="400px" top="50%"    left="40%"   delay={0.8} color="rgba(10,40,100,0.25)"   blur={40} />

          {/* Cercle pulsant derrière le logo */}
          <div style={{ position: 'absolute', top: '44px', left: '44px', zIndex: 0 }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              border: '1.5px solid rgba(255,255,255,0.25)',
              position: 'absolute', top: '-8px', left: '-8px',
              animation: 'pulseRing 2.4s ease-out infinite',
            }} />
            <div style={{
              width: '100px', height: '100px', borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.12)',
              position: 'absolute', top: '-18px', left: '-18px',
              animation: 'pulseRing 2.4s ease-out 0.4s infinite',
            }} />
          </div>

          {/* Logo + Nom */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '16px',
                background: 'rgba(255,255,255,0.20)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.30)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {/* Icône wallet SVG inline — pas de dépendance */}
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="3"/>
                  <path d="M1 10h22"/>
                  <circle cx="17.5" cy="15" r="1.5" fill="#fff" stroke="none"/>
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '22px', color: '#fff', letterSpacing: '-0.5px' }}>
                  GestionMoMo
                </div>
                <div style={{ fontWeight: 400, fontSize: '12px', color: 'rgba(255,255,255,0.65)', marginTop: '1px' }}>
                  {t('login.adminPlatform')}
                </div>
              </div>
            </div>
          </div>

          {/* Illustration centrale — composition géométrique SVG */}
          <div style={{
            position: 'relative', zIndex: 1,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            animation: 'slideUpFade 0.8s ease 0.2s both',
          }}>
            {/* Grande illustration SVG inline */}
            <svg width="320" height="260" viewBox="0 0 320 260" fill="none" style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.25))' }}>
              {/* Fond circulaire glow */}
              <ellipse cx="160" cy="200" rx="130" ry="30" fill="rgba(255,255,255,0.06)" />
              {/* Carte principale */}
              <rect x="40" y="60" width="240" height="150" rx="20" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.25)" strokeWidth="1"/>
              {/* Bande supérieure */}
              <rect x="40" y="60" width="240" height="42" rx="20" fill="rgba(255,255,255,0.10)"/>
              <rect x="40" y="82" width="240" height="20" fill="rgba(255,255,255,0.10)"/>
              {/* Chip */}
              <rect x="66" y="74" width="32" height="24" rx="5" fill="rgba(255,220,100,0.6)" stroke="rgba(255,220,100,0.8)" strokeWidth="1"/>
              <line x1="66" y1="83" x2="98" y2="83" stroke="rgba(200,160,0,0.5)" strokeWidth="1"/>
              <line x1="66" y1="89" x2="98" y2="89" stroke="rgba(200,160,0,0.5)" strokeWidth="1"/>
              <line x1="78" y1="74" x2="78" y2="98" stroke="rgba(200,160,0,0.5)" strokeWidth="1"/>
              <line x1="86" y1="74" x2="86" y2="98" stroke="rgba(200,160,0,0.5)" strokeWidth="1"/>
              {/* Numéro de carte */}
              <text x="66" y="140" fontFamily="monospace" fontSize="13" fill="rgba(255,255,255,0.7)" letterSpacing="2">•••• •••• •••• 4291</text>
              {/* Détenteur */}
              <text x="66" y="166" fontFamily="Manrope, sans-serif" fontSize="11" fill="rgba(255,255,255,0.5)">GestionMoMo Admin</text>
              {/* Logo réseau */}
              <circle cx="240" cy="160" r="14" fill="rgba(255,255,255,0.15)" />
              <circle cx="254" cy="160" r="14" fill="rgba(255,255,255,0.20)" />

              {/* Petite carte superposée */}
              <rect x="170" y="30" width="130" height="80" rx="14" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.30)" strokeWidth="1" transform="rotate(-8 235 70)"/>
              <rect x="178" y="44" width="48" height="10" rx="3" fill="rgba(255,255,255,0.3)" transform="rotate(-8 202 49)"/>
              <rect x="178" y="60" width="100" height="7" rx="3" fill="rgba(255,255,255,0.15)" transform="rotate(-8 228 63)"/>
              <rect x="178" y="72" width="70" height="7" rx="3" fill="rgba(255,255,255,0.12)" transform="rotate(-8 213 75)"/>

              {/* Badge "Live" en haut à droite */}
              <rect x="215" y="16" width="54" height="22" rx="11" fill="rgba(22,163,74,0.85)"/>
              <circle cx="225" cy="27" r="3" fill="#fff" opacity="0.9"/>
              <text x="231" y="31" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="#fff">LIVE</text>

              {/* Flèches de transaction */}
              <g transform="translate(20, 170)">
                <rect width="50" height="28" rx="8" fill="rgba(22,163,74,0.2)" stroke="rgba(22,163,74,0.5)" strokeWidth="1"/>
                <text x="9" y="18" fontFamily="Manrope, sans-serif" fontSize="9" fill="#4ade80" fontWeight="600">+12 450</text>
              </g>
              <g transform="translate(252, 170)">
                <rect width="50" height="28" rx="8" fill="rgba(220,38,38,0.2)" stroke="rgba(220,38,38,0.5)" strokeWidth="1"/>
                <text x="9" y="18" fontFamily="Manrope, sans-serif" fontSize="9" fill="#f87171" fontWeight="600">-3 209</text>
              </g>
            </svg>

            {/* Titre sous l'illustration */}
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <h2 style={{ fontWeight: 800, fontSize: '26px', color: '#fff', letterSpacing: '-0.8px', margin: 0, lineHeight: 1.2 }}>
                {t('login.heroTitle')}
              </h2>
              <p style={{ fontWeight: 400, fontSize: '14px', color: 'rgba(255,255,255,0.65)', margin: '8px 0 0' }}>
                {t('login.heroSubtitle')}
              </p>
            </div>
          </div>

          {/* Stats pills en bas */}
          <div style={{
            position: 'relative', zIndex: 1,
            display: 'flex', gap: '12px', flexWrap: 'wrap',
          }}>
            {stats.map((s, i) => <StatPill key={i} {...s} delay={0.4 + i * 0.15} />)}
          </div>

          {/* Motif de points en bas à droite */}
          <div style={{
            position: 'absolute', right: '24px', bottom: '24px',
            display: 'grid', gridTemplateColumns: 'repeat(6, 8px)',
            gap: '6px', opacity: 0.2, zIndex: 0,
          }}>
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={i} style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#fff' }} />
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            PANNEAU DROIT — Formulaire
        ══════════════════════════════════════════════════════════ */}
        <div style={{
          flex: '0 0 48%',
          background: rightBg,
          display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center',
          padding: '48px 56px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Cercle décoratif en haut à droite */}
          <div style={{
            position: 'absolute', top: '-80px', right: '-80px',
            width: '240px', height: '240px', borderRadius: '50%',
            background: isDark
              ? 'radial-gradient(circle, rgba(10,102,194,0.12) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(10,102,194,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          {/* Cercle décoratif en bas à gauche */}
          <div style={{
            position: 'absolute', bottom: '-60px', left: '-60px',
            width: '180px', height: '180px', borderRadius: '50%',
            background: isDark
              ? 'radial-gradient(circle, rgba(10,102,194,0.10) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(10,102,194,0.06) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div style={{
            width: '100%', maxWidth: '400px',
            animation: mounted ? 'formEntry 0.55s cubic-bezier(0.22,1,0.36,1) both' : 'none',
            position: 'relative', zIndex: 1,
          }}>
            {/* Header formulaire */}
            <div style={{ marginBottom: '36px' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: isDark ? 'rgba(10,102,194,0.15)' : 'rgba(10,102,194,0.08)',
                border: `1px solid ${isDark ? 'rgba(10,102,194,0.35)' : 'rgba(10,102,194,0.2)'}`,
                borderRadius: '20px', padding: '4px 12px', marginBottom: '16px',
              }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16A34A', animation: 'pulseRing 1.8s ease-out infinite' }} />
                <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: '11px', color: 'var(--color-primary)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  {t('login.secureAccess')}
                </span>
              </div>
              <h1 style={{
                fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: '32px',
                color: isDark ? '#F5F5F5' : '#111827',
                letterSpacing: '-1px', lineHeight: 1.1, margin: 0,
              }}>
                {t('login.welcomeBack')}
              </h1>
              <p style={{
                fontFamily: 'Manrope, sans-serif', fontWeight: 400, fontSize: '14px',
                color: isDark ? '#A0A0A0' : '#6B7280',
                marginTop: '8px', lineHeight: 1.5,
              }}>
                {t('auth.subtitle')}
              </p>
            </div>

            {/* Message d'erreur */}
            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                background: isDark ? 'rgba(220,38,38,0.12)' : '#FEF2F2',
                border: `1px solid ${isDark ? 'rgba(220,38,38,0.4)' : '#FECACA'}`,
                borderRadius: '12px', padding: '12px 16px', marginBottom: '20px',
                animation: 'slideUpFade 0.3s ease both',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isDark ? '#F87171' : '#DC2626'} strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 500, fontSize: '13px', color: isDark ? '#F87171' : '#DC2626' }}>
                  {error}
                </span>
              </div>
            )}

            {/* Formulaire */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <Input
                label={t('auth.phoneLabel')}
                name="phone"
                type="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setError(''); }}
                placeholder={t('auth.phonePlaceholder')}
                icon={<Smartphone size={16} color="var(--text-secondary)" />}
                required
              />
              <div>
                <Input
                  label={t('auth.passwordLabel')}
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder={t('auth.passwordPlaceholder')}
                  icon={<Lock size={16} color="var(--text-secondary)" />}
                  required
                />
              </div>

              {/* Bouton de connexion */}
              <button
                type="submit"
                disabled={loading || !phone.trim() || !password}
                style={{
                  width: '100%', height: '50px',
                  background: loading || !phone.trim() || !password
                    ? 'var(--text-disabled)'
                    : 'linear-gradient(135deg, #0A66C2 0%, #1D8CF8 100%)',
                  border: 'none', borderRadius: '14px',
                  color: '#fff',
                  fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '15px',
                  cursor: loading || !phone.trim() || !password ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  transition: 'all 0.2s',
                  boxShadow: loading || !phone.trim() || !password
                    ? 'none'
                    : '0 4px 20px rgba(10,102,194,0.4)',
                  letterSpacing: '0.2px',
                }}
                onMouseEnter={(e) => {
                  if (!loading && phone.trim() && password) {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 8px 28px rgba(10,102,194,0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = loading || !phone.trim() || !password ? 'none' : '0 4px 20px rgba(10,102,194,0.4)';
                }}
              >
                {loading ? (
                  <>
                    <svg style={{ animation: 'spinSlow 0.8s linear infinite' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round"/>
                    </svg>
                    {t('auth.loggingIn')}
                  </>
                ) : (
                  <>
                    {t('auth.loginButton')}
                    <ArrowRight size={18} strokeWidth={2.5} />
                  </>
                )}
              </button>
            </form>

            {/* Features list */}
            <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: `1px solid ${isDark ? '#3D3D3D' : '#F3F4F6'}` }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {features.map((feat, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '20px', height: '20px', borderRadius: '50%',
                      background: isDark ? 'rgba(10,102,194,0.2)' : 'rgba(10,102,194,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#0A66C2" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="2,6 5,9 10,3"/>
                      </svg>
                    </div>
                    <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 500, fontSize: '13px', color: isDark ? '#A0A0A0' : '#6B7280' }}>
                      {feat}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '11px', color: isDark ? '#666' : '#9CA3AF', textAlign: 'center', marginTop: '28px' }}>
              {t('common.version')}
            </p>
          </div>
        </div>
      </div>

      {/* CSS responsive — masque le panneau gauche sur mobile */}
      <style>{`
        @media (max-width: 768px) {
          .login-left-panel { display: none !important; }
        }
        @media (max-width: 768px) {
          /* Le panneau droit prend toute la largeur */
        }
      `}</style>
    </>
  );
};

export default LoginPage;
