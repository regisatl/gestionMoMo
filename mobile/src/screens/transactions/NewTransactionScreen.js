import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import api from '../../services/api';

const TYPES = [
  { key: 'deposit', label: 'Dépôt', icon: '⬇', color: '#16A34A', description: 'Recevoir de l\'argent' },
  { key: 'withdrawal', label: 'Retrait', icon: '⬆', color: '#DC2626', description: 'Retirer de l\'argent' },
  { key: 'transfer', label: 'Transfert', icon: '↔', color: '#0A66C2', description: 'Envoyer à un autre compte' },
];

const NewTransactionScreen = ({ navigation, route }) => {
  const theme = useTheme();
  const initialType = route.params?.type || 'deposit';

  const [type, setType] = useState(initialType);
  const [amount, setAmount] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientName, setClientName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(null);

  const validate = () => {
    const errs = {};
    if (!amount || isNaN(amount) || parseFloat(amount) < 1) errs.amount = 'Montant invalide (minimum 1)';
    if (!clientPhone.trim()) errs.clientPhone = 'Numéro client requis';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const { data } = await api.post('/transactions', {
        type, amount: parseFloat(amount), clientPhone, clientName, description,
      });
      setSuccess(data.transaction);
    } catch (err) {
      setErrors({ general: err.response?.data?.error || 'Erreur lors de la création.' });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', padding: theme.spacing.xl }}>
        <View style={{ alignItems: 'center' }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <Text style={{ fontSize: 36 }}>✓</Text>
          </View>
          <Text style={{ fontFamily: theme.typography.fontFamily.extraBold, fontSize: 22, color: theme.text, marginBottom: 8 }}>
            Transaction créée
          </Text>
          <Text style={{ fontFamily: theme.typography.fontFamily.regular, fontSize: 14, color: theme.textSecondary, textAlign: 'center', marginBottom: 24 }}>
            Référence : {success.reference}
          </Text>
          <Button title="Voir les transactions" onPress={() => navigation.navigate('TransactionsList')} fullWidth />
          <Button title="Nouvelle transaction" onPress={() => { setSuccess(null); setAmount(''); setClientPhone(''); setClientName(''); }} fullWidth variant="outline" style={{ marginTop: 12 }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: theme.spacing.base }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.xl }}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
              <Text style={{ fontSize: 22, color: theme.text }}>←</Text>
            </TouchableOpacity>
            <Text style={{ fontFamily: theme.typography.fontFamily.extraBold, fontSize: 20, color: theme.text }}>
              Nouvelle transaction
            </Text>
          </View>

          {/* Sélection du type */}
          <Text style={{ fontFamily: theme.typography.fontFamily.semiBold, fontSize: 14, color: theme.textSecondary, marginBottom: 10 }}>
            Type de transaction
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: theme.spacing.lg }}>
            {TYPES.map((t) => (
              <TouchableOpacity
                key={t.key}
                onPress={() => setType(t.key)}
                style={{
                  flex: 1, alignItems: 'center', paddingVertical: 12,
                  borderRadius: theme.radius.md,
                  borderWidth: 2,
                  borderColor: type === t.key ? t.color : theme.border,
                  backgroundColor: type === t.key ? `${t.color}10` : theme.backgroundCard,
                }}
              >
                <Text style={{ fontSize: 22, marginBottom: 4 }}>{t.icon}</Text>
                <Text style={{ fontFamily: theme.typography.fontFamily.semiBold, fontSize: 12, color: type === t.key ? t.color : theme.textSecondary }}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Erreur globale */}
          {errors.general && (
            <Card style={{ backgroundColor: theme.colors.errorLight, borderColor: theme.colors.error, marginBottom: theme.spacing.md }}>
              <Text style={{ fontFamily: theme.typography.fontFamily.medium, color: theme.colors.error, fontSize: 13 }}>
                {errors.general}
              </Text>
            </Card>
          )}

          {/* Formulaire */}
          <Input label="Montant (XOF)" value={amount} onChangeText={setAmount} placeholder="Ex: 5000" keyboardType="numeric" error={errors.amount} />
          <Input label="Numéro de téléphone client" value={clientPhone} onChangeText={setClientPhone} placeholder="+229 00 00 00 00" keyboardType="phone-pad" error={errors.clientPhone} />
          <Input label="Nom du client (optionnel)" value={clientName} onChangeText={setClientName} placeholder="Nom complet" />
          <Input label="Description (optionnel)" value={description} onChangeText={setDescription} placeholder="Motif de la transaction" multiline numberOfLines={3} />

          <Button title="Confirmer la transaction" onPress={handleSubmit} loading={loading} fullWidth size="lg" style={{ marginTop: theme.spacing.md }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default NewTransactionScreen;
