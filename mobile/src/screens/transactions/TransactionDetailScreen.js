import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import api from '../../services/api';

const DetailRow = ({ label, value, theme }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.border }}>
    <Text style={{ fontFamily: theme.typography.fontFamily.regular, fontSize: 13, color: theme.textSecondary, flex: 1 }}>{label}</Text>
    <Text style={{ fontFamily: theme.typography.fontFamily.medium, fontSize: 13, color: theme.text, flex: 1.5, textAlign: 'right' }}>{value || '—'}</Text>
  </View>
);

const TransactionDetailScreen = ({ navigation, route }) => {
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
  const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const TYPE_LABELS = { deposit: 'Dépôt', withdrawal: 'Retrait', transfer: 'Transfert', payment: 'Paiement', refund: 'Remboursement' };
  const TYPE_COLORS = { deposit: '#16A34A', withdrawal: '#DC2626', transfer: '#0A66C2', payment: '#7C3AED', refund: '#D97706' };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  if (!transaction) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontFamily: theme.typography.fontFamily.medium, color: theme.textSecondary }}>Transaction introuvable.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: theme.spacing.base, marginBottom: theme.spacing.sm }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
            <Text style={{ fontSize: 22, color: theme.text }}>←</Text>
          </TouchableOpacity>
          <Text style={{ fontFamily: theme.typography.fontFamily.extraBold, fontSize: 20, color: theme.text }}>
            Détail transaction
          </Text>
        </View>

        {/* Montant hero */}
        <View style={{ alignItems: 'center', paddingVertical: theme.spacing.xl, paddingHorizontal: theme.spacing.base }}>
          <View style={{
            width: 72, height: 72, borderRadius: 36,
            backgroundColor: `${TYPE_COLORS[transaction.type] || theme.colors.primary}18`,
            alignItems: 'center', justifyContent: 'center', marginBottom: 12,
          }}>
            <Text style={{ fontSize: 28, color: TYPE_COLORS[transaction.type] }}>
              {transaction.type === 'deposit' ? '⬇' : transaction.type === 'withdrawal' ? '⬆' : '↔'}
            </Text>
          </View>
          <Text style={{ fontFamily: theme.typography.fontFamily.extraBold, fontSize: 34, color: TYPE_COLORS[transaction.type], letterSpacing: -1 }}>
            {formatAmount(transaction.amount)}
          </Text>
          <Text style={{ fontFamily: theme.typography.fontFamily.medium, fontSize: 15, color: theme.textSecondary, marginTop: 4 }}>
            {TYPE_LABELS[transaction.type]}
          </Text>
          <Badge status={transaction.status} style={{ marginTop: 10 }} />
        </View>

        {/* Détails */}
        <View style={{ paddingHorizontal: theme.spacing.base, paddingBottom: theme.spacing['2xl'] }}>
          <Card>
            <DetailRow label="Référence" value={transaction.reference} theme={theme} />
            <DetailRow label="Client" value={transaction.clientName || transaction.clientPhone} theme={theme} />
            <DetailRow label="Téléphone" value={transaction.clientPhone} theme={theme} />
            <DetailRow label="Marchand" value={transaction.merchantId?.businessName || transaction.merchantId?.name} theme={theme} />
            <DetailRow label="Date" value={formatDate(transaction.createdAt)} theme={theme} />
            <DetailRow label="Description" value={transaction.description} theme={theme} />
            {transaction.fee > 0 && <DetailRow label="Frais" value={formatAmount(transaction.fee)} theme={theme} />}
            {transaction.momoReferenceId && <DetailRow label="Ref. MoMo" value={transaction.momoReferenceId} theme={theme} />}
            {transaction.momoStatus && <DetailRow label="Statut MoMo" value={transaction.momoStatus} theme={theme} />}
          </Card>

          {/* Suppression/restauration si applicable */}
          {transaction.isDeleted && (
            <Card style={{ backgroundColor: theme.colors.errorLight, borderColor: theme.colors.error, marginTop: theme.spacing.md }}>
              <Text style={{ fontFamily: theme.typography.fontFamily.semiBold, color: theme.colors.error, fontSize: 13 }}>
                ⚠ Transaction supprimée le {formatDate(transaction.deletedAt)}
              </Text>
              {transaction.deleteReason && (
                <Text style={{ fontFamily: theme.typography.fontFamily.regular, color: theme.colors.error, fontSize: 12, marginTop: 4 }}>
                  Motif : {transaction.deleteReason}
                </Text>
              )}
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default TransactionDetailScreen;
