import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import PinInput from '../../components/ui/PinInput';
import Icon from '../../components/ui/Icon';
import ScreenWrapper from '../../components/ui/ScreenWrapper';
import useToast from '../../hooks/useToast';
import { validateBeninPhone } from '../../utils/validation';

const LoginScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const theme  = useTheme();
  const { login } = useAuth();
  const toast  = useToast();

  const [step, setStep]     = useState('phone'); // 'phone' | 'pin'
  const [phone, setPhone]   = useState('');
  const [pin, setPin]       = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  /* ── Step 1 : valider le numéro ── */
  const handlePhoneNext = () => {
    const { valid, error } = validateBeninPhone(phone);
    if (!valid) {
      setErrors({ phone: error });
      toast.error('Numéro invalide', error);
      return;
    }
    setErrors({});
    setStep('pin');
  };

  /* ── Step 2 : connexion avec PIN ── */
  const handleLogin = async () => {
    if (pin.length < 5) {
      setErrors({ pin: t('auth.pinRequired') });
      toast.error(t('auth.pinRequired'));
      return;
    }
    setLoading(true);
    try {
      await login(phone.trim(), pin);
      // Le toast de bienvenue s'affiche après redirection —
      // le contexte auth navigue automatiquement, mais on peut
      // en afficher un ici pour confirmer visuellement.
      toast.success(t('auth.loginSuccess', { defaultValue: 'Connexion réussie' }));
    } catch (err) {
      const msg = err.response?.data?.error || t('auth.loginError');
      setErrors({ pin: msg });
      setPin('');
      toast.error(t('auth.loginFailed', { defaultValue: 'Échec de connexion' }), msg);
    } finally {
      setLoading(false);
    }
  };

  /* auto-submit quand les 5 chiffres sont saisis */
  useEffect(() => {
    if (pin.length === 5 && step === 'pin') {
      handleLogin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  return (
    <ScreenWrapper edges={['top', 'bottom']}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Logo ── */}
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <View
              style={{
                width: 76, height: 76, borderRadius: 22,
                backgroundColor: theme.colors.primary,
                alignItems: 'center', justifyContent: 'center',
                marginBottom: 16,
                ...theme.shadows.lg,
              }}
            >
              <Icon name="bank-transfer" size={38} color="#FFF" />
            </View>
            <Text style={{ fontFamily: theme.typography.fontFamily.extraBold, fontSize: 28, color: theme.text, letterSpacing: -0.5 }}>
              {t('common.appName')}
            </Text>
            <Text style={{ fontFamily: theme.typography.fontFamily.regular, fontSize: 14, color: theme.textSecondary, marginTop: 4 }}>
              {step === 'phone' ? t('auth.loginTitle') : t('auth.enterPin')}
            </Text>
          </View>

          {/* ── Step phone ── */}
          {step === 'phone' && (
            <View>
              {errors.general && (
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.errorLight, borderRadius: theme.radius.md, padding: 12, marginBottom: 16, gap: 8 }}>
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
              <Button
                title={t('auth.next')}
                onPress={handlePhoneNext}
                fullWidth size="lg"
                style={{ marginTop: 8 }}
              />
              <TouchableOpacity
                onPress={() => navigation.navigate('ForgotPassword')}
                style={{ alignItems: 'center', marginTop: 20 }}
              >
                <Text style={{ fontFamily: theme.typography.fontFamily.medium, fontSize: 13, color: theme.colors.primary }}>
                  {t('auth.forgotPin')}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Step PIN ── */}
          {step === 'pin' && (
            <View style={{ alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => { setStep('phone'); setPin(''); setErrors({}); }}
                style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginBottom: 24, gap: 4 }}
              >
                <Icon name="arrow-left" size={18} color={theme.colors.primary} />
                <Text style={{ fontFamily: theme.typography.fontFamily.medium, fontSize: 14, color: theme.colors.primary }}>
                  {phone}
                </Text>
              </TouchableOpacity>

              <PinInput
                value={pin}
                onChange={(v) => { setPin(v); setErrors({}); }}
                maxLength={5}
                error={errors.pin}
              />

              {loading && (
                <View style={{ marginTop: 24 }}>
                  <Text style={{ fontFamily: theme.typography.fontFamily.regular, fontSize: 13, color: theme.textSecondary }}>
                    {t('auth.verifying')}
                  </Text>
                </View>
              )}
            </View>
          )}

          <Text style={{ textAlign: 'center', marginTop: 48, fontFamily: theme.typography.fontFamily.regular, fontSize: 11, color: theme.textSecondary }}>
            {t('common.copyright')}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

export default LoginScreen;
