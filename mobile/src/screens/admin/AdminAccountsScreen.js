import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  RefreshControl, Alert, ActivityIndicator, StatusBar, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import PlexusBackground from '../../components/ui/PlexusBackground';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/Icon';
import Input from '../../components/ui/Input';
import AdminFormModal from '../../components/ui/AdminFormModal';
import useToast from '../../hooks/useToast';
import api from '../../services/api';

const fmt = (n = 0) => new Intl.NumberFormat('fr-FR').format(n);
const CURRENCIES = ['XOF', 'XAF', 'USD', 'EUR'];
const ENVS       = ['sandbox', 'production'];
const EMPTY_FORM = { merchantId: '', momoAccountNumber: '', currency: 'XOF', momoEnvironment: 'sandbox' };

const ActionBtn = ({ iconName, color, onPress, disabled }) => (
  <TouchableOpacity onPress={onPress} disabled={disabled} activeOpacity={0.7}
    style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: `${color}18`,
      alignItems: 'center', justifyContent: 'center', marginLeft: 5, opacity: disabled ? 0.4 : 1 }}>
    <Icon name={iconName} size={17} color={color} />
  </TouchableOpacity>
);

const AdminAccountsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const toast = useToast();

  const [accounts, setAccounts]     = useState([]);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [loading, setLoading]       = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [actionId, setActionId]     = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [errors, setErrors]         = useState({});
  const [freeMerchants, setFreeMerchants] = useState([]);
  const [merchantIndex, setMerchantIndex] = useState(0);
  const [envIndex, setEnvIndex]     = useState(0);
  const [currencyIndex, setCurrencyIndex] = useState(0);

  const sf = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  const load = useCallback(async (reset = false) => {
    const p = reset ? 1 : page;
    if (!reset) setLoading(true);
    try {
      const params = { page: p, limit: 15 };
      const { data } = await api.get('/accounts', { params });
      setAccounts(reset ? data.accounts : (prev) => [...prev, ...data.accounts]);
      setPagination(data.pagination);
      if (reset) setPage(2); else setPage((v) => v + 1);
    } catch (_) { toast.error(t('common.error')); }
    finally { setLoading(false); setRefreshing(false); }
  }, [page]);

  useEffect(() => { load(true); }, []);

  const loadFreeMerchants = async () => {
    try {
      const [mRes, aRes] = await Promise.all([
        api.get('/users/merchants', { params: { limit: 200 } }),
        api.get('/accounts', { params: { limit: 200 } }),
      ]);
      const usedIds = new Set(aRes.data.accounts.map((a) => a.merchantId?._id || a.merchantId));
      setFreeMerchants(mRes.data.merchants.filter((m) => !usedIds.has(m._id)));
    } catch (_) {}
  };

  const handleCreate = async () => {
    const e = {};
    if (!form.merchantId)          e.merchantId = t('admin.accounts.merchantRequired');
    if (!form.momoAccountNumber.trim()) e.momoAccountNumber = t('admin.accounts.momoRequired');
    setErrors(e);
    if (Object.keys(e).length) return;
    setFormLoading(true);
    try {
      await api.post('/accounts', {
        merchantId: form.merchantId,
        momoAccountNumber: form.momoAccountNumber,
        currency: CURRENCIES[currencyIndex],
        momoEnvironment: ENVS[envIndex],
      });
      toast.success(t('admin.accounts.created'));
      setCreateOpen(false); setForm(EMPTY_FORM); setErrors({});
      setMerchantIndex(0); setEnvIndex(0); setCurrencyIndex(0);
      load(true);
    } catch (err) { toast.error(t('common.error'), err.response?.data?.error); }
    finally { setFormLoading(false); }
  };

  const handleEdit = async () => {
    if (!form.momoAccountNumber.trim()) { setErrors({ momoAccountNumber: t('admin.accounts.momoRequired') }); return; }
    setFormLoading(true);
    try {
      await api.patch(`/accounts/${editTarget._id}`, {
        momoAccountNumber: form.momoAccountNumber,
        currency: CURRENCIES[currencyIndex],
        momoEnvironment: ENVS[envIndex],
      });
      toast.success(t('admin.accounts.updated'));
      setEditTarget(null); setForm(EMPTY_FORM); setErrors({});
      load(true);
    } catch (err) { toast.error(t('common.error'), err.response?.data?.error); }
    finally { setFormLoading(false); }
  };

  const handleToggleActive = (a) => {
    Alert.alert(t('common.confirm'),
      `${a.isActive ? t('admin.accounts.disableConfirm') : t('admin.accounts.enableConfirm')} ?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.confirm'), onPress: async () => {
            setActionId(a._id + '_t');
            try {
              await api.patch(`/accounts/${a._id}`, { isActive: !a.isActive });
              toast.success(a.isActive ? t('admin.accounts.disabled') : t('admin.accounts.enabled'));
              load(true);
            } catch (err) { toast.error(t('common.error'), err.response?.data?.error); }
            finally { setActionId(null); }
          },
        },
      ]
    );
  };

  const handleSync = async (a) => {
    setActionId(a._id + '_sync');
    try {
      await api.post(`/accounts/${a._id}/sync`);
      toast.success(t('admin.accounts.synced'));
      load(true);
    } catch (err) { toast.error(t('common.error'), err.response?.data?.error); }
    finally { setActionId(null); }
  };

  const renderItem = ({ item: a }) => {
    const merchant  = a.merchantId;
    const isActing  = [a._id + '_t', a._id + '_sync'].includes(actionId);
    const envColor  = a.momoEnvironment === 'production' ? '#16A34A' : '#D97706';
    return (
      <View style={[styles.row, { backgroundColor: theme.backgroundCard, borderColor: theme.border }]}>
        <View style={[styles.avatar, { backgroundColor: theme.colors.primaryAlpha }]}>
          <Icon name="credit-card-outline" size={20} color={theme.colors.primary} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ fontFamily: theme.typography.fontFamily.semiBold, fontSize: 14, color: theme.text }}>
            {merchant?.businessName || merchant?.name || '—'}
          </Text>
          <Text style={{ fontFamily: theme.typography.fontFamily.regular, fontSize: 12, color: theme.colors.primary, marginTop: 1 }}>
            {a.momoAccountNumber}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
            <Text style={{ fontFamily: theme.typography.fontFamily.bold, fontSize: 12, color: theme.colors.success }}>
              {fmt(a.balance)} XOF
            </Text>
            <View style={{ backgroundColor: `${envColor}18`, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 }}>
              <Text style={{ fontFamily: theme.typography.fontFamily.semiBold, fontSize: 10, color: envColor }}>{a.momoEnvironment}</Text>
            </View>
            <View style={{ backgroundColor: a.isActive ? '#DCFCE7' : '#FEE2E2', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 }}>
              <Text style={{ fontFamily: theme.typography.fontFamily.semiBold, fontSize: 10, color: a.isActive ? '#16A34A' : '#DC2626' }}>
                {a.isActive ? t('admin.common.active') : t('admin.common.inactive')}
              </Text>
            </View>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          {isActing
            ? <ActivityIndicator size="small" color={theme.colors.primary} />
            : <View style={{ flexDirection: 'row' }}>
                <ActionBtn iconName="pencil-outline"  color="#0A66C2" onPress={() => {
                  setEditTarget(a);
                  const ci = CURRENCIES.indexOf(a.currency); const ei = ENVS.indexOf(a.momoEnvironment);
                  setCurrencyIndex(ci >= 0 ? ci : 0); setEnvIndex(ei >= 0 ? ei : 0);
                  setForm({ merchantId: '', momoAccountNumber: a.momoAccountNumber, currency: a.currency, momoEnvironment: a.momoEnvironment });
                  setErrors({});
                }} />
                <ActionBtn iconName="sync"   color="#16A34A" onPress={() => handleSync(a)} disabled={actionId === a._id + '_sync'} />
                <ActionBtn iconName={a.isActive ? 'power-off' : 'power'}
                  color={a.isActive ? '#D97706' : '#16A34A'} onPress={() => handleToggleActive(a)} />
              </View>
          }
        </View>
      </View>
    );
  };

  /* Picker helpers */
  const cycleOption = (arr, idx, setIdx) => () => setIdx((idx + 1) % arr.length);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top']}>
      <PlexusBackground />
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

      <View style={[styles.topBar, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
          <Icon name="arrow-left" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={{ fontFamily: theme.typography.fontFamily.extraBold, fontSize: 20, color: theme.text, flex: 1, marginLeft: 12 }}>
          {t('admin.accounts.title')}
        </Text>
        <TouchableOpacity onPress={async () => { await loadFreeMerchants(); setCreateOpen(true); setForm(EMPTY_FORM); setErrors({}); setMerchantIndex(0); setEnvIndex(0); setCurrencyIndex(0); }}
          style={[styles.addBtn, { backgroundColor: theme.colors.primary }]}>
          <Icon name="plus" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={accounts} keyExtractor={(a) => a._id} renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        refreshControl={<RefreshControl refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(true); }} tintColor={theme.colors.primary} />}
        onEndReached={() => { if (page <= pagination.pages && !loading) load(); }}
        onEndReachedThreshold={0.4}
        ListFooterComponent={loading && !refreshing ? <ActivityIndicator color={theme.colors.primary} style={{ marginVertical: 16 }} /> : null}
        ListEmptyComponent={!loading && (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Icon name="credit-card-off-outline" size={48} color={theme.border} />
            <Text style={{ fontFamily: theme.typography.fontFamily.medium, color: theme.textSecondary, fontSize: 15, marginTop: 12 }}>
              {t('admin.accounts.noAccounts')}
            </Text>
          </View>
        )}
      />

      {/* CREATE */}
      <AdminFormModal visible={createOpen} onClose={() => { setCreateOpen(false); setForm(EMPTY_FORM); setErrors({}); }} title={t('admin.accounts.createTitle')}>
        <Text style={{ fontFamily: theme.typography.fontFamily.medium, fontSize: 13, color: theme.textSecondary, marginBottom: 8 }}>
          {t('admin.accounts.merchant')} *
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
          {freeMerchants.length === 0
            ? <Text style={{ fontFamily: theme.typography.fontFamily.regular, fontSize: 13, color: theme.textSecondary }}>{t('admin.accounts.noFreeMerchants')}</Text>
            : freeMerchants.map((m, i) => (
              <TouchableOpacity key={m._id} onPress={() => { setMerchantIndex(i); setForm((f) => ({ ...f, merchantId: m._id })); }}
                style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: form.merchantId === m._id ? theme.colors.primary : theme.surface, borderWidth: 1, borderColor: form.merchantId === m._id ? theme.colors.primary : theme.border }}>
                <Text style={{ fontFamily: theme.typography.fontFamily.medium, fontSize: 12, color: form.merchantId === m._id ? '#FFF' : theme.textSecondary }}>
                  {m.businessName || m.name}
                </Text>
              </TouchableOpacity>
            ))
          }
        </View>
        {errors.merchantId && <Text style={{ fontFamily: theme.typography.fontFamily.regular, fontSize: 12, color: theme.colors.error, marginBottom: 8 }}>{errors.merchantId}</Text>}

        <Input label={t('admin.accounts.momoNumber')} value={form.momoAccountNumber} onChangeText={sf('momoAccountNumber')} placeholder="MOMO-001" error={errors.momoAccountNumber} />

        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 4 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: theme.typography.fontFamily.medium, fontSize: 13, color: theme.textSecondary, marginBottom: 8 }}>{t('admin.accounts.currency')}</Text>
            <TouchableOpacity onPress={cycleOption(CURRENCIES, currencyIndex, setCurrencyIndex)}
              style={{ height: 50, borderRadius: 10, borderWidth: 1.5, borderColor: theme.inputBorder, backgroundColor: theme.inputBackground, justifyContent: 'center', paddingHorizontal: 14 }}>
              <Text style={{ fontFamily: theme.typography.fontFamily.medium, fontSize: 14, color: theme.text }}>{CURRENCIES[currencyIndex]}</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: theme.typography.fontFamily.medium, fontSize: 13, color: theme.textSecondary, marginBottom: 8 }}>{t('admin.accounts.environment')}</Text>
            <TouchableOpacity onPress={cycleOption(ENVS, envIndex, setEnvIndex)}
              style={{ height: 50, borderRadius: 10, borderWidth: 1.5, borderColor: theme.inputBorder, backgroundColor: theme.inputBackground, justifyContent: 'center', paddingHorizontal: 14 }}>
              <Text style={{ fontFamily: theme.typography.fontFamily.medium, fontSize: 14, color: theme.text }}>{ENVS[envIndex]}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={{ fontFamily: theme.typography.fontFamily.regular, fontSize: 11, color: theme.textSecondary, marginBottom: 16 }}>
          {t('admin.accounts.tapToCycle')}
        </Text>

        <Button title={t('admin.accounts.create')} onPress={handleCreate} loading={formLoading} fullWidth />
      </AdminFormModal>

      {/* EDIT */}
      <AdminFormModal visible={!!editTarget} onClose={() => { setEditTarget(null); setErrors({}); }} title={t('admin.accounts.editTitle')}>
        <Input label={t('admin.accounts.momoNumber')} value={form.momoAccountNumber} onChangeText={sf('momoAccountNumber')} error={errors.momoAccountNumber} />
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 4 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: theme.typography.fontFamily.medium, fontSize: 13, color: theme.textSecondary, marginBottom: 8 }}>{t('admin.accounts.currency')}</Text>
            <TouchableOpacity onPress={cycleOption(CURRENCIES, currencyIndex, setCurrencyIndex)}
              style={{ height: 50, borderRadius: 10, borderWidth: 1.5, borderColor: theme.inputBorder, backgroundColor: theme.inputBackground, justifyContent: 'center', paddingHorizontal: 14 }}>
              <Text style={{ fontFamily: theme.typography.fontFamily.medium, fontSize: 14, color: theme.text }}>{CURRENCIES[currencyIndex]}</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: theme.typography.fontFamily.medium, fontSize: 13, color: theme.textSecondary, marginBottom: 8 }}>{t('admin.accounts.environment')}</Text>
            <TouchableOpacity onPress={cycleOption(ENVS, envIndex, setEnvIndex)}
              style={{ height: 50, borderRadius: 10, borderWidth: 1.5, borderColor: theme.inputBorder, backgroundColor: theme.inputBackground, justifyContent: 'center', paddingHorizontal: 14 }}>
              <Text style={{ fontFamily: theme.typography.fontFamily.medium, fontSize: 14, color: theme.text }}>{ENVS[envIndex]}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={{ fontFamily: theme.typography.fontFamily.regular, fontSize: 11, color: theme.textSecondary, marginBottom: 16 }}>
          {t('admin.accounts.tapToCycle')}
        </Text>
        <Button title={t('common.save')} onPress={handleEdit} loading={formLoading} fullWidth />
      </AdminFormModal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  addBtn: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, padding: 14 },
  avatar: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
});

export default AdminAccountsScreen;
