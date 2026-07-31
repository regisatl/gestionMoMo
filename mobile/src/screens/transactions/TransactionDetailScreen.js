import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PlexusBackground from '../../components/ui/PlexusBackground';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Icon from '../../components/ui/Icon';
import api from '../../services/api';

const TYPE_META = {
  deposit:    { icon: 'arrow-bottom-left',  color: '#16A34A' },
  withdrawal: { icon: 'arrow-top-right',    color: '#DC2626' },
  transfer:   { icon: 'swap-horizontal',    color: '#0A66C2' },
  payment:    { icon: 'credit-card-outline', color: '#7C3AED' },
  refund:     { icon: 'refresh',            color: '#D97706' },
};

const DetailRow = ({ label, value, theme }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: theme.border }}>
    <Text style={{ fontFamily: theme.typography.fontFamily.regular, fontSize: 13, color: theme.textSecondary, flex: 1 }}>{label}</Text>
    <Text style={{ fontFamily: theme.typography.fontFamily.medium, fontSize: 13, color: theme.text, flex: 1.5, textAlign: 'right' }}>{value || '—'}</Text>
  </View>
);

const TransactionDetailScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { id } = route.params;
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/transactions/${id}`)
      .then(({ data }) => setTransaction(data.transaction))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const formatAmount = (amount) => new Intl.NumberFormat('fr-FR').format(amount) + ' XOF';
  const formatDate = (d) =>
    new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }}>
        <PlexusBackground />
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  if (!transaction) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
        <PlexusBackground />
        <Icon name="alert-circle-outline" size={40} color={theme.border} />
        <Text style={{ fontFamily: theme.typography.fontFamily.medium, color: theme.textSecondary }}>
          {t('common.noData')}
        </Text>
      </SafeAreaView>
    );
  }

  const meta = TYPE_META[transaction.type] || TYPE_META.transfer;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top']}>
      <PlexusBackground />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 20, marginBottom: 4 }}>
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
            {t('transactions.detail')}
          </Text>
        </View>

        {/* Hero amount */}
        <View style={{ alignItems: 'center', paddingVertical: 24, paddingHorizontal: 20 }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 24,
              backgroundColor: `${meta.color}15`,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
            }}
          >
            <Icon name={meta.icon} size={36} color={meta.color} />
          </View>
          <Text style={{ fontFamily: theme.typography.fontFamily.extraBold, fontSize: 34, color: meta.color, letterSpacing: -1 }}>
            {formatAmount(transaction.amount)}
          </Text>
          <Text style={{ fontFamily: theme.typography.fontFamily.medium, fontSize: 15, color: theme.textSecondary, marginTop: 4 }}>
            {t(`transactions.types.${transaction.type}`, { defaultValue: transaction.type })}
          </Text>
          <Badge status={transaction.status} style={{ marginTop: 10 }} />
        </View>

        {/* Details */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 32 }}>
          <Card>
            <DetailRow label={t('transactions.reference')} value={transaction.reference} theme={theme} />
            <DetailRow label={t('transactions.client')} value={transaction.clientName || transaction.clientPhone} theme={theme} />
            <DetailRow label={t('transactions.phone')} value={transaction.clientPhone} theme={theme} />
            <DetailRow label={t('transactions.merchant')} value={transaction.merchantId?.businessName || transaction.merchantId?.name} theme={theme} />
            <DetailRow label={t('transactions.date')} value={formatDate(transaction.createdAt)} theme={theme} />
            <DetailRow label={t('transactions.description')} value={transaction.description} theme={theme} />
            {transaction.fee > 0 && <DetailRow label={t('transactions.fees')} value={formatAmount(transaction.fee)} theme={theme} />}
            {transaction.momoReferenceId && <DetailRow label={t('transactions.momoRef')} value={transaction.momoReferenceId} theme={theme} />}
            {transaction.momoStatus && <DetailRow label={t('transactions.momoStatus')} value={transaction.momoStatus} theme={theme} />}
          </Card>

          {transaction.isDeleted && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                backgroundColor: theme.colors.errorLight,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: theme.colors.error,
                padding: 14,
                marginTop: 12,
                gap: 10,
              }}
            >
              <Icon name="alert" size={18} color={theme.colors.error} style={{ marginTop: 1 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: theme.typography.fontFamily.semiBold, color: theme.colors.error, fontSize: 13 }}>
                  {t('transactions.deletedOn', { date: formatDate(transaction.deletedAt) })}
                </Text>
                {transaction.deleteReason && (
                  <Text style={{ fontFamily: theme.typography.fontFamily.regular, color: theme.colors.error, fontSize: 12, marginTop: 4 }}>
                    {t('transactions.deleteReason', { reason: transaction.deleteReason })}
                  </Text>
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default TransactionDetailScreen;
