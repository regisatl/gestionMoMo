import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, CreditCard, RefreshCw, Pencil,
  PowerOff, Power, Plus, KeyRound, Hash,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Tooltip from '../components/ui/Tooltip';
import { useNotifications } from '../context/NotificationContext';
import api from '../services/api';

const fmt = (n = 0) => new Intl.NumberFormat('fr-FR').format(n);

const IconBtn = ({ icon: Icon, color, tooltip, onClick, disabled }) => (
  <Tooltip content={tooltip} placement="top" delay={200}>
    <button onClick={onClick} disabled={disabled}
      style={{ width: '30px', height: '30px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1.5px solid ${color}30`, background: `${color}12`, color, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, transition: 'background 0.15s, transform 0.1s', flexShrink: 0 }}
      onMouseEnter={(e) => { if (!disabled) { e.currentTarget.style.background = `${color}25`; e.currentTarget.style.transform = 'scale(1.1)'; } }}
      onMouseLeave={(e) => { e.currentTarget.style.background = `${color}12`; e.currentTarget.style.transform = 'scale(1)'; }}
    >
      <Icon size={14} strokeWidth={2.2} />
    </button>
  </Tooltip>
);

const Th = ({ children }) => (
  <th style={{ fontFamily: 'var(--font)', fontWeight: 600, fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'left', padding: '12px 14px', textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>
    {children}
  </th>
);

const CURRENCIES = ['XOF', 'XAF', 'USD', 'EUR'];
const ENVS       = ['sandbox', 'production'];
const EMPTY_FORM = { merchantId: '', momoAccountNumber: '', currency: 'XOF', momoEnvironment: 'sandbox', momoUserId: '' };

const AccountsPage = () => {
  const { t } = useTranslation();
  const { addToast } = useNotifications();

  const [accounts, setAccounts]     = useState([]);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [loading, setLoading]       = useState(false);
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState('');

  /* merchants without an account — for create dropdown */
  const [freeMerchants, setFreeMerchants] = useState([]);

  const [createOpen, setCreateOpen]       = useState(false);
  const [editTarget, setEditTarget]       = useState(null);
  const [resetPwdTarget, setResetPwdTarget] = useState(null);
  const [resetPinTarget, setResetPinTarget] = useState(null);

  const [form, setForm]               = useState(EMPTY_FORM);
  const [formErrors, setFormErrors]   = useState({});
  const [formLoading, setFormLoading] = useState(false);
  const [actionId, setActionId]       = useState(null);
  const [resetResult, setResetResult] = useState(null); // supprimé — plus utilisé

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  /* ── Load accounts ── */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search.trim()) params.search = search.trim();
      const { data } = await api.get('/accounts', { params });
      setAccounts(data.accounts);
      setPagination(data.pagination);
    } catch (_) {
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  /* ── Load free merchants (no account) for create select ── */
  const loadFreeMerchants = async () => {
    try {
      const { data } = await api.get('/users/merchants', { params: { limit: 200 } });
      const existing = await api.get('/accounts', { params: { limit: 200 } });
      const usedIds  = new Set(existing.data.accounts.map((a) => a.merchantId?._id || a.merchantId));
      setFreeMerchants(data.merchants.filter((m) => !usedIds.has(m._id)));
    } catch (_) {}
  };

  /* ── Create ── */
  const openCreate = async () => {
    await loadFreeMerchants();
    setForm(EMPTY_FORM);
    setFormErrors({});
    setCreateOpen(true);
  };

  const validateCreate = () => {
    const errs = {};
    if (!form.merchantId.trim())        errs.merchantId        = t('accounts.form.merchantRequired');
    if (!form.momoAccountNumber.trim()) errs.momoAccountNumber = t('accounts.form.momoNumberRequired');
    setFormErrors(errs);
    return !Object.keys(errs).length;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!validateCreate()) return;
    setFormLoading(true);
    try {
      await api.post('/accounts', {
        merchantId:        form.merchantId,
        momoAccountNumber: form.momoAccountNumber,
        currency:          form.currency,
        momoEnvironment:   form.momoEnvironment,
        momoUserId:        form.momoUserId || undefined,
      });
      addToast({ type: 'success', title: t('toast.accountCreated') });
      setCreateOpen(false);
      load();
    } catch (err) {
      addToast({ type: 'error', title: t('common.error'), message: err.response?.data?.error });
    } finally {
      setFormLoading(false);
    }
  };

  /* ── Edit ── */
  const openEdit = (a) => {
    setEditTarget(a);
    setForm({
      merchantId:        a.merchantId?._id || a.merchantId || '',
      momoAccountNumber: a.momoAccountNumber,
      currency:          a.currency,
      momoEnvironment:   a.momoEnvironment,
      momoUserId:        a.momoUserId || '',
    });
    setFormErrors({});
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!form.momoAccountNumber.trim()) { setFormErrors({ momoAccountNumber: t('accounts.form.momoNumberRequired') }); return; }
    setFormLoading(true);
    try {
      await api.patch(`/accounts/${editTarget._id}`, {
        momoAccountNumber: form.momoAccountNumber,
        currency:          form.currency,
        momoEnvironment:   form.momoEnvironment,
      });
      addToast({ type: 'success', title: t('toast.accountUpdated') });
      setEditTarget(null);
      load();
    } catch (err) {
      addToast({ type: 'error', title: t('common.error'), message: err.response?.data?.error });
    } finally {
      setFormLoading(false);
    }
  };

  /* ── Toggle isActive ── */
  const handleToggleActive = async (a) => {
    setActionId(a._id + '_toggle');
    try {
      await api.patch(`/accounts/${a._id}`, { isActive: !a.isActive });
      addToast({ type: 'success', title: a.isActive ? t('toast.accountDisabled') : t('toast.accountEnabled') });
      load();
    } catch (err) {
      addToast({ type: 'error', title: t('common.error'), message: err.response?.data?.error });
    } finally {
      setActionId(null);
    }
  };

  /* ── Sync balance ── */
  const handleSync = async (a) => {
    setActionId(a._id + '_sync');
    try {
      await api.post(`/accounts/${a._id}/sync`);
      addToast({ type: 'success', title: t('toast.accountSynced') });
      load();
    } catch (err) {
      addToast({ type: 'error', title: t('common.error'), message: err.response?.data?.error });
    } finally {
      setActionId(null);
    }
  };

  /* ── Reset password du marchand lié — aléatoire côté serveur ── */
  const handleResetPassword = async () => {
    setFormLoading(true);
    try {
      const merchantId = resetPwdTarget.merchantId?._id || resetPwdTarget.merchantId;
      const merchant   = resetPwdTarget.merchantId;
      const name       = merchant?.businessName || merchant?.name || '—';
      await api.patch(`/users/${merchantId}/reset-password`);
      setResetPwdTarget(null);
      addToast({ type: 'success', title: t('toast.passwordReset'), message: t('toast.resetSentToUser', { name }) });
    } catch (err) {
      addToast({ type: 'error', title: t('toast.passwordError'), message: err.response?.data?.error });
    } finally {
      setFormLoading(false);
    }
  };

  /* ── Reset PIN du marchand lié — aléatoire côté serveur ── */
  const handleResetPin = async () => {
    setFormLoading(true);
    try {
      const merchantId = resetPinTarget.merchantId?._id || resetPinTarget.merchantId;
      const merchant   = resetPinTarget.merchantId;
      const name       = merchant?.businessName || merchant?.name || '—';
      await api.patch(`/users/${merchantId}/reset-pin`);
      setResetPinTarget(null);
      addToast({ type: 'success', title: t('toast.pinReset'), message: t('toast.resetSentToUser', { name }) });
    } catch (err) {
      addToast({ type: 'error', title: t('toast.pinError'), message: err.response?.data?.error });
    } finally {
      setFormLoading(false);
    }
  };

  const closeCreate   = () => { setCreateOpen(false); setForm(EMPTY_FORM); setFormErrors({}); };
  const closeEdit     = () => { setEditTarget(null); setForm(EMPTY_FORM); setFormErrors({}); };
  const closeResetPwd = () => { setResetPwdTarget(null); };
  const closeResetPin = () => { setResetPinTarget(null); };

  const countLabel = pagination.total <= 1
    ? t('accounts.accountCount', { count: pagination.total })
    : t('accounts.accountCountPlural', { count: pagination.total });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <Input
          placeholder={t('accounts.searchPlaceholder')}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          icon={<Search size={15} color="var(--text-secondary)" />}
          style={{ flex: '1 1 240px', maxWidth: '360px' }}
        />
        <Button variant="primary" onClick={openCreate} icon={<Plus size={15} strokeWidth={2} />}>
          {t('accounts.newAccount')}
        </Button>
      </div>

      {/* Table */}
      <Card padding="0">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <Th>{t('accounts.tableHeaders.merchant')}</Th>
                <Th>{t('accounts.tableHeaders.momoAccount')}</Th>
                <Th>{t('accounts.tableHeaders.balance')}</Th>
                <Th>{t('accounts.tableHeaders.currency')}</Th>
                <Th>{t('accounts.tableHeaders.environment')}</Th>
                <Th>{t('accounts.tableHeaders.status')}</Th>
                <Th>{t('accounts.tableHeaders.lastSync')}</Th>
                <Th>{t('accounts.tableHeaders.actions')}</Th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontFamily: 'var(--font)' }}>{t('common.loading')}</td></tr>
              ) : accounts.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontFamily: 'var(--font)' }}>{t('accounts.noAccounts')}</td></tr>
              ) : accounts.map((a) => {
                const merchant = a.merchantId;
                return (
                  <tr key={a._id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'var(--color-primary-alpha)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font)', fontWeight: 700, fontSize: '13px', color: 'var(--color-primary)', flexShrink: 0 }}>
                          {(merchant?.businessName || merchant?.name || '?')?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontFamily: 'var(--font)', fontWeight: 600, fontSize: '13px', color: 'var(--text)' }}>{merchant?.businessName || merchant?.name || '—'}</div>
                          <div style={{ fontFamily: 'var(--font)', fontSize: '11px', color: 'var(--text-secondary)' }}>{merchant?.phone || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', fontFamily: 'var(--font)', fontSize: '13px', color: 'var(--color-primary)', fontWeight: 500 }}>{a.momoAccountNumber}</td>
                    <td style={{ padding: '12px 14px', fontFamily: 'var(--font)', fontSize: '13px', fontWeight: 700, color: 'var(--color-success)' }}>{fmt(a.balance)} F</td>
                    <td style={{ padding: '12px 14px', fontFamily: 'var(--font)', fontSize: '12px', color: 'var(--text-secondary)' }}>{a.currency}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontFamily: 'var(--font)', fontSize: '11px', fontWeight: 600, color: a.momoEnvironment === 'production' ? '#16A34A' : '#D97706', background: a.momoEnvironment === 'production' ? '#DCFCE7' : '#FEF3C7', padding: '2px 8px', borderRadius: '6px' }}>
                        {a.momoEnvironment}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontFamily: 'var(--font)', fontSize: '11px', fontWeight: 600, color: a.isActive ? '#16A34A' : '#DC2626', background: a.isActive ? '#DCFCE7' : '#FEE2E2', padding: '2px 8px', borderRadius: '6px' }}>
                        {a.isActive ? t('accounts.active') : t('accounts.inactive')}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontFamily: 'var(--font)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {a.lastSync ? new Date(a.lastSync).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                        <IconBtn icon={Pencil}     color="#0A66C2" tooltip={t('common.edit')}              onClick={() => openEdit(a)} />
                        <IconBtn icon={KeyRound}   color="#7C3AED" tooltip={t('common.resetPassword')}     onClick={() => { setResetPwdTarget(a); setNewPassword(''); }} />
                        <IconBtn icon={Hash}       color="#0284C7" tooltip={t('common.resetPin')}          onClick={() => { setResetPinTarget(a); setNewPin(''); }} />
                        <IconBtn icon={RefreshCw}  color="#16A34A" tooltip={t('accounts.sync')}            onClick={() => handleSync(a)} disabled={actionId === a._id + '_sync'} />
                        <IconBtn
                          icon={a.isActive ? PowerOff : Power}
                          color={a.isActive ? '#D97706' : '#16A34A'}
                          tooltip={a.isActive ? t('accounts.disable') : t('accounts.enable')}
                          onClick={() => handleToggleActive(a)}
                          disabled={actionId === a._id + '_toggle'}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
          <span style={{ fontFamily: 'var(--font)', fontSize: '13px', color: 'var(--text-secondary)' }}>{countLabel}</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>{t('common.previous')}</Button>
            <span style={{ fontFamily: 'var(--font)', fontSize: '13px', color: 'var(--text)', padding: '6px 12px', background: 'var(--surface)', borderRadius: '8px' }}>{page} {t('common.of')} {pagination.pages || 1}</span>
            <Button size="sm" variant="secondary" disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)}>{t('common.next')}</Button>
          </div>
        </div>
      </Card>

      {/* ── CREATE modal ── */}
      <Modal open={createOpen} onClose={closeCreate} title={t('accounts.newAccount')} width={500}>
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontFamily: 'var(--font)', fontWeight: 500, fontSize: '13px', color: 'var(--text-secondary)' }}>
              {t('accounts.form.merchant')} <span style={{ color: 'var(--color-error)' }}>*</span>
            </label>
            <select value={form.merchantId} onChange={setField('merchantId')}
              style={{ height: '44px', padding: '0 14px', borderRadius: '10px', border: `1.5px solid ${formErrors.merchantId ? 'var(--color-error)' : 'var(--input-border)'}`, background: 'var(--input-bg)', color: 'var(--text)', fontFamily: 'var(--font)', fontSize: '14px' }}>
              <option value="">{t('accounts.form.selectMerchant')}</option>
              {freeMerchants.map((m) => (
                <option key={m._id} value={m._id}>{m.businessName || m.name} — {m.phone}</option>
              ))}
            </select>
            {formErrors.merchantId && <span style={{ fontFamily: 'var(--font)', fontSize: '12px', color: 'var(--color-error)' }}>{formErrors.merchantId}</span>}
          </div>

          <Input
            label={t('accounts.form.momoNumber')}
            value={form.momoAccountNumber} onChange={setField('momoAccountNumber')}
            placeholder="MOMO-001"
            icon={<CreditCard size={15} color="var(--text-secondary)" />}
            error={formErrors.momoAccountNumber} required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontFamily: 'var(--font)', fontWeight: 500, fontSize: '13px', color: 'var(--text-secondary)' }}>{t('accounts.form.currency')}</label>
              <select value={form.currency} onChange={setField('currency')}
                style={{ height: '44px', padding: '0 14px', borderRadius: '10px', border: '1.5px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--text)', fontFamily: 'var(--font)', fontSize: '14px' }}>
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontFamily: 'var(--font)', fontWeight: 500, fontSize: '13px', color: 'var(--text-secondary)' }}>{t('accounts.form.environment')}</label>
              <select value={form.momoEnvironment} onChange={setField('momoEnvironment')}
                style={{ height: '44px', padding: '0 14px', borderRadius: '10px', border: '1.5px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--text)', fontFamily: 'var(--font)', fontSize: '14px' }}>
                {ENVS.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>

          <Input
            label={t('accounts.form.momoUserId')}
            value={form.momoUserId} onChange={setField('momoUserId')}
            placeholder="UUID MTN MoMo (optionnel)"
          />

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '4px' }}>
            <Button type="button" variant="secondary" onClick={closeCreate}>{t('common.cancel')}</Button>
            <Button type="submit" variant="primary" loading={formLoading} icon={<CreditCard size={14} />}>{t('accounts.form.create')}</Button>
          </div>
        </form>
      </Modal>

      {/* ── EDIT modal ── */}
      <Modal open={!!editTarget} onClose={closeEdit} title={t('common.edit') + ' — ' + (editTarget?.momoAccountNumber || '')} width={460}>
        <form onSubmit={handleEdit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <Input
            label={t('accounts.form.momoNumber')}
            value={form.momoAccountNumber} onChange={setField('momoAccountNumber')}
            icon={<CreditCard size={15} color="var(--text-secondary)" />}
            error={formErrors.momoAccountNumber} required
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontFamily: 'var(--font)', fontWeight: 500, fontSize: '13px', color: 'var(--text-secondary)' }}>{t('accounts.form.currency')}</label>
              <select value={form.currency} onChange={setField('currency')}
                style={{ height: '44px', padding: '0 14px', borderRadius: '10px', border: '1.5px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--text)', fontFamily: 'var(--font)', fontSize: '14px' }}>
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontFamily: 'var(--font)', fontWeight: 500, fontSize: '13px', color: 'var(--text-secondary)' }}>{t('accounts.form.environment')}</label>
              <select value={form.momoEnvironment} onChange={setField('momoEnvironment')}
                style={{ height: '44px', padding: '0 14px', borderRadius: '10px', border: '1.5px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--text)', fontFamily: 'var(--font)', fontSize: '14px' }}>
                {ENVS.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '4px' }}>
            <Button type="button" variant="secondary" onClick={closeEdit}>{t('common.cancel')}</Button>
            <Button type="submit" variant="primary" loading={formLoading}>{t('common.save')}</Button>
          </div>
        </form>
      </Modal>

      {/* ── RESET PASSWORD modal — confirmation ── */}
      <Modal open={!!resetPwdTarget} onClose={closeResetPwd} title={t('common.resetPassword') + ' — ' + (resetPwdTarget?.merchantId?.businessName || resetPwdTarget?.merchantId?.name || '')} width={420}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 16px', borderRadius: '12px', background: 'var(--color-warning-light)', border: '1px solid rgba(217,119,6,0.3)' }}>
            <KeyRound size={18} color="#D97706" style={{ flexShrink: 0, marginTop: '1px' }} />
            <p style={{ fontFamily: 'var(--font)', fontSize: '13px', color: 'var(--text)', margin: 0, lineHeight: 1.6 }}>
              {t('common.resetPasswordConfirm', { name: resetPwdTarget?.merchantId?.businessName || resetPwdTarget?.merchantId?.name })}
            </p>
          </div>
          <p style={{ fontFamily: 'var(--font)', fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
            {t('common.resetAutoHint')}
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '4px' }}>
            <Button type="button" variant="secondary" onClick={closeResetPwd}>{t('common.cancel')}</Button>
            <Button type="button" variant="primary" loading={formLoading} onClick={handleResetPassword} icon={<KeyRound size={14} />}>{t('common.resetPassword')}</Button>
          </div>
        </div>
      </Modal>

      {/* ── RESET PIN modal — confirmation ── */}
      <Modal open={!!resetPinTarget} onClose={closeResetPin} title={t('common.resetPin') + ' — ' + (resetPinTarget?.merchantId?.businessName || resetPinTarget?.merchantId?.name || '')} width={420}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 16px', borderRadius: '12px', background: 'var(--color-info-light)', border: '1px solid rgba(2,132,199,0.3)' }}>
            <Hash size={18} color="#0284C7" style={{ flexShrink: 0, marginTop: '1px' }} />
            <p style={{ fontFamily: 'var(--font)', fontSize: '13px', color: 'var(--text)', margin: 0, lineHeight: 1.6 }}>
              {t('common.resetPinConfirm', { name: resetPinTarget?.merchantId?.businessName || resetPinTarget?.merchantId?.name })}
            </p>
          </div>
          <p style={{ fontFamily: 'var(--font)', fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
            {t('common.resetAutoHint')}
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '4px' }}>
            <Button type="button" variant="secondary" onClick={closeResetPin}>{t('common.cancel')}</Button>
            <Button type="button" variant="primary" loading={formLoading} onClick={handleResetPin} icon={<Hash size={14} />}>{t('common.resetPin')}</Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default AccountsPage;
