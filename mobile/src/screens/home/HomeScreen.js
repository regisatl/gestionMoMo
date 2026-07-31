import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, RefreshControl,
  TouchableOpacity, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PlexusBackground from '../../components/ui/PlexusBackground';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Icon from '../../components/ui/Icon';
import useToast from '../../hooks/useToast';
import api from '../../services/api';

const TYPE_META = {
  deposit:    { icon: 'arrow-bottom-left',   color: '#16A34A' },
  withdrawal: { icon: 'arrow-top-right',     color: '#DC2626' },
  transfer:   { icon: 'swap-horizontal',     color: '#0A66C2' },
  payment:    { icon: 'credit-card-outline', color: '#7C3AED' },
  refund:     { icon: 'refresh',             color: '#D97706' },
};

const QuickAction = ({ iconName, label, onPress, theme }) => (
  <TouchableOpacity onPress={onPress} style={{ alignItems: 'center', gap: 8 }} activeOpacity={0.7}>
    <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={iconName} size={22} color="#FFF" />
    </View>
    <Text style={{ fontFamily: theme.typography.fontFamily.medium, fontSize: 11, color: 'rgba(255,255,255,0.9)' }}>
      {label}
    </Text>
  </TouchableOpacity>
);

const HomeScreen = ({ navigation }) => {
  const { t }    = useTranslation();
  const theme    = useTheme();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const toast    = useToast();

  const [account, setAccount]       = useState(null);
  const [recentTxns, setRecentTxns] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading]       = useState(true);

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      const requests = [api.get('/transactions?limit=5')];
      if (user?.role === 'merchant') {
        requests.push(api.get('/accounts/me'));
      }
      const results = await Promise.allSettled(requests);
      if (results[0].status === 'fulfilled') {
        setRecentTxns(results[0].value.data.transactions);
      } else {
        toast.error(t('common.error'), 'Impossible de charger les transactions');
      }
      if (results[1]?.status === 'fulfilled') setAccount(results[1].value.data.account);
      if (isRefresh) toast.success('Actualisé', 'Données mises à jour');
    } catch (_) {
      toast.error(t('common.error'), 'Erreur de chargement');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { loadData(false); }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData(true);
  };

  const formatAmount = (amount) =>
    new Intl.NumberFormat('fr-FR').format(amount) + ' XOF';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      <PlexusBackground />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        {/* ── Hero card ── */}
        <View
          style={{
            backgroundColor: theme.colors.primary,
            paddingHorizontal: 20, paddingTop: 20, paddingBottom: 36,
            borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
          }}
        >
          {/* Top row */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <View>
              <Text style={{ fontFamily: theme.typography.fontFamily.regular, fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
                {t('home.greeting')}
              </Text>
              <Text style={{ fontFamily: theme.typography.fontFamily.extraBold, fontSize: 20, color: '#FFF', marginTop: 2 }}>
                {user?.name}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('Notifications')}
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name="bell-outline" size={22} color="#FFF" />
              {unreadCount > 0 && (
                <View style={{ position: 'absolute', top: 6, right: 6, width: 14, height: 14, borderRadius: 7, backgroundColor: theme.colors.error, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: theme.colors.primary }}>
                  <Text style={{ fontSize: 8, color: '#FFF', fontFamily: theme.typography.fontFamily.bold }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Balance */}
          {user?.role === 'merchant' && account && (
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontFamily: theme.typography.fontFamily.regular, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                {t('home.availableBalance')}
              </Text>
              <Text style={{ fontFamily: theme.typography.fontFamily.extraBold, fontSize: 36, color: '#FFF', letterSpacing: -1, marginTop: 4 }}>
                {formatAmount(account.balance)}
              </Text>
              <Text style={{ fontFamily: theme.typography.fontFamily.regular, fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
                {account.momoAccountNumber}
              </Text>
            </View>
          )}

          {/* Quick actions */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            <QuickAction iconName="plus-circle-outline"          label={t('home.addMoney')}  onPress={() => navigation.navigate('Transactions', { screen: 'NewTransaction', params: { type: 'deposit' } })}    theme={theme} />
            <QuickAction iconName="send-outline"                 label={t('home.sendMoney')} onPress={() => navigation.navigate('Transactions', { screen: 'NewTransaction', params: { type: 'transfer' } })}   theme={theme} />
            <QuickAction iconName="arrow-up-circle-outline"      label={t('home.withdraw')}  onPress={() => navigation.navigate('Transactions', { screen: 'NewTransaction', params: { type: 'withdrawal' } })} theme={theme} />
            <QuickAction iconName="dots-horizontal-circle-outline" label={t('common.more')} onPress={() => navigation.navigate('Reports')} theme={theme} />
          </View>
        </View>

        {/* ── Recent transactions ── */}
        <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontFamily: theme.typography.fontFamily.bold, fontSize: 16, color: theme.text }}>
              {t('home.recentTransactions')}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
              <Text style={{ fontFamily: theme.typography.fontFamily.medium, fontSize: 13, color: theme.colors.primary }}>
                {t('common.seeAll')}
              </Text>
            </TouchableOpacity>
          </View>

          {recentTxns.length === 0 && !loading ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Icon name="swap-horizontal" size={40} color={theme.border} />
              <Text style={{ fontFamily: theme.typography.fontFamily.medium, color: theme.textSecondary, fontSize: 14, marginTop: 12 }}>
                {t('home.noTransactions')}
              </Text>
            </View>
          ) : (
            recentTxns.map((txn) => {
              const meta = TYPE_META[txn.type] || TYPE_META.transfer;
              return (
                <TouchableOpacity
                  key={txn._id}
                  onPress={() => navigation.navigate('Transactions', { screen: 'TransactionDetail', params: { id: txn._id } })}
                  style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.backgroundCard, marginBottom: 10, borderRadius: 14, borderWidth: 1, borderColor: theme.border, padding: 14, ...theme.shadows.sm }}
                >
                  <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: `${meta.color}15`, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <Icon name={meta.icon} size={20} color={meta.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: theme.typography.fontFamily.semiBold, fontSize: 14, color: theme.text }}>
                      {txn.clientName || txn.clientPhone || 'N/A'}
                    </Text>
                    <Text style={{ fontFamily: theme.typography.fontFamily.regular, fontSize: 11, color: theme.textSecondary, marginTop: 2 }}>
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
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;
