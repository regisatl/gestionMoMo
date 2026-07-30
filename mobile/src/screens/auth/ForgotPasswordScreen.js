import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const ForgotPasswordScreen = ({ navigation }) => {
  const theme = useTheme();
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!phone.trim()) return;
    setLoading(true);
    // TODO: appel API reset password
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1500);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: theme.spacing.xl }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: theme.spacing.lg, marginBottom: theme.spacing['2xl'] }}>
          <Text style={{ fontFamily: theme.typography.fontFamily.medium, color: theme.colors.primary, fontSize: 15 }}>
            ← Retour
          </Text>
        </TouchableOpacity>

        <Text style={{ fontFamily: theme.typography.fontFamily.extraBold, fontSize: theme.typography.fontSize['2xl'], color: theme.text, marginBottom: 8 }}>
          Réinitialiser le mot de passe
        </Text>
        <Text style={{ fontFamily: theme.typography.fontFamily.regular, fontSize: theme.typography.fontSize.base, color: theme.textSecondary, marginBottom: theme.spacing['2xl'] }}>
          Entrez votre numéro pour recevoir un code de réinitialisation.
        </Text>

        {submitted ? (
          <View style={{ backgroundColor: theme.colors.successLight, borderRadius: theme.radius.lg, padding: theme.spacing.lg }}>
            <Text style={{ fontFamily: theme.typography.fontFamily.semiBold, color: theme.colors.success, fontSize: 15 }}>
              ✓ Instructions envoyées sur {phone}
            </Text>
          </View>
        ) : (
          <>
            <Input
              label="Numéro de téléphone"
              value={phone}
              onChangeText={setPhone}
              placeholder="+229 00 00 00 00"
              keyboardType="phone-pad"
            />
            <Button title="Envoyer le code" onPress={handleSubmit} loading={loading} fullWidth size="lg" style={{ marginTop: theme.spacing.md }} />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ForgotPasswordScreen;
