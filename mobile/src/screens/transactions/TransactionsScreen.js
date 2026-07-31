import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  TextInput, RefreshControl, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import Badge from '../../components/ui/Badge';
import api from '../../services/api';

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

  const renderItem = ({ item: txn }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('TransactionDetail', { id: txn._id })}
      style={{
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: theme.backgroundCard,
        marginHorizontal: theme.spacing.base,
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
          {new Date(txn.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top']}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: theme.spacing.base, paddingVertical: theme.spacing.md }}>
        <Text style={{ fontFamily: theme.typography.fontFamily.extraBold, fontSize: theme.typography.fontSize.xl, color: theme.text }}>
          {t('transactions.title')}
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('NewTransaction')}
          style={{ backgroundColor: theme.colors.primary, borderRadius: theme.radius.md, paddingVertical: 8, paddingHorizontal: 14 }}
        >
          <Text style={{ fontFamily: theme.typography.fontFamily.semiBold, fontSize: 13, color: '#FFF' }}>
            {t('transactions.newTransaction')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Recherche */}
      <View style={{ paddingHorizontal: theme.spacing.base, marginBottom: theme.spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.inputBackground, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.inputBorder, paddingHorizontal: 12 }}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t('transactions.searchPlaceholder')}
            placeholderTextColor={theme.placeholder}
            style={{ flex: 1, height: 44, fontFamily: theme.typography.fontFamily.regular, fontSize: 14, color: theme.text }}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={{ fontSize: 16, color: theme.textSecondary }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filtres */}
      <View style={{ flexDirection: 'row', paddingHorizontal: theme.spacing.base, marginBottom: theme.spacing.md, gap: 8 }}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={{
              paddingVertical: 6, paddingHorizontal: 14,
              borderRadius: theme.radius.full,
              backgroundColor: filter === f.key ? theme.colors.primary : theme.surface,
            }}
          >
            <Text style={{ fontFamily: theme.typography.fontFamily.medium, fontSize: 12, color: filter === f.key ? '#FFF' : theme.textSecondary }}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Liste */}
      <FlatList
        data={transactions}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadTransactions(true); }} tintColor={theme.colors.primary} />}
        onEndReached={() => { if (hasMore && !loading) loadTransactions(); }}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          !loading && (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>📭</Text>
              <Text style={{ fontFamily: theme.typography.fontFamily.medium, color: theme.textSecondary, fontSize: 15 }}>
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
