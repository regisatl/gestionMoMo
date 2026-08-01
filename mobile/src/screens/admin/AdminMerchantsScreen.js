import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  RefreshControl, Alert, ActivityIndicator, StatusBar, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import PlexusBackground from '../../components/ui/PlexusBackground';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/Icon';
import Input from '../../components/ui/Input';
import AdminFormModal from '../../components/ui/AdminFormModal';
import Tooltip from '../../components/ui/Tooltip';
import useToast from '../../hooks/useToast';
import api from '../../services/api';

const PHONE_RE = /^\+22901\d{8}$/;
const EMAIL_RE = /^\S+@\S+\.\S+$/;
const EMPTY_FORM = { name: '', phone: '', email: '', businessName: '', password: '' };

const fmt = (n = 0) => new Intl.NumberFormat('fr-FR').format(n);

const ActionBtn = ({ iconName, color, onPress, disabled, tooltip }) => (
  <Tooltip content={tooltip} placement="top">
    <TouchableOpacity onPress={onPress} disabled={disabled} activeOpacity={0.7}
      style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: `${color}18`,
        alignItems: 'center', justifyContent: 'center', marginLeft: 5, opacity: disabled ? 0.4 : 1 }}>
      <Icon name={iconName} size={17} color={color} />
    </TouchableOpacity>
  </Tooltip>
);

const AdminMerchantsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const toast = useToast();
  const { user: currentUser, updateUser } = useAuth();

  const [merchants, setMerchants]   = useState([]);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [loading, setLoading]       = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showDeleted, setShowDeleted]   = useState(false);
  const [createOpen, setCreateOpen]     = useState(false);
  const [editTarget, setEditTarget]     = useState(null);
  const [secTarget, setSecTarget]       = useState(null);  // modal Sécurité
  const [formLoading, setFormLoading]   = useState(false);
  const [actionId, setActionId]         = useState(null);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [errors, setErrors]             = useState({});

  const sf = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  const load = useCallback(async (reset = false) => {
    const p = reset ? 1 : page;
    if (!reset) setLoading(true);
    try {
      const params = { page: p, limit: 15 };
      if (statusFilter)  params.status  = statusFilter;
      if (search.trim()) params.search  = search.trim();
      if (showDeleted)   params.deleted = 'true';
      const { data } = await api.get('/users/merchants', { params });
      setMerchants(reset ? data.merchants : (prev) => [...prev, ...data.merchants]);
      setPagination(data.pagination);
      if (reset) setPage(2); else setPage((v) => v + 1);
    } catch (_) { toast.error(t('common.error')); }
    finally { setLoading(false); setRefreshing(false); }
  }, [page, statusFilter, search, showDeleted]);

  useEffect(() => { load(true); }, [statusFilter, search, showDeleted]);

  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name = t('admin.users.nameRequired');
    if (!form.phone.trim()) e.phone = t('admin.users.phoneRequired');
    else if (!PHONE_RE.test(form.phone.trim())) e.phone = t('admin.users.phoneInvalid');
    if (form.email.trim() && !EMAIL_RE.test(form.email.trim())) e.email = t('admin.users.emailInvalid');
    if (!form.password.trim()) e.password = t('admin.users.passwordRequired');
    setErrors(e); return !Object.keys(e).length;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setFormLoading(true);
    try {
      await api.post('/users', { ...form, role: 'merchant' });
      toast.success(t('admin.merchants.created'), form.businessName || form.name);
      setCreateOpen(false); setForm(EMPTY_FORM); setErrors({}); load(true);
    } catch (err) { toast.error(t('common.error'), err.response?.data?.error); }
    finally { setFormLoading(false); }
  };

  const handleEdit = async () => {
    const e = {};
    if (!form.name.trim()) e.name = t('admin.users.nameRequired');
    if (form.email.trim() && !EMAIL_RE.test(form.email.trim())) e.email = t('admin.users.emailInvalid');
    if (form.phone.trim() && !PHONE_RE.test(form.phone.trim())) e.phone = t('admin.users.phoneInvalid');
    if (Object.keys(e).length) { setErrors(e); return; }
    setFormLoading(true);
    try {
      const { data } = await api.patch(`/users/${editTarget._id}`, {
        name: form.name,
        email: form.email || undefined,
        phone: form.phone || undefined,
        businessName: form.businessName || undefined,
      });
      // Si le marchand modifié est l'utilisateur connecté, on met à jour le contexte Auth
      if (currentUser?._id === editTarget._id) {
        updateUser(data.user);
      }
      toast.success(t('admin.merchants.updated'));
      setEditTarget(null); setForm(EMPTY_FORM); setErrors({}); load(true);
    } catch (err) { toast.error(t('common.error'), err.response?.data?.error); }
    finally { setFormLoading(false); }
  };

  const handleResetPassword = async () => {
    setFormLoading(true);
    try {
      const { data } = await api.patch(`/users/${secTarget._id}/reset-password`);
      toast.success(t('admin.merchants.passwordReset'), `MDP : ${data.newPassword}`);
    } catch (err) { toast.error(t('common.error'), err.response?.data?.error); }
    finally { setFormLoading(false); }
  };

  const handleResetPin = async () => {
    setFormLoading(true);
    try {
      const { data } = await api.patch(`/users/${secTarget._id}/reset-pin`);
      toast.success(t('admin.users.pinReset'), `PIN : ${data.newPin}`);
    } catch (err) { toast.error(t('common.error'), err.response?.data?.error); }
    finally { setFormLoading(false); }
  };

  const handleToggleStatus = (m) => {
    const next = m.status === 'active' ? 'suspended' : 'active';
    Alert.alert(t('common.confirm'),
      `${next === 'suspended' ? t('admin.common.suspend') : t('admin.common.activate')} ${m.businessName || m.name} ?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.confirm'), style: 'destructive', onPress: async () => {
            setActionId(m._id + '_s');
            try {
              await api.patch(`/users/${m._id}/status`, { status: next });
              toast.success(next === 'suspended' ? t('admin.merchants.suspended') : t('admin.merchants.activated'));
              load(true);
            } catch (err) { toast.error(t('common.error'), err.response?.data?.error); }
            finally { setActionId(null); }
          },
        },
      ]
    );
  };

  const handleDelete = (m) => {
    Alert.alert(t('admin.common.deleteTitle'), t('admin.merchants.deleteConfirm', { name: m.businessName || m.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: async () => {
          setActionId(m._id + '_d');
          try {
            await api.delete(`/users/${m._id}`, { data: { reason: '' } });
            toast.success(t('admin.merchants.deleted')); load(true);
          } catch (err) { toast.error(t('common.error'), err.response?.data?.error); }
          finally { setActionId(null); }
        },
      },
    ]);
  };

  const handleRestore = (m) => {
    Alert.alert(t('common.confirm'), t('admin.merchants.restoreConfirm', { name: m.businessName || m.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('admin.common.restore'), onPress: async () => {
          setActionId(m._id + '_r');
          try {
            await api.patch(`/users/${m._id}/restore`);
            toast.success(t('admin.merchants.restored')); load(true);
          } catch (err) { toast.error(t('common.error'), err.response?.data?.error); }
          finally { setActionId(null); }
        },
      },
    ]);
  };

  const renderItem = ({ item: m }) => {
    const isActing = [m._id + '_s', m._id + '_d', m._id + '_r'].includes(actionId);
    return (
      <View style={[styles.row, { backgroundColor: theme.backgroundCard, borderColor: theme.border, opacity: m.isDeleted ? 0.65 : 1 }]}>
        <View style={[styles.avatar, { backgroundColor: theme.colors.primaryAlpha }]}>
          <Text style={{ fontFamily: theme.typography.fontFamily.bold, fontSize: 15, color: theme.colors.primary }}>
            {(m.businessName || m.name)?.charAt(0)?.toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ fontFamily: theme.typography.fontFamily.semiBold, fontSize: 14, color: theme.text }}>
            {m.businessName || m.name}
          </Text>
          <Text style={{ fontFamily: theme.typography.fontFamily.regular, fontSize: 12, color: theme.textSecondary, marginTop: 1 }}>
            {m.phone}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
            {m.account && (
              <Text style={{ fontFamily: theme.typography.fontFamily.semiBold, fontSize: 11, color: theme.colors.success }}>
                {fmt(m.account.balance)} XOF
              </Text>
            )}
            {m.isDeleted
              ? <View style={{ backgroundColor: '#FEE2E2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                  <Text style={{ fontFamily: theme.typography.fontFamily.semiBold, fontSize: 10, color: '#DC2626' }}>{t('admin.common.deleted')}</Text>
                </View>
              : <Badge status={m.status} />
            }
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          {isActing
            ? <ActivityIndicator size="small" color={theme.colors.primary} />
            : m.isDeleted
              ? <ActionBtn iconName="restore" color="#16A34A" tooltip={t('admin.common.restore')} onPress={() => handleRestore(m)} />
              : <View style={{ flexDirection: 'row' }}>
                  <ActionBtn iconName="pencil-outline"     color="#0A66C2" tooltip={t('admin.common.edit')}     onPress={() => { setEditTarget(m); setForm({ name: m.name, email: m.email || '', phone: m.phone, businessName: m.businessName || '', password: '' }); setErrors({}); }} />
                  <ActionBtn iconName="shield-key-outline" color="#7C3AED" tooltip={t('admin.common.security')} onPress={() => { setSecTarget(m); }} />
                  <ActionBtn
                    iconName={m.status === 'active' ? 'pause-circle-outline' : 'play-circle-outline'}
                    color={m.status === 'active' ? '#D97706' : '#16A34A'}
                    tooltip={m.status === 'active' ? t('admin.common.suspend') : t('admin.common.activate')}
                    onPress={() => handleToggleStatus(m)}
                  />
                  <ActionBtn iconName="trash-can-outline" color="#DC2626" tooltip={t('admin.common.delete')} onPress={() => handleDelete(m)} />
                </View>
          }
        </View>
      </View>
    );
  };

  const STATUS_OPTS = [
    { value: '', label: t('admin.common.allStatuses') },
    { value: 'active', label: t('admin.common.active') },
    { value: 'suspended', label: t('admin.common.suspended') },
    { value: 'inactive', label: t('admin.common.inactive') },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top']}>
      <PlexusBackground />
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

      <View style={[styles.topBar, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
          <Icon name="arrow-left" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={{ fontFamily: theme.typography.fontFamily.extraBold, fontSize: 20, color: theme.text, flex: 1, marginLeft: 12 }}>
          {t('admin.merchants.title')}
        </Text>
        <TouchableOpacity onPress={() => { setCreateOpen(true); setForm(EMPTY_FORM); setErrors({}); }}
          style={[styles.addBtn, { backgroundColor: theme.colors.primary }]}>
          <Icon name="plus" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 }}>
        <View style={[styles.searchBar, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
          <Icon name="magnify" size={18} color={theme.textSecondary} />
          <TextInput value={search} onChangeText={setSearch}
            placeholder={t('admin.common.search')} placeholderTextColor={theme.placeholder}
            style={{ flex: 1, marginLeft: 8, fontFamily: theme.typography.fontFamily.regular, fontSize: 14, color: theme.text }} />
          {search.length > 0 && <TouchableOpacity onPress={() => setSearch('')}><Icon name="close-circle" size={16} color={theme.textSecondary} /></TouchableOpacity>}
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {STATUS_OPTS.map((o) => (
            <TouchableOpacity key={o.value} onPress={() => setStatusFilter(o.value)}
              style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
                backgroundColor: statusFilter === o.value ? theme.colors.primary : theme.surface,
                borderWidth: 1, borderColor: statusFilter === o.value ? theme.colors.primary : theme.border }}>
              <Text style={{ fontFamily: theme.typography.fontFamily.medium, fontSize: 12, color: statusFilter === o.value ? '#FFF' : theme.textSecondary }}>{o.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity onPress={() => setShowDeleted((v) => !v)}
        style={[styles.deletedToggle, { backgroundColor: showDeleted ? '#FEE2E215' : theme.surface, borderColor: showDeleted ? '#DC2626' : theme.border }]}>
        <Icon name={showDeleted ? 'eye-off-outline' : 'trash-can-outline'} size={15} color={showDeleted ? '#DC2626' : theme.textSecondary} />
        <Text style={{ fontFamily: theme.typography.fontFamily.medium, fontSize: 12, color: showDeleted ? '#DC2626' : theme.textSecondary, marginLeft: 6 }}>
          {showDeleted ? t('admin.common.hideDeleted') : t('admin.common.showDeleted')}
        </Text>
      </TouchableOpacity>

      <FlatList
        data={merchants} keyExtractor={(m) => m._id} renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        refreshControl={<RefreshControl refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(true); }} tintColor={theme.colors.primary} />}
        onEndReached={() => { if (page <= pagination.pages && !loading) load(); }}
        onEndReachedThreshold={0.4}
        ListFooterComponent={loading && !refreshing ? <ActivityIndicator color={theme.colors.primary} style={{ marginVertical: 16 }} /> : null}
        ListEmptyComponent={!loading && (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Icon name="store-outline" size={48} color={theme.border} />
            <Text style={{ fontFamily: theme.typography.fontFamily.medium, color: theme.textSecondary, fontSize: 15, marginTop: 12 }}>
              {t('admin.merchants.noMerchants')}
            </Text>
          </View>
        )}
      />

      {/* CREATE */}
      <AdminFormModal visible={createOpen} onClose={() => { setCreateOpen(false); setForm(EMPTY_FORM); setErrors({}); }} title={t('admin.merchants.createTitle')}>
        <Input label={t('admin.users.name')}         value={form.name}         onChangeText={sf('name')}         placeholder="Jean Dupont"         error={errors.name} />
        <Input label={t('admin.users.phone')}        value={form.phone}        onChangeText={sf('phone')}        placeholder="+2290112345678"      keyboardType="phone-pad"    error={errors.phone} />
        <Input label={t('admin.users.email')}        value={form.email}        onChangeText={sf('email')}        placeholder="jean@example.com"    keyboardType="email-address" autoCapitalize="none" error={errors.email} />
        <Input label={t('admin.merchants.business')} value={form.businessName} onChangeText={sf('businessName')} placeholder={t('admin.merchants.businessPlaceholder')} />
        <Input label={t('admin.users.password')}     value={form.password}     onChangeText={sf('password')}     secureTextEntry placeholder="••••••••" error={errors.password} />
        <Button title={t('admin.merchants.create')} onPress={handleCreate} loading={formLoading} fullWidth style={{ marginTop: 4 }} />
      </AdminFormModal>

      {/* EDIT */}
      <AdminFormModal visible={!!editTarget} onClose={() => { setEditTarget(null); setErrors({}); }} title={t('admin.merchants.editTitle')}>
        <Input label={t('admin.users.name')}         value={form.name}         onChangeText={sf('name')}         error={errors.name} />
        <Input label={t('admin.users.email')}        value={form.email}        onChangeText={sf('email')}        keyboardType="email-address" autoCapitalize="none" error={errors.email} />
        <Input
          label={t('admin.users.phone')}
          value={form.phone}
          onChangeText={sf('phone')}
          keyboardType="phone-pad"
          error={errors.phone}
        />
        <Input label={t('admin.merchants.business')} value={form.businessName} onChangeText={sf('businessName')} />
        <Button title={t('common.save')} onPress={handleEdit} loading={formLoading} fullWidth style={{ marginTop: 4 }} />
      </AdminFormModal>

      {/* SECURITE : reset mot de passe + reset PIN */}
      <AdminFormModal visible={!!secTarget} onClose={() => setSecTarget(null)} title={t('admin.common.security')}>
        <Text style={{ fontFamily: theme.typography.fontFamily.regular, fontSize: 13, color: theme.textSecondary, marginBottom: 16, lineHeight: 20 }}>
          {t('admin.common.securityHint', { name: secTarget?.businessName || secTarget?.name || '' })}
        </Text>

        {/* ── Mot de passe web-admin ── */}
        <View style={{ backgroundColor: `${theme.colors.primary}10`, borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: `${theme.colors.primary}25` }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Icon name="monitor-lock" size={16} color={theme.colors.primary} />
            <Text style={{ fontFamily: theme.typography.fontFamily.bold, fontSize: 13, color: theme.colors.primary }}>
              {t('admin.common.webPassword')}
            </Text>
          </View>
          <Text style={{ fontFamily: theme.typography.fontFamily.regular, fontSize: 12, color: theme.textSecondary, marginBottom: 10, lineHeight: 18 }}>
            {t('admin.common.resetPasswordDesc')}
          </Text>
          <Button title={t('admin.common.resetPassword')} onPress={handleResetPassword} loading={formLoading} fullWidth />
        </View>

        {/* ── PIN mobile ── */}
        <View style={{ backgroundColor: '#7C3AED10', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#7C3AED25' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Icon name="cellphone-key" size={16} color="#7C3AED" />
            <Text style={{ fontFamily: theme.typography.fontFamily.bold, fontSize: 13, color: '#7C3AED' }}>
              {t('admin.common.mobilePin')}
            </Text>
          </View>
          <Text style={{ fontFamily: theme.typography.fontFamily.regular, fontSize: 12, color: theme.textSecondary, marginBottom: 10, lineHeight: 18 }}>
            {t('admin.common.resetPinDesc')}
          </Text>
          <Button title={t('admin.common.resetPin')} onPress={handleResetPin} loading={formLoading} fullWidth style={{ backgroundColor: '#7C3AED' }} />
        </View>
      </AdminFormModal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  addBtn: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 12, height: 46 },
  deletedToggle: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginHorizontal: 16, marginBottom: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  row: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, padding: 14 },
  avatar: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
});

export default AdminMerchantsScreen;
