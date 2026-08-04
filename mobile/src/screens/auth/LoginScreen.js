import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, StatusBar,
  Animated, Dimensions, StyleSheet,
} from 'react-native';
import Svg, {
  Path, Circle, Rect, G, Defs, LinearGradient as SvgGradient,
  Stop, Line as SvgLine, Text as SvgText,
} from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import PinInput from '../../components/ui/PinInput';
import Icon from '../../components/ui/Icon';
import useToast from '../../hooks/useToast';
import { validateBeninPhone } from '../../utils/validation';

const { width: W, height: H } = Dimensions.get('window');

// Hauteur du bandeau gradient en haut (≈ 38% de l'écran, plafonné)
const HERO_H = Math.min(Math.round(H * 0.38), 280);

/* ─── Illustration SVG (fond + carte + pièces) ───────────────── */
const HeroBanner = ({ theme }) => {
  const isDark     = theme.isDark;
  const cardStroke = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,1)';

  return (
    <Svg
      width={W}
      height={HERO_H}
      viewBox={`0 0 ${W} ${HERO_H}`}
      style={StyleSheet.absoluteFill}
    >
      <Defs>
        <SvgGradient id="heroGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0"   stopColor="#0A66C2" />
          <Stop offset="0.5" stopColor="#1D8CF8" />
          <Stop offset="1"   stopColor="#084E96" />
        </SvgGradient>
        <SvgGradient id="cardGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="rgba(255,255,255,0.22)" />
          <Stop offset="1" stopColor="rgba(255,255,255,0.08)" />
        </SvgGradient>
        <SvgGradient id="coinGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FCD34D" />
          <Stop offset="1" stopColor="#F59E0B" />
        </SvgGradient>
      </Defs>

      {/* Fond gradient */}
      <Rect x="0" y="0" width={W} height={HERO_H} fill="url(#heroGrad)" />

      {/* Cercles décoratifs */}
      <Circle cx={W - 40} cy={40} r={60} fill="rgba(255,255,255,0.06)" />
      <Circle cx={W - 40} cy={40} r={38} fill="rgba(255,255,255,0.06)" />
      <Circle cx={30}     cy={HERO_H - 40} r={45} fill="rgba(255,255,255,0.05)" />

      {/* Grille de points */}
      {[0, 1, 2, 3, 4].map(row =>
        [0, 1, 2, 3].map(col => (
          <Circle
            key={`d-${row}-${col}`}
            cx={W - 120 + col * 18}
            cy={HERO_H - 80 + row * 18}
            r={2}
            fill="rgba(255,255,255,0.25)"
          />
        ))
      )}

      {/* Carte principale */}
      <G transform={`translate(${W / 2 - 105}, ${HERO_H * 0.08}) rotate(-4, 105, 65)`}>
        <Rect x="0" y="0" width="210" height="120" rx="16"
          fill="url(#cardGrad)" stroke={cardStroke} strokeWidth="1.5" strokeOpacity="0.4" />
        <Rect x="16" y="20" width="28" height="20" rx="5" fill="rgba(255,220,80,0.75)" />
        <SvgLine x1="16" y1="27" x2="44" y2="27" stroke="rgba(180,140,0,0.5)" strokeWidth="1" />
        <SvgLine x1="16" y1="33" x2="44" y2="33" stroke="rgba(180,140,0,0.5)" strokeWidth="1" />
        <SvgLine x1="27" y1="20" x2="27" y2="40" stroke="rgba(180,140,0,0.5)" strokeWidth="1" />
        <SvgLine x1="34" y1="20" x2="34" y2="40" stroke="rgba(180,140,0,0.5)" strokeWidth="1" />
        <Path d="M170,18 Q179,26 170,34" stroke="rgba(255,255,255,0.5)" strokeWidth="2" fill="none" strokeLinecap="round" />
        <Path d="M175,14 Q190,26 175,38" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <SvgText x="16" y="80" fontFamily="monospace" fontSize="12" fill="rgba(255,255,255,0.8)" letterSpacing="2">•••• •••• •••• 4291</SvgText>
        <SvgText x="16" y="102" fontFamily="Manrope-Regular" fontSize="9" fill="rgba(255,255,255,0.55)">GESTION MOMO</SvgText>
        <Circle cx="174" cy="100" r="12" fill="rgba(255,255,255,0.18)" />
        <Circle cx="186" cy="100" r="12" fill="rgba(255,255,255,0.25)" />
      </G>

      {/* Petite carte derrière */}
      <G transform={`translate(${W / 2 + 38}, ${HERO_H * 0.1}) rotate(8, 55, 45)`}>
        <Rect x="0" y="0" width="120" height="74" rx="13"
          fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        <Rect x="10" y="16" width="32" height="6" rx="3" fill="rgba(255,255,255,0.25)" />
        <Rect x="10" y="28" width="82" height="4" rx="2" fill="rgba(255,255,255,0.15)" />
        <Rect x="10" y="38" width="55" height="4" rx="2" fill="rgba(255,255,255,0.12)" />
      </G>

      {/* Badge SSL */}
      <G transform={`translate(${W / 2 - 48}, ${HERO_H - 36})`}>
        <Rect x="0" y="0" width="96" height="24" rx="12" fill="rgba(22,163,74,0.85)" />
        <Circle cx="14" cy="12" r="4" fill="rgba(255,255,255,0.9)" />
        <SvgText x="22" y="16" fontFamily="Manrope-Bold" fontSize="9" fontWeight="700" fill="#fff">Sécurisé SSL</SvgText>
      </G>

      {/* Pièce gauche */}
      <G transform="translate(24, 56)">
        <Circle cx="18" cy="18" r="18" fill="url(#coinGrad)" />
        <Circle cx="18" cy="18" r="13" fill="rgba(255,255,255,0.2)" />
        <SvgText x="12" y="23" fontFamily="Manrope-Bold" fontSize="13" fontWeight="800" fill="rgba(120,80,0,0.8)">F</SvgText>
      </G>

      {/* Pièce droite */}
      <G transform={`translate(${W - 62}, ${HERO_H * 0.32})`}>
        <Circle cx="18" cy="18" r="15" fill="url(#coinGrad)" />
        <Circle cx="18" cy="18" r="11" fill="rgba(255,255,255,0.2)" />
        <SvgText x="12" y="23" fontFamily="Manrope-Bold" fontSize="11" fontWeight="800" fill="rgba(120,80,0,0.8)">F</SvgText>
      </G>

      {/* Vague de transition vers la card */}
      <Path
        d={`M0,${HERO_H - 36} Q${W * 0.25},${HERO_H - 58} ${W * 0.5},${HERO_H - 40} Q${W * 0.75},${HERO_H - 22} ${W},${HERO_H - 48} L${W},${HERO_H} L0,${HERO_H} Z`}
        fill={isDark ? '#1E1E1E' : '#F3F4F6'}
      />
    </Svg>
  );
};

/* ─── Écran principal ────────────────────────────────────────── */
const LoginScreen = ({ navigation }) => {
  const { t }     = useTranslation();
  const theme     = useTheme();
  const { login } = useAuth();
  const toast     = useToast();

  const [step, setStep]       = useState('phone');
  const [phone, setPhone]     = useState('');
  const [pin, setPin]         = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});

  const slideAnim = useRef(new Animated.Value(40)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 550, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
      Animated.spring(cardScale, { toValue: 1, tension: 70, friction: 9,  useNativeDriver: true }),
    ]).start();
  }, []);

  const animateStep = () => {
    slideAnim.setValue(30);
    fadeAnim.setValue(0);
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 90, friction: 11, useNativeDriver: true }),
    ]).start();
  };

  const handlePhoneNext = () => {
    const { valid, error } = validateBeninPhone(phone);
    if (!valid) { setErrors({ phone: error }); return; }
    setErrors({});
    setStep('pin');
    animateStep();
  };

  const handleLogin = async () => {
    if (pin.length < 5) { setErrors({ pin: t('auth.pinRequired') }); return; }
    setLoading(true);
    try {
      await login(phone.trim(), pin);
      toast.success(t('auth.loginSuccess', { defaultValue: 'Connexion réussie' }));
    } catch (err) {
      const msg = err.response?.data?.error || t('auth.loginError');
      setErrors({ pin: msg });
      setPin('');
      toast.error(t('auth.loginFailed', { defaultValue: 'Échec' }), msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pin.length === 5 && step === 'pin') handleLogin();
  }, [pin]); // eslint-disable-line

  const isDark = theme.isDark;
  const pageBg = isDark ? '#1E1E1E' : '#F3F4F6';
  const cardBg = isDark ? '#2D2D2D' : '#FFFFFF';

  return (
    <View style={[styles.root, { backgroundColor: pageBg }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* ── Bandeau gradient en haut (absolute, ne pousse pas le contenu) ── */}
      <View style={{ height: HERO_H, width: W }}>
        <HeroBanner theme={theme} />
      </View>

      {/* ── Zone scrollable qui part sous le hero et remplit le reste ── */}
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Card principale — overlap sur le hero */}
          <Animated.View style={[
            styles.card,
            {
              backgroundColor: cardBg,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: cardScale }],
              ...Platform.select({
                ios: {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: isDark ? 0.4 : 0.12,
                  shadowRadius: 24,
                },
                android: { elevation: 10 },
              }),
            },
          ]}>

            {/* ── En-tête ── */}
            <View style={{ marginBottom: 20 }}>
              {step === 'phone' ? (
                <>
                  <View style={[styles.pill, {
                    backgroundColor: isDark ? 'rgba(10,102,194,0.2)' : 'rgba(10,102,194,0.08)',
                    borderColor: isDark ? 'rgba(10,102,194,0.4)' : 'rgba(10,102,194,0.18)',
                  }]}>
                    <View style={styles.pillDot} />
                    <Text style={[styles.pillText, { color: theme.colors.primary }]}>
                      {t('auth.secureLogin')}
                    </Text>
                  </View>
                  <Text style={[styles.title, { color: theme.text }]}>
                    {t('auth.welcomeTitle')}
                  </Text>
                  <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                    {t('auth.loginTitle')}
                  </Text>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    onPress={() => { setStep('phone'); setPin(''); setErrors({}); animateStep(); }}
                    style={styles.backBtn}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.backIcon, {
                      backgroundColor: isDark ? 'rgba(10,102,194,0.2)' : 'rgba(10,102,194,0.1)',
                    }]}>
                      <Icon name="arrow-left" size={16} color={theme.colors.primary} />
                    </View>
                    <Text style={[styles.backText, { color: theme.colors.primary }]}>
                      {phone}
                    </Text>
                  </TouchableOpacity>
                  <Text style={[styles.title, { color: theme.text }]}>
                    {t('auth.enterPin')}
                  </Text>
                  <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                    {t('auth.pinSubtitle')}
                  </Text>
                </>
              )}
            </View>

            {/* Séparateur */}
            <View style={[styles.divider, { backgroundColor: isDark ? '#3D3D3D' : '#F3F4F6' }]} />

            {/* ── Contenu step phone ── */}
            {step === 'phone' && (
              <View>
                {errors.general && (
                  <View style={[styles.errorBox, {
                    backgroundColor: isDark ? 'rgba(220,38,38,0.12)' : '#FEF2F2',
                    borderColor: isDark ? 'rgba(220,38,38,0.35)' : '#FECACA',
                  }]}>
                    <Icon name="alert-circle" size={16} color={theme.colors.error} />
                    <Text style={[styles.errorText, { color: theme.colors.error }]}>
                      {errors.general}
                    </Text>
                  </View>
                )}

                <Input
                  label={t('auth.phoneLabel')}
                  value={phone}
                  onChangeText={v => { setPhone(v); setErrors({}); }}
                  placeholder="+2290112345678"
                  keyboardType="phone-pad"
                  error={errors.phone}
                  leftIcon={<Icon name="phone-outline" size={18} color={theme.textSecondary} />}
                />

                <TouchableOpacity
                  onPress={handlePhoneNext}
                  activeOpacity={0.85}
                  style={[styles.continueBtn, {
                    backgroundColor: theme.colors.primary,
                    ...Platform.select({
                      ios: {
                        shadowColor: theme.colors.primary,
                        shadowOffset: { width: 0, height: 6 },
                        shadowOpacity: 0.35,
                        shadowRadius: 12,
                      },
                      android: { elevation: 6 },
                    }),
                  }]}
                >
                  <Text style={styles.continueBtnText}>{t('auth.next')}</Text>
                  <Icon name="arrow-right" size={18} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => navigation.navigate('ForgotPassword')}
                  style={styles.forgotBtn}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.forgotText, { color: theme.colors.primary }]}>
                    {t('auth.forgotPin')}
                  </Text>
                </TouchableOpacity>

                {/* Features */}
                <View style={[styles.featuresRow, { borderTopColor: isDark ? '#3D3D3D' : '#F3F4F6' }]}>
                  {[
                    { icon: 'shield-check-outline', label: t('login.featureSec')  },
                    { icon: 'flash-outline',         label: t('login.featureFast') },
                    { icon: 'chart-line',            label: t('login.featureLive') },
                  ].map(({ icon, label }) => (
                    <View key={label} style={styles.featureItem}>
                      <View style={[styles.featureIcon, {
                        backgroundColor: isDark ? 'rgba(10,102,194,0.15)' : 'rgba(10,102,194,0.08)',
                      }]}>
                        <Icon name={icon} size={18} color={theme.colors.primary} />
                      </View>
                      <Text style={[styles.featureLabel, { color: theme.textSecondary }]}>
                        {label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* ── Contenu step pin ── */}
            {step === 'pin' && (
              <View style={{ alignItems: 'center' }}>
                <PinInput
                  value={pin}
                  onChange={v => { setPin(v); setErrors({}); }}
                  maxLength={5}
                  error={errors.pin}
                />
                {loading && (
                  <View style={styles.verifyingRow}>
                    <Icon name="loading" size={16} color={theme.textSecondary} />
                    <Text style={[styles.verifyingText, { color: theme.textSecondary }]}>
                      {t('auth.verifying')}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </Animated.View>

          {/* Copyright en bas */}
          <Text style={[styles.copyright, { color: theme.textSecondary }]}>
            {t('common.copyright')}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

/* ─── Styles ─────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  kav: {
    flex: 1,
    marginTop: -32,   // overlap sur la vague du hero
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },

  /* Card */
  card: {
    borderRadius: 28,
    padding: 24,
    flex: 1,            // s'étire pour occuper tout l'espace disponible
    minHeight: H - HERO_H - 32 + 32,  // garantit que la card couvre le reste de l'écran
  },

  /* Header */
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 12,
  },
  pillDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#16A34A',
  },
  pillText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: 'Manrope-ExtraBold',
    fontSize: 26,
    letterSpacing: -0.8,
    lineHeight: 30,
  },
  subtitle: {
    fontFamily: 'Manrope-Regular',
    fontSize: 13,
    marginTop: 5,
    lineHeight: 18,
  },

  /* Back button (step pin) */
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  backIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontFamily: 'Manrope-Medium',
    fontSize: 13,
  },

  divider: {
    height: 1,
    marginBottom: 20,
  },

  /* Error box */
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  errorText: {
    flex: 1,
    fontFamily: 'Manrope-Medium',
    fontSize: 13,
  },

  /* Continue button */
  continueBtn: {
    height: 52,
    borderRadius: 16,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  continueBtnText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: '#fff',
    letterSpacing: 0.3,
  },

  /* Forgot link */
  forgotBtn: {
    alignItems: 'center',
    marginTop: 16,
  },
  forgotText: {
    fontFamily: 'Manrope-Medium',
    fontSize: 13,
  },

  /* Features */
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24,
    paddingTop: 18,
    borderTopWidth: 1,
  },
  featureItem: {
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  featureIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: {
    fontFamily: 'Manrope-Medium',
    fontSize: 10,
    textAlign: 'center',
  },

  /* Verifying */
  verifyingRow: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  verifyingText: {
    fontFamily: 'Manrope-Regular',
    fontSize: 13,
  },

  /* Copyright */
  copyright: {
    textAlign: 'center',
    marginTop: 16,
    fontFamily: 'Manrope-Regular',
    fontSize: 11,
  },
});

export default LoginScreen;
