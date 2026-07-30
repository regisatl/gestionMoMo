import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const LoginScreen = ({ navigation }) => {
  const theme = useTheme();
  const { login } = useAuth();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!phone.trim()) errs.phone = 'Numéro de téléphone requis';
    if (!password) errs.password = 'Mot de passe requis';
    if (password && password.length < 8) errs.password = 'Minimum 8 caractères';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await login(phone.trim(), password);
    } catch (err) {
      const msg = err.response?.data?.error || 'Erreur de connexion. Réessayez.';
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
            GestionMoMo
          </Text>
          <Text
            style={{
              fontFamily: theme.typography.fontFamily.regular,
              fontSize: theme.typography.fontSize.base,
              color: theme.textSecondary,
              marginTop: 6,
            }}
          >
            Connectez-vous à votre compte
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
          label="Numéro de téléphone"
          value={phone}
          onChangeText={setPhone}
          placeholder="+229 00 00 00 00"
          keyboardType="phone-pad"
          error={errors.phone}
        />
        <Input
          label="Mot de passe"
          value={password}
          onChangeText={setPassword}
          placeholder="Votre mot de passe"
          secureTextEntry
          error={errors.password}
        />

        <TouchableOpacity
          onPress={() => navigation.navigate('ForgotPassword')}
          style={{ alignSelf: 'flex-end', marginTop: -theme.spacing.sm, marginBottom: theme.spacing.lg }}
        >
          <Text style={{ fontFamily: theme.typography.fontFamily.medium, fontSize: 13, color: theme.colors.primary }}>
            Mot de passe oublié ?
          </Text>
        </TouchableOpacity>

        <Button title="Se connecter" onPress={handleLogin} loading={loading} fullWidth size="lg" />

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
          © 2025 GestionMoMo — v1.0.0
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;
