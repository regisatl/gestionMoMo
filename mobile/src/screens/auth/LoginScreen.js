import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, StatusBar,
  Animated, Dimensions, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, {
  Path, Circle, Rect, G, Defs, LinearGradient as SvgGradient,
  Stop, Ellipse, Line as SvgLine, Text as SvgText,
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

/* ─── Illustration wallet SVG inline ────────────────────────────── */
const WalletIllustration = ({ theme }) => {
  const isDark = theme.isDark;
  const cardBg = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.95)';
  const cardStroke = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,1)';

  return (
    <Svg width={W} height={220} viewBox={`0 0 ${W} 220`}>
      <Defs>
        <SvgGradient id="heroGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#0A66C2" />
          <Stop offset="0.5" stopColor="#1D8CF8" />
          <Stop offset="1" stopColor="#084E96" />
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
      <Rect x="0" y="0" width={W} height={220} fill="url(#heroGrad)" />

      {/* Vague ondulée en bas */}
      <Path
        d={`M0,180 Q${W * 0.25},155 ${W * 0.5},175 Q${W * 0.75},195 ${W},165 L${W},220 L0,220 Z`}
        fill={isDark ? '#1E1E1E' : '#FFFFFF'}
      />

      {/* Cercles décoratifs */}
      <Circle cx={W - 40} cy={40} r={60} fill="rgba(255,255,255,0.06)" />
      <Circle cx={W - 40} cy={40} r={38} fill="rgba(255,255,255,0.06)" />
      <Circle cx={30}     cy={160} r={45} fill="rgba(255,255,255,0.05)" />

      {/* Grille de points */}
      {[0,1,2,3,4].map(row =>
        [0,1,2,3].map(col => (
          <Circle
            key={`d-${row}-${col}`}
            cx={W - 120 + col * 18}
            cy={140 + row * 18}
            r={2}
            fill="rgba(255,255,255,0.25)"
          />
        ))
      )}

      {/* Carte principale (inclinée légèrement) */}
      <G transform={`translate(${W/2 - 110}, 22) rotate(-4, 110, 75)`}>
        <Rect x="0" y="0" width="215" height="130" rx="18" fill="url(#cardGrad)" stroke={cardStroke} strokeWidth="1.5" strokeOpacity="0.4"/>
        {/* Chip */}
        <Rect x="18" y="24" width="30" height="22" rx="5" fill="rgba(255,220,80,0.75)" />
        <SvgLine x1="18" y1="32" x2="48" y2="32" stroke="rgba(180,140,0,0.5)" strokeWidth="1"/>
        <SvgLine x1="18" y1="38" x2="48" y2="38" stroke="rgba(180,140,0,0.5)" strokeWidth="1"/>
        <SvgLine x1="30" y1="24" x2="30" y2="46" stroke="rgba(180,140,0,0.5)" strokeWidth="1"/>
        <SvgLine x1="37" y1="24" x2="37" y2="46" stroke="rgba(180,140,0,0.5)" strokeWidth="1"/>
        {/* WiFi contactless */}
        <Path d="M175,22 Q185,30 175,38" stroke="rgba(255,255,255,0.5)" strokeWidth="2" fill="none" strokeLinecap="round"/>
        <Path d="M180,18 Q196,30 180,42" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        {/* Numéro */}
        <SvgText x="18" y="88" fontFamily="monospace" fontSize="13" fill="rgba(255,255,255,0.8)" letterSpacing="2">•••• •••• •••• 4291</SvgText>
        {/* Nom */}
        <SvgText x="18" y="112" fontFamily="Manrope-Regular" fontSize="10" fill="rgba(255,255,255,0.55)">GESTION MOMO ADMIN</SvgText>
        {/* Logo réseau droit */}
        <Circle cx="178" cy="108" r="13" fill="rgba(255,255,255,0.18)" />
        <Circle cx="191" cy="108" r="13" fill="rgba(255,255,255,0.25)" />
      </G>

      {/* Petite carte derrière (empilée) */}
      <G transform={`translate(${W/2 + 40}, 30) rotate(8, 60, 55)`}>
        <Rect x="0" y="0" width="130" height="80" rx="14" fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
        <Rect x="12" y="18" width="36" height="7" rx="3" fill="rgba(255,255,255,0.25)" />
        <Rect x="12" y="32" width="90" height="5" rx="2" fill="rgba(255,255,255,0.15)" />
        <Rect x="12" y="44" width="60" height="5" rx="2" fill="rgba(255,255,255,0.12)" />
      </G>

      {/* Badge "Sécurisé" */}
      <G transform={`translate(${W/2 - 50}, 158)`}>
        <Rect x="0" y="0" width="100" height="26" rx="13" fill="rgba(22,163,74,0.85)"/>
        <Circle cx="15" cy="13" r="4" fill="rgba(255,255,255,0.9)"/>
        <SvgText x="24" y="17" fontFamily="Manrope-Bold" fontSize="10" fontWeight="700" fill="#fff">Sécurisé SSL</SvgText>
      </G>

      {/* Pièce flottante gauche */}
      <G transform="translate(28, 60)">
        <Circle cx="20" cy="20" r="20" fill="url(#coinGrad)"/>
        <Circle cx="20" cy="20" r="15" fill="rgba(255,255,255,0.2)" />
        <SvgText x="13" y="25" fontFamily="Manrope-Bold" fontSize="14" fontWeight="800" fill="rgba(120,80,0,0.8)">F</SvgText>
      </G>

      {/* Pièce flottante droite */}
      <G transform={`translate(${W - 68}, 80)`}>
        <Circle cx="20" cy="20" r="16" fill="url(#coinGrad)"/>
        <Circle cx="20" cy="20" r="12" fill="rgba(255,255,255,0.2)"/>
        <SvgText x="14" y="25" fontFamily="Manrope-Bold" fontSize="12" fontWeight="800" fill="rgba(120,80,0,0.8)">F</SvgText>
      </G>
    </Svg>
  );
};

/* ─── Écran principal ───────────────────────────────────────────── */
const LoginScreen = ({ navigation }) => {
  const { t }      = useTranslation();
  const theme      = useTheme();
  const { login }  = useAuth();
  const toast      = useToast();

  const [step, setStep]       = useState('phone');
  const [phone, setPhone]     = useState('');
  const [pin, setPin]         = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});

  /* Animations */
  const slideAnim  = useRef(new Animated.Value(40)).current;
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const cardScale  = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 550, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
      Animated.spring(cardScale, { toValue: 1, tension: 70, friction: 9, useNativeDriver: true }),
    ]).start();
  }, []);

  /* Re-anime lors du changement de step */
  const animateStep = () => {
    slideAnim.setValue(30);
    fadeAnim.setValue(0);
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 90, friction: 11, useNativeDriver: true }),
    ]).start();
  };

  /* ── Step 1 ── */
  const handlePhoneNext = () => {
    const { valid, error } = validateBeninPhone(phone);
    if (!valid) { setErrors({ phone: error }); return; }
    setErrors({});
    setStep('pin');
    animateStep();
  };

  /* ── Step 2 ── */
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
  const cardBg = isDark ? '#2D2D2D' : '#FFFFFF';

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Hero illustration (haut de page, fond gradient + wave) */}
      <WalletIllustration theme={theme} />

      {/* Card formulaire flottante */}
      <KeyboardAvoidingView
        style={{ flex: 1, marginTop: -24 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{
            marginHorizontal: 20,
            backgroundColor: cardBg,
            borderRadius: 28,
            padding: 28,
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: cardScale },
            ],
            // Shadow
            ...Platform.select({
              ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: isDark ? 0.4 : 0.12, shadowRadius: 24 },
              android: { elevation: 10 },
            }),
          }}>
            {/* En-tête de la card */}
            <View style={{ marginBottom: 24 }}>
              {step === 'phone' ? (
                <>
                  {/* Pill "Connexion sécurisée" */}
                  <View style={{
                    flexDirection: 'row', alignItems: 'center', gap: 6,
                    alignSelf: 'flex-start',
                    backgroundColor: isDark ? 'rgba(10,102,194,0.2)' : 'rgba(10,102,194,0.08)',
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(10,102,194,0.4)' : 'rgba(10,102,194,0.18)',
                    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4,
                    marginBottom: 14,
                  }}>
                    <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#16A34A' }} />
                    <Text style={{ fontFamily: theme.typography.fontFamily.semiBold, fontSize: 11, color: theme.colors.primary, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                      {t('auth.secureLogin')}
                    </Text>
                  </View>
                  <Text style={{ fontFamily: theme.typography.fontFamily.extraBold, fontSize: 26, color: theme.text, letterSpacing: -0.8, lineHeight: 30 }}>
                    {t('auth.welcomeTitle')}
                  </Text>
                  <Text style={{ fontFamily: theme.typography.fontFamily.regular, fontSize: 13, color: theme.textSecondary, marginTop: 6, lineHeight: 18 }}>
                    {t('auth.loginTitle')}
                  </Text>
                </>
              ) : (
                <View>
                  {/* Retour */}
                  <TouchableOpacity
                    onPress={() => { setStep('phone'); setPin(''); setErrors({}); animateStep(); }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 18, alignSelf: 'flex-start' }}
                    activeOpacity={0.7}
                  >
                    <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: isDark ? 'rgba(10,102,194,0.2)' : 'rgba(10,102,194,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="arrow-left" size={16} color={theme.colors.primary} />
                    </View>
                    <Text style={{ fontFamily: theme.typography.fontFamily.medium, fontSize: 13, color: theme.colors.primary }}>
                      {phone}
                    </Text>
                  </TouchableOpacity>
                  <Text style={{ fontFamily: theme.typography.fontFamily.extraBold, fontSize: 26, color: theme.text, letterSpacing: -0.8, lineHeight: 30 }}>
                    {t('auth.enterPin')}
                  </Text>
                  <Text style={{ fontFamily: theme.typography.fontFamily.regular, fontSize: 13, color: theme.textSecondary, marginTop: 6 }}>
                    {t('auth.pinSubtitle')}
                  </Text>
                </View>
              )}
            </View>

            {/* Séparateur décoratif */}
            <View style={{ height: 1, backgroundColor: isDark ? '#3D3D3D' : '#F3F4F6', marginBottom: 24 }} />

            {/* ── Contenu selon step ── */}
            {step === 'phone' && (
              <View>
                {/* Message d'erreur général */}
                {errors.general && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: isDark ? 'rgba(220,38,38,0.12)' : '#FEF2F2', borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: isDark ? 'rgba(220,38,38,0.35)' : '#FECACA' }}>
                    <Icon name="alert-circle" size={16} color={theme.colors.error} />
                    <Text style={{ flex: 1, fontFamily: theme.typography.fontFamily.medium, color: theme.colors.error, fontSize: 13 }}>
                      {errors.general}
                    </Text>
                  </View>
                )}

                <Input
                  label={t('auth.phoneLabel')}
                  value={phone}
                  onChangeText={(v) => { setPhone(v); setErrors({}); }}
                  placeholder="+2290112345678"
                  keyboardType="phone-pad"
                  error={errors.phone}
                  leftIcon={<Icon name="phone-outline" size={18} color={theme.textSecondary} />}
                />

                {/* Bouton Continuer */}
                <TouchableOpacity
                  onPress={handlePhoneNext}
                  activeOpacity={0.85}
                  style={{
                    height: 52, borderRadius: 16, marginTop: 8,
                    backgroundColor: theme.colors.primary,
                    alignItems: 'center', justifyContent: 'center',
                    flexDirection: 'row', gap: 8,
                    ...Platform.select({
                      ios: { shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12 },
                      android: { elevation: 6 },
                    }),
                  }}
                >
                  <Text style={{ fontFamily: theme.typography.fontFamily.bold, fontSize: 16, color: '#fff', letterSpacing: 0.3 }}>
                    {t('auth.next')}
                  </Text>
                  <Icon name="arrow-right" size={18} color="#fff" />
                </TouchableOpacity>

                {/* Lien mot de passe oublié */}
                <TouchableOpacity
                  onPress={() => navigation.navigate('ForgotPassword')}
                  style={{ alignItems: 'center', marginTop: 18 }}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontFamily: theme.typography.fontFamily.medium, fontSize: 13, color: theme.colors.primary }}>
                    {t('auth.forgotPin')}
                  </Text>
                </TouchableOpacity>

                {/* Features rapides */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 28, paddingTop: 20, borderTopWidth: 1, borderTopColor: isDark ? '#3D3D3D' : '#F3F4F6' }}>
                  {[
                    { icon: 'shield-check-outline', label: t('login.featureSec')  },
                    { icon: 'flash-outline',         label: t('login.featureFast') },
                    { icon: 'chart-line',            label: t('login.featureLive') },
                  ].map(({ icon, label }) => (
                    <View key={label} style={{ alignItems: 'center', gap: 5, flex: 1 }}>
                      <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: isDark ? 'rgba(10,102,194,0.15)' : 'rgba(10,102,194,0.08)', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name={icon} size={18} color={theme.colors.primary} />
                      </View>
                      <Text style={{ fontFamily: theme.typography.fontFamily.medium, fontSize: 10, color: theme.textSecondary, textAlign: 'center' }}>
                        {label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {step === 'pin' && (
              <View style={{ alignItems: 'center' }}>
                <PinInput
                  value={pin}
                  onChange={(v) => { setPin(v); setErrors({}); }}
                  maxLength={5}
                  error={errors.pin}
                />
                {loading && (
                  <View style={{ marginTop: 20, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Icon name="loading" size={16} color={theme.textSecondary} />
                    <Text style={{ fontFamily: theme.typography.fontFamily.regular, fontSize: 13, color: theme.textSecondary }}>
                      {t('auth.verifying')}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </Animated.View>

          {/* Copyright */}
          <Text style={{ textAlign: 'center', marginTop: 24, fontFamily: theme.typography.fontFamily.regular, fontSize: 11, color: theme.textSecondary }}>
            {t('common.copyright')}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default LoginScreen;
