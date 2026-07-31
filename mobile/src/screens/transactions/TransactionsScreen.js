import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  TextInput, RefreshControl, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
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

const TransactionsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const FILTERS = [
    { key: 'all',        label: t('transactions.filters.all') },
    { key: 'deposit',    label: t('transactions.filters.deposit') },
    { key: 'withdrawal', label: t('transactions.filters.withdrawal') },
    { key: 'transfer',   label: t('transactions.filters.transfer') },
  ];

  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadTransactions = useCallback(async (reset = false) => {
    if (loading && !reset) return;
    setLoading(true);
    try {
      const params = { page: reset ? 1 : page, limit: 20 };
      if (filter !== 'all') params.type = filter;
      if (search.trim()) params.search = search.trim();

      const { data } = await api.get('/transactions', { params });
      const newTxns = data.transactions;

      setTransactions(reset ? newTxns : (prev) => [...prev, ...newTxns]);
      setHasMore(data.pagination.page < data.pagination.pages);
      if (reset) setPage(1);
      else setPage((p) => p + 1);
    } catch (_) {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, search, page, loading]);

  useEffect(() => { loadTransactions(true); }, [filter, search]);

  const formatAmount = (amount) => new Intl.NumberFormat('fr-FR').format(amount) + ' XOF';

  const renderItem = ({ item: txn }) => {
    const meta = TYPE_META[txn.type] || TYPE_META.transfer;
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('TransactionDetail', { id: txn._id })}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.backgroundCard,
          marginHorizontal: 20,
          marginBottom: 10,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: theme.border,
          padding: 14,
          ...theme.shadows.sm,
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            backgroundColor: `${meta.color}15`,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <Icon name={meta.icon} size={20} color={meta.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: theme.typography.fontFamily.semiBold, fontSize: 14, color: theme.text }}>
            {txn.clientName || txn.clientPhone || 'N/A'}
          </Text>
          <Text style={{ fontFamily: theme.typography.fontFamily.regular, fontSize: 11, color: theme.textSecondary, marginTop: 2 }}>
            {new Date(txn.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text
            style={{
              fontFamily: theme.typography.fontFamily.bold,
              fontSize: 14,
              color: txn.type === 'withdrawal' ? theme.colors.error : theme.colors.success,
            }}
          >
            {txn.type === 'withdrawal' ? '-' : '+'}{formatAmount(txn.amount)}
          </Text>
          <Badge status={txn.status} style={{ marginTop: 4 }} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top']}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 16,
        }}
      >
        <Text style={{ fontFamily: theme.typography.fontFamily.extraBold, fontSize: 22, color: theme.text }}>
          {t('transactions.title')}
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('NewTransaction')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.colors.primary,
            borderRadius: 12,
            paddingVertical: 8,
            paddingHorizontal: 14,
            gap: 4,
          }}
        >
          <Icon name="plus" size={16} color="#FFF" />
          <Text style={{ fontFamily: theme.typography.fontFamily.semiBold, fontSize: 13, color: '#FFF' }}>
            {t('transactions.newTransaction')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.inputBackground,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.inputBorder,
            paddingHorizontal: 12,
            height: 46,
          }}
        >
          <Icon name="magnify" size={18} color={theme.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t('transactions.searchPlaceholder')}
            placeholderTextColor={theme.placeholder}
            style={{
              flex: 1,
              fontFamily: theme.typography.fontFamily.regular,
              fontSize: 14,
              color: theme.text,
            }}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Icon name="close-circle" size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filters */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 20, marginBottom: 12, gap: 8 }}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={{
              paddingVertical: 6,
              paddingHorizontal: 14,
              borderRadius: 20,
              backgroundColor: filter === f.key ? theme.colors.primary : theme.surface,
            }}
          >
            <Text
              style={{
                fontFamily: theme.typography.fontFamily.medium,
                fontSize: 12,
                color: filter === f.key ? '#FFF' : theme.textSecondary,
              }}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={transactions}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadTransactions(true); }}
            tintColor={theme.colors.primary}
          />
        }
        onEndReached={() => { if (hasMore && !loading) loadTransactions(); }}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          !loading && (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Icon name="inbox-outline" size={48} color={theme.border} />
              <Text style={{ fontFamily: theme.typography.fontFamily.medium, color: theme.textSecondary, fontSize: 15, marginTop: 12 }}>
                {t('transactions.noTransactions')}
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
};

export default TransactionsScreen;
