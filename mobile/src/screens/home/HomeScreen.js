import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, RefreshControl,
  TouchableOpacity, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import api from '../../services/api';

const HomeScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  const [account, setAccount] = useState(null);
  const [recentTxns, setRecentTxns] = useState([]);
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const requests = [api.get('/transactions?limit=5')];
      if (user?.role === 'merchant') {
        requests.push(api.get('/accounts/me'));
        requests.push(api.get('/transactions/stats'));
      }
      const results = await Promise.allSettled(requests);
      if (results[0].status === 'fulfilled') setRecentTxns(results[0].value.data.transactions);
      if (results[1]?.status === 'fulfilled') setAccount(results[1].value.data.account);
      if (results[2]?.status === 'fulfilled') setStats(results[2].value.data);
    } catch (_) {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const formatAmount = (amount) =>
    new Intl.NumberFormat('fr-FR').format(amount) + ' XOF';

  const TYPE_COLORS = {
    deposit: '#16A34A', withdrawal: '#DC2626',
    transfer: '#0A66C2', payment: '#7C3AED', refund: '#D97706',
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top']}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: theme.spacing.base, paddingTop: theme.spacing.base, paddingBottom: theme.spacing.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ fontFamily: theme.typography.fontFamily.regular, fontSize: 13, color: theme.textSecondary }}>
                {t('home.greeting')}
              </Text>
              <Text style={{ fontFamily: theme.typography.fontFamily.extraBold, fontSize: theme.typography.fontSize.xl, color: theme.text, marginTop: 2 }}>
                {user?.name}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('Notifications')}
              style={{
                width: 42, height: 42, borderRadius: 21,
                backgroundColor: theme.surface, alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 20 }}>🔔</Text>
              {unreadCount > 0 && (
                <View style={{
                  position: 'absolute', top: 4, right: 4,
                  width: 16, height: 16, borderRadius: 8,
                  backgroundColor: theme.colors.error,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 9, color: '#FFF', fontFamily: theme.typography.fontFamily.bold }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Carte solde */}
        {user?.role === 'merchant' && account && (
          <View style={{ paddingHorizontal: theme.spacing.base, marginBottom: theme.spacing.lg }}>
            <Card
              elevated
              style={{
                backgroundColor: theme.colors.primary,
                borderWidth: 0,
              }}
            >
              <Text style={{ fontFamily: theme.typography.fontFamily.medium, fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 8 }}>
                {t('home.availableBalance')}
              </Text>
              <Text style={{ fontFamily: theme.typography.fontFamily.extraBold, fontSize: 34, color: '#FFF', letterSpacing: -1 }}>
                {formatAmount(account.balance)}
              </Text>
              <View style={{ flexDirection: 'row', marginTop: 16, gap: 24 }}>
                <View>
                  <Text style={{ fontFamily: theme.typography.fontFamily.regular, fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>
                    {t('home.momoAccount')}
                  </Text>
                  <Text style={{ fontFamily: theme.typography.fontFamily.semiBold, fontSize: 13, color: '#FFF', marginTop: 2 }}>
                    {account.momoAccountNumber}
                  </Text>
                </View>
              </View>
            </Card>
          </View>
        )}

        {/* Transactions récentes */}
        <View style={{ paddingHorizontal: theme.spacing.base }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md }}>
            <Text style={{ fontFamily: theme.typography.fontFamily.bold, fontSize: 16, color: theme.text }}>
              {t('home.recentTransactions')}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
              <Text style={{ fontFamily: theme.typography.fontFamily.medium, fontSize: 13, color: theme.colors.primary }}>
                {t('common.seeAll')}
              </Text>
            </TouchableOpacity>
          </View>

          {recentTxns.length === 0 ? (
            <Text style={{ fontFamily: theme.typography.fontFamily.regular, color: theme.textSecondary, textAlign: 'center', paddingVertical: theme.spacing.xl }}>
              {t('home.noTransactions')}
            </Text>
          ) : recentTxns.map((txn) => (
            <TouchableOpacity
              key={txn._id}
              onPress={() => navigation.navigate('Transactions', { screen: 'TransactionDetail', params: { id: txn._id } })}
              style={{
                flexDirection: 'row', alignItems: 'center',
                backgroundColor: theme.backgroundCard,
                marginBottom: theme.spacing.sm,
                borderRadius: theme.radius.md,
                borderWidth: 1, borderColor: theme.border,
                padding: theme.spacing.md,
                ...theme.shadows.sm,
              }}
            >
              <View style={{
                width: 40, height: 40, borderRadius: 20,
                backgroundColor: theme.surface,
                alignItems: 'center', justifyContent: 'center', marginRight: 12,
              }}>
                <Text style={{ fontSize: 17 }}>
                  {txn.type === 'deposit' ? '⬇' : txn.type === 'withdrawal' ? '⬆' : '↔'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: theme.typography.fontFamily.semiBold, fontSize: 14, color: theme.text }}>
                  {txn.clientName || txn.clientPhone || 'N/A'}
                </Text>
                <Text style={{ fontFamily: theme.typography.fontFamily.regular, fontSize: 11, color: theme.textSecondary, marginTop: 1 }}>
                  {t(`transactions.types.${txn.type}`, { defaultValue: txn.type })}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontFamily: theme.typography.fontFamily.bold, fontSize: 14, color: txn.type === 'withdrawal' ? theme.colors.error : theme.colors.success }}>
                  {txn.type === 'withdrawal' ? '-' : '+'}{formatAmount(txn.amount)}
                </Text>
                <Badge status={txn.status} style={{ marginTop: 4 }} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;
