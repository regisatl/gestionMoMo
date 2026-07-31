import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const LoginScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { login } = useAuth();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!phone.trim()) errs.phone = t('auth.phoneRequired');
    if (!password) errs.password = t('auth.passwordRequired');
    if (password && password.length < 8) errs.password = t('auth.passwordMinLength');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await login(phone.trim(), password);
    } catch (err) {
      const msg = err.response?.data?.error || t('auth.loginError');
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: theme.spacing.xl }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo / Titre */}
        <View style={{ alignItems: 'center', marginBottom: theme.spacing['3xl'] }}>
          <View
            style={{
              width: 72, height: 72, borderRadius: 20,
              backgroundColor: theme.colors.primary,
              alignItems: 'center', justifyContent: 'center',
              marginBottom: theme.spacing.base,
              ...theme.shadows.lg,
            }}
          >
            <Text style={{ fontSize: 32 }}>💸</Text>
          </View>
          <Text
            style={{
              fontFamily: theme.typography.fontFamily.extraBold,
              fontSize: theme.typography.fontSize['3xl'],
              color: theme.text,
              letterSpacing: -0.5,
            }}
          >
            {t('common.appName')}
          </Text>
          <Text
            style={{
              fontFamily: theme.typography.fontFamily.regular,
              fontSize: theme.typography.fontSize.base,
              color: theme.textSecondary,
              marginTop: 6,
            }}
          >
            {t('auth.loginTitle')}
          </Text>
        </View>

        {/* Erreur globale */}
        {errors.general && (
          <View
            style={{
              backgroundColor: theme.colors.errorLight,
              borderRadius: theme.radius.md,
              padding: theme.spacing.md,
              marginBottom: theme.spacing.md,
            }}
          >
            <Text style={{ fontFamily: theme.typography.fontFamily.medium, color: theme.colors.error, fontSize: 13 }}>
              {errors.general}
            </Text>
          </View>
        )}

        {/* Formulaire */}
        <Input
          label={t('auth.phoneLabel')}
          value={phone}
          onChangeText={setPhone}
          placeholder={t('auth.phonePlaceholder')}
          keyboardType="phone-pad"
          error={errors.phone}
        />
        <Input
          label={t('auth.passwordLabel')}
          value={password}
          onChangeText={setPassword}
          placeholder={t('auth.passwordPlaceholder')}
          secureTextEntry
          error={errors.password}
        />

        <TouchableOpacity
          onPress={() => navigation.navigate('ForgotPassword')}
          style={{ alignSelf: 'flex-end', marginTop: -theme.spacing.sm, marginBottom: theme.spacing.lg }}
        >
          <Text style={{ fontFamily: theme.typography.fontFamily.medium, fontSize: 13, color: theme.colors.primary }}>
            {t('auth.forgotPassword')}
          </Text>
        </TouchableOpacity>

        <Button title={t('auth.loginButton')} onPress={handleLogin} loading={loading} fullWidth size="lg" />

        {/* Footer */}
        <Text
          style={{
            textAlign: 'center',
            marginTop: theme.spacing['3xl'],
            fontFamily: theme.typography.fontFamily.regular,
            fontSize: theme.typography.fontSize.xs,
            color: theme.textSecondary,
          }}
        >
          {t('common.copyright')}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;
