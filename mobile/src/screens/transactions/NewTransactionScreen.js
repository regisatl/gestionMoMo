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
import Icon from '../../components/ui/Icon';
import api from '../../services/api';

const TYPES = [
  { key: 'deposit',    icon: 'arrow-bottom-left',  color: '#16A34A' },
  { key: 'withdrawal', icon: 'arrow-top-right',    color: '#DC2626' },
  { key: 'transfer',   icon: 'swap-horizontal',    color: '#0A66C2' },
];

const NewTransactionScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
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

  /* ── Success screen ── */
  if (success) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', padding: 24 }}>
        <View style={{ alignItems: 'center' }}>
          <View
            style={{
              width: 88,
              height: 88,
              borderRadius: 28,
              backgroundColor: '#DCFCE7',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}
          >
            <Icon name="check-circle" size={44} color="#16A34A" />
          </View>
          <Text style={{ fontFamily: theme.typography.fontFamily.extraBold, fontSize: 22, color: theme.text, marginBottom: 8 }}>
            {t('transactions.successTitle')}
          </Text>
          <Text style={{ fontFamily: theme.typography.fontFamily.regular, fontSize: 14, color: theme.textSecondary, textAlign: 'center', marginBottom: 32 }}>
            {t('transactions.successRef', { ref: success.reference })}
          </Text>
          <Button title={t('transactions.seeTransactions')} onPress={() => navigation.navigate('TransactionsList')} fullWidth />
          <Button
            title={t('transactions.newTransactionButton')}
            onPress={() => { setSuccess(null); setAmount(''); setClientPhone(''); setClientName(''); setDescription(''); }}
            fullWidth
            variant="outline"
            style={{ marginTop: 12 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>

          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: theme.surface,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <Icon name="arrow-left" size={20} color={theme.text} />
            </TouchableOpacity>
            <Text style={{ fontFamily: theme.typography.fontFamily.extraBold, fontSize: 20, color: theme.text }}>
              {t('transactions.newTitle')}
            </Text>
          </View>

          {/* Type selector */}
          <Text style={{ fontFamily: theme.typography.fontFamily.semiBold, fontSize: 13, color: theme.textSecondary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {t('transactions.transactionType')}
          </Text>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
            {TYPES.map((typeItem) => (
              <TouchableOpacity
                key={typeItem.key}
                onPress={() => setType(typeItem.key)}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  paddingVertical: 14,
                  borderRadius: 14,
                  borderWidth: 2,
                  borderColor: type === typeItem.key ? typeItem.color : theme.border,
                  backgroundColor: type === typeItem.key ? `${typeItem.color}10` : theme.backgroundCard,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: `${typeItem.color}18`,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 6,
                  }}
                >
                  <Icon name={typeItem.icon} size={20} color={typeItem.color} />
                </View>
                <Text
                  style={{
                    fontFamily: theme.typography.fontFamily.semiBold,
                    fontSize: 12,
                    color: type === typeItem.key ? typeItem.color : theme.textSecondary,
                  }}
                >
                  {t(`transactions.types.${typeItem.key}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Error */}
          {errors.general && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: theme.colors.errorLight,
                borderRadius: 12,
                padding: 12,
                marginBottom: 16,
                gap: 8,
              }}
            >
              <Icon name="alert-circle" size={16} color={theme.colors.error} />
              <Text style={{ flex: 1, fontFamily: theme.typography.fontFamily.medium, color: theme.colors.error, fontSize: 13 }}>
                {errors.general}
              </Text>
            </View>
          )}

          {/* Form */}
          <Input
            label={t('transactions.amountLabel')}
            value={amount}
            onChangeText={setAmount}
            placeholder={t('transactions.amountPlaceholder')}
            keyboardType="numeric"
            error={errors.amount}
            leftIcon={<Icon name="cash" size={18} color={theme.textSecondary} />}
          />
          <Input
            label={t('transactions.clientPhoneLabel')}
            value={clientPhone}
            onChangeText={setClientPhone}
            placeholder={t('auth.phonePlaceholder')}
            keyboardType="phone-pad"
            error={errors.clientPhone}
            leftIcon={<Icon name="phone-outline" size={18} color={theme.textSecondary} />}
          />
          <Input
            label={t('transactions.clientNameLabel')}
            value={clientName}
            onChangeText={setClientName}
            placeholder={t('transactions.clientNameLabel')}
            leftIcon={<Icon name="account-outline" size={18} color={theme.textSecondary} />}
          />
          <Input
            label={t('transactions.descriptionLabel')}
            value={description}
            onChangeText={setDescription}
            placeholder={t('transactions.descriptionPlaceholder')}
            multiline
            numberOfLines={3}
          />

          <Button
            title={t('transactions.confirmButton')}
            onPress={handleSubmit}
            loading={loading}
            fullWidth
            size="lg"
            style={{ marginTop: 8 }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default NewTransactionScreen;
