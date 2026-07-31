import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import api from '../../services/api';

const NewTransactionScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const initialType = route.params?.type || 'deposit';

  const TYPES = [
    { key: 'deposit',    icon: '⬇', color: '#16A34A' },
    { key: 'withdrawal', icon: '⬆', color: '#DC2626' },
    { key: 'transfer',   icon: '↔', color: '#0A66C2' },
  ];

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
    if (!amount || isNaN(amount) || parseFloat(amount) < 1) errs.amount = t('transactions.invalidAmount');
    if (!clientPhone.trim()) errs.clientPhone = t('transactions.clientPhoneRequired');
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
      setErrors({ general: err.response?.data?.error || t('transactions.creationError') });
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
            {t('transactions.successTitle')}
          </Text>
          <Text style={{ fontFamily: theme.typography.fontFamily.regular, fontSize: 14, color: theme.textSecondary, textAlign: 'center', marginBottom: 24 }}>
            {t('transactions.successRef', { ref: success.reference })}
          </Text>
          <Button title={t('transactions.seeTransactions')} onPress={() => navigation.navigate('TransactionsList')} fullWidth />
          <Button
            title={t('transactions.newTransactionButton')}
            onPress={() => { setSuccess(null); setAmount(''); setClientPhone(''); setClientName(''); }}
            fullWidth variant="outline" style={{ marginTop: 12 }}
          />
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
              {t('transactions.newTitle')}
            </Text>
          </View>

          {/* Sélection du type */}
          <Text style={{ fontFamily: theme.typography.fontFamily.semiBold, fontSize: 14, color: theme.textSecondary, marginBottom: 10 }}>
            {t('transactions.transactionType')}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: theme.spacing.lg }}>
            {TYPES.map((typeItem) => (
              <TouchableOpacity
                key={typeItem.key}
                onPress={() => setType(typeItem.key)}
                style={{
                  flex: 1, alignItems: 'center', paddingVertical: 12,
                  borderRadius: theme.radius.md,
                  borderWidth: 2,
                  borderColor: type === typeItem.key ? typeItem.color : theme.border,
                  backgroundColor: type === typeItem.key ? `${typeItem.color}10` : theme.backgroundCard,
                }}
              >
                <Text style={{ fontSize: 22, marginBottom: 4 }}>{typeItem.icon}</Text>
                <Text style={{ fontFamily: theme.typography.fontFamily.semiBold, fontSize: 12, color: type === typeItem.key ? typeItem.color : theme.textSecondary }}>
                  {t(`transactions.types.${typeItem.key}`)}
                </Text>
                <Text style={{ fontFamily: theme.typography.fontFamily.regular, fontSize: 10, color: theme.textSecondary, textAlign: 'center', marginTop: 2 }}>
                  {t(`transactions.typeDescriptions.${typeItem.key}`)}
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
          <Input label={t('transactions.amountLabel')} value={amount} onChangeText={setAmount} placeholder={t('transactions.amountPlaceholder')} keyboardType="numeric" error={errors.amount} />
          <Input label={t('transactions.clientPhoneLabel')} value={clientPhone} onChangeText={setClientPhone} placeholder={t('auth.phonePlaceholder')} keyboardType="phone-pad" error={errors.clientPhone} />
          <Input label={t('transactions.clientNameLabel')} value={clientName} onChangeText={setClientName} placeholder={t('transactions.clientNameLabel')} />
          <Input label={t('transactions.descriptionLabel')} value={description} onChangeText={setDescription} placeholder={t('transactions.descriptionPlaceholder')} multiline numberOfLines={3} />

          <Button title={t('transactions.confirmButton')} onPress={handleSubmit} loading={loading} fullWidth size="lg" style={{ marginTop: theme.spacing.md }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default NewTransactionScreen;
