import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Icon from '../../components/ui/Icon';
import useToast from '../../hooks/useToast';
import { validateBeninPhone } from '../../utils/validation';

const ForgotPasswordScreen = ({ navigation }) => {
  const theme = useTheme();
  const toast = useToast();

  const [phone, setPhone]       = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async () => {
    const { valid, error: phoneError } = validateBeninPhone(phone);
    if (!valid) {
      setError(phoneError);
      toast.error('Numéro invalide', phoneError);
      return;
    }
    setError('');
    setLoading(true);
    try {
      // TODO: appel API reset PIN
      await new Promise((r) => setTimeout(r, 1500));
      setSubmitted(true);
      toast.success('Code envoyé', `Instructions envoyées sur ${phone}`);
    } catch (_) {
      toast.error('Erreur', "Impossible d'envoyer le code. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top', 'bottom']}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 32, gap: 6 }}
          >
            <Icon name="arrow-left" size={20} color={theme.colors.primary} />
            <Text style={{ fontFamily: theme.typography.fontFamily.medium, color: theme.colors.primary, fontSize: 15 }}>
              Retour
            </Text>
          </TouchableOpacity>

          {/* Icon header */}
          <View
            style={{
              width: 64, height: 64, borderRadius: 18,
              backgroundColor: theme.colors.primaryAlpha,
              alignItems: 'center', justifyContent: 'center',
              marginBottom: 20,
            }}
          >
            <Icon name="lock-reset" size={30} color={theme.colors.primary} />
          </View>

          <Text style={{ fontFamily: theme.typography.fontFamily.extraBold, fontSize: 24, color: theme.text, marginBottom: 8 }}>
            Réinitialiser le PIN
          </Text>
          <Text style={{ fontFamily: theme.typography.fontFamily.regular, fontSize: 14, color: theme.textSecondary, marginBottom: 32, lineHeight: 21 }}>
            Entrez votre numéro de téléphone pour recevoir un code de réinitialisation de PIN.
          </Text>

          {submitted ? (
            <View
              style={{
                flexDirection: 'row', alignItems: 'flex-start',
                backgroundColor: theme.colors.successLight,
                borderRadius: theme.radius.lg, padding: 16, gap: 10,
              }}
            >
              <Icon name="check-circle" size={20} color={theme.colors.success} />
              <Text style={{ flex: 1, fontFamily: theme.typography.fontFamily.semiBold, color: theme.colors.success, fontSize: 14 }}>
                Instructions envoyées sur {phone}
              </Text>
            </View>
          ) : (
            <>
              <Input
                label="Numéro de téléphone"
                value={phone}
                onChangeText={(v) => { setPhone(v); setError(''); }}
                placeholder="+2290112345678"
                keyboardType="phone-pad"
                error={error}
                leftIcon={<Icon name="phone-outline" size={18} color={theme.textSecondary} />}
              />
              <Button
                title="Envoyer le code"
                onPress={handleSubmit}
                loading={loading}
                fullWidth size="lg"
                style={{ marginTop: 8 }}
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ForgotPasswordScreen;
