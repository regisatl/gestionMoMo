import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Store, Phone, User, Mail, Building2,
  Pencil, KeyRound, Hash, PowerOff, Power, Trash2, RotateCcw,
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

/* ── Shared icon-button — Tooltip custom, pas de title= natif ── */
const IconBtn = ({ icon: Icon, color, tooltip, onClick, disabled }) => (
  <Tooltip content={tooltip} placement="top" delay={200}>
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '30px', height: '30px', borderRadius: '8px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1.5px solid ${color}30`,
        background: `${color}12`,
        color, cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'background 0.15s, transform 0.1s',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => { if (!disabled) { e.currentTarget.style.background = `${color}25`; e.currentTarget.style.transform = 'scale(1.1)'; } }}
      onMouseLeave={(e) => { e.currentTarget.style.background = `${color}12`; e.currentTarget.style.transform = 'scale(1)'; }}
    >
      <Icon size={14} strokeWidth={2.2} />
    </button>
  </Tooltip>
);

/* ── Th helper ── */
const Th = ({ children }) => (
  <th style={{ fontFamily: 'var(--font)', fontWeight: 600, fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'left', padding: '12px 14px', textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>
    {children}
  </th>
);

const EMPTY_FORM = { name: '', phone: '', email: '', businessName: '', password: '' };

const MerchantsPage = () => {
  const { t } = useTranslation();
  const { addToast } = useNotifications();

  /* ── list state ── */
  const [merchants, setMerchants]     = useState([]);
  const [pagination, setPagination]   = useState({ total: 0, pages: 1 });
  const [loading, setLoading]         = useState(false);
  const [page, setPage]               = useState(1);
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);

  /* ── modals ── */
  const [createOpen, setCreateOpen]     = useState(false);
  const [editTarget, setEditTarget]     = useState(null);
  const [resetPwdTarget, setResetPwdTarget] = useState(null);
  const [resetPinTarget, setResetPinTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  /* ── form ── */
  const [form, setForm]               = useState(EMPTY_FORM);
  const [formErrors, setFormErrors]   = useState({});
  const [formLoading, setFormLoading] = useState(false);

  /* ── action loading ── */
  const [actionId, setActionId]       = useState(null);

  /* ── résultat reset — plus utilisé ── */
  const [resetResult, setResetResult] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  /* ────────────────── Load ────────────────── */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (statusFilter)       params.status  = statusFilter;
      if (search.trim())      params.search  = search.trim();
      if (showDeleted)        params.deleted = 'true';
      const { data } = await api.get('/users/merchants', { params });
      setMerchants(data.merchants);
      setPagination(data.pagination);
    } catch (_) {
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search, showDeleted]);

  useEffect(() => { load(); }, [load]);

  /* ────────────────── Create ────────────────── */
  const PHONE_RE = /^\+22901\d{8}$/;
  const EMAIL_RE = /^\S+@\S+\.\S+$/;

  const validate = () => {
    const errs = {};
    if (!form.name.trim())  errs.name = t('merchants.form.nameRequired');
    if (!form.phone.trim()) errs.phone = t('merchants.form.phoneRequired');
    else if (!PHONE_RE.test(form.phone.trim())) errs.phone = t('merchants.form.phoneInvalid');
    if (form.email.trim() && !EMAIL_RE.test(form.email.trim())) errs.email = t('merchants.form.emailInvalid');
    if (!form.password.trim()) errs.password = t('merchants.form.passwordRequired');
    setFormErrors(errs);
    return !Object.keys(errs).length;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setFormLoading(true);
    try {
      await api.post('/users', { ...form, role: 'merchant' });
      addToast({ type: 'success', title: t('toast.merchantCreated'), message: form.businessName || form.name });
      setCreateOpen(false);
      setForm(EMPTY_FORM);
      setFormErrors({});
      load();
    } catch (err) {
      addToast({ type: 'error', title: t('toast.merchantCreateError'), message: err.response?.data?.error });
    } finally {
      setFormLoading(false);
    }
  };

  /* ────────────────── Edit ────────────────── */
  const openEdit = (m) => {
    setEditTarget(m);
    setForm({ name: m.name, phone: m.phone, email: m.email || '', businessName: m.businessName || '', password: '' });
    setFormErrors({});
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = t('merchants.form.nameRequired');
    if (form.phone.trim() && !PHONE_RE.test(form.phone.trim())) errs.phone = t('merchants.form.phoneInvalid');
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setFormLoading(true);
    try {
      await api.patch(`/users/${editTarget._id}`, {
        name: form.name,
        email: form.email || undefined,
        phone: form.phone || undefined,
        businessName: form.businessName || undefined,
      });
      addToast({ type: 'success', title: t('toast.merchantUpdated') });
      setEditTarget(null);
      load();
    } catch (err) {
      addToast({ type: 'error', title: t('common.error'), message: err.response?.data?.error });
    } finally {
      setFormLoading(false);
    }
  };

  /* ────────────────── Reset password — aléatoire côté serveur ────────────────── */
  const handleResetPassword = async () => {
    setFormLoading(true);
    try {
      await api.patch(`/users/${resetPwdTarget._id}/reset-password`);
      setResetPwdTarget(null);
      addToast({ type: 'success', title: t('toast.passwordReset'), message: t('toast.resetSentToUser', { name: resetPwdTarget.name }) });
    } catch (err) {
      addToast({ type: 'error', title: t('toast.passwordError'), message: err.response?.data?.error });
    } finally {
      setFormLoading(false);
    }
  };

  /* ────────────────── Reset PIN — aléatoire côté serveur ────────────────── */
  const handleResetPin = async () => {
    setFormLoading(true);
    try {
      await api.patch(`/users/${resetPinTarget._id}/reset-pin`);
      setResetPinTarget(null);
      addToast({ type: 'success', title: t('toast.pinReset'), message: t('toast.resetSentToUser', { name: resetPinTarget.name }) });
    } catch (err) {
      addToast({ type: 'error', title: t('toast.pinError'), message: err.response?.data?.error });
    } finally {
      setFormLoading(false);
    }
  };

  /* ────────────────── Toggle status ────────────────── */
  const handleToggleStatus = async (m) => {
    const next = m.status === 'active' ? 'suspended' : 'active';
    setActionId(m._id + '_status');
    try {
      await api.patch(`/users/${m._id}/status`, { status: next });
      addToast({ type: 'success', title: next === 'suspended' ? t('toast.merchantSuspended') : t('toast.merchantActivated') });
      load();
    } catch (err) {
      addToast({ type: 'error', title: t('toast.merchantActionError'), message: err.response?.data?.error });
    } finally {
      setActionId(null);
    }
  };

  /* ────────────────── Soft delete ────────────────── */
  const handleDelete = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await api.delete(`/users/${deleteTarget._id}`, { data: { reason: deleteReason } });
      addToast({ type: 'success', title: t('toast.merchantDeleted') });
      setDeleteTarget(null);
      setDeleteReason('');
      load();
    } catch (err) {
      addToast({ type: 'error', title: t('common.error'), message: err.response?.data?.error });
    } finally {
      setFormLoading(false);
    }
  };

  /* ────────────────── Restore ────────────────── */
  const handleRestore = async (m) => {
    setActionId(m._id + '_restore');
    try {
      await api.patch(`/users/${m._id}/restore`);
      addToast({ type: 'success', title: t('toast.merchantRestored') });
      load();
    } catch (err) {
      addToast({ type: 'error', title: t('common.error'), message: err.response?.data?.error });
    } finally {
      setActionId(null);
    }
  };

  /* ────────────────── Helpers ────────────────── */
  const closeCreate   = () => { setCreateOpen(false); setForm(EMPTY_FORM); setFormErrors({}); };
  const closeEdit     = () => { setEditTarget(null); setForm(EMPTY_FORM); setFormErrors({}); };
  const closeResetPwd = () => { setResetPwdTarget(null); };
  const closeResetPin = () => { setResetPinTarget(null); };
  const closeDelete   = () => { setDeleteTarget(null); setDeleteReason(''); };

  const countLabel = pagination.total <= 1
    ? t('merchants.merchantCount', { count: pagination.total })
    : t('merchants.merchantCountPlural', { count: pagination.total });

  /* ────────────────── Render ────────────────── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', flex: 1 }}>
          <Input
            placeholder={t('merchants.searchPlaceholder')}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            icon={<Search size={15} color="var(--text-secondary)" />}
            style={{ flex: '1 1 220px', minWidth: '160px' }}
          />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            style={{ height: '42px', padding: '0 12px', borderRadius: '10px', border: '1.5px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--text)', fontFamily: 'var(--font)', fontSize: '13px' }}
          >
            <option value="">{t('merchants.filters.allStatuses')}</option>
            <option value="active">{t('merchants.filters.active')}</option>
            <option value="inactive">{t('merchants.filters.inactive')}</option>
            <option value="suspended">{t('merchants.filters.suspended')}</option>
          </select>
          <button
            onClick={() => { setShowDeleted((v) => !v); setPage(1); }}
            style={{
              height: '42px', padding: '0 14px', borderRadius: '10px', cursor: 'pointer',
              border: `1.5px solid ${showDeleted ? 'var(--color-error)' : 'var(--input-border)'}`,
              background: showDeleted ? 'var(--color-error-light)' : 'var(--input-bg)',
              color: showDeleted ? 'var(--color-error)' : 'var(--text-secondary)',
              fontFamily: 'var(--font)', fontSize: '13px', fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s',
            }}
          >
            <Trash2 size={14} strokeWidth={2} />
            {t('common.showDeleted')}
          </button>
        </div>
        <Button variant="primary" onClick={() => setCreateOpen(true)} icon={<Store size={15} strokeWidth={2} />}>
          {t('merchants.newMerchant')}
        </Button>
      </div>

      {/* Table */}
      <Card padding="0">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <Th>{t('merchants.tableHeaders.merchant')}</Th>
                <Th>{t('merchants.tableHeaders.phone')}</Th>
                <Th>{t('merchants.tableHeaders.momoAccount')}</Th>
                <Th>{t('merchants.tableHeaders.balance')}</Th>
                <Th>{t('merchants.tableHeaders.status')}</Th>
                <Th>{t('merchants.tableHeaders.createdAt')}</Th>
                <Th>{t('merchants.tableHeaders.actions')}</Th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontFamily: 'var(--font)' }}>{t('common.loading')}</td></tr>
              ) : merchants.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontFamily: 'var(--font)' }}>{t('merchants.noMerchants')}</td></tr>
              ) : merchants.map((m) => (
                <tr
                  key={m._id}
                  style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s', opacity: m.isDeleted ? 0.6 : 1 }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'var(--color-primary-alpha)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font)', fontWeight: 700, fontSize: '13px', color: 'var(--color-primary)', flexShrink: 0 }}>
                        {m.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontFamily: 'var(--font)', fontWeight: 600, fontSize: '13px', color: 'var(--text)' }}>{m.businessName || m.name}</div>
                        <div style={{ fontFamily: 'var(--font)', fontSize: '11px', color: 'var(--text-secondary)' }}>{m.email || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px', fontFamily: 'var(--font)', fontSize: '13px', color: 'var(--text)' }}>{m.phone}</td>
                  <td style={{ padding: '12px 14px', fontFamily: 'var(--font)', fontSize: '12px', color: 'var(--text-secondary)' }}>{m.account?.momoAccountNumber || '—'}</td>
                  <td style={{ padding: '12px 14px', fontFamily: 'var(--font)', fontSize: '13px', fontWeight: 700, color: 'var(--color-success)' }}>{m.account ? `${fmt(m.account.balance)} F` : '—'}</td>
                  <td style={{ padding: '12px 14px' }}>
                    {m.isDeleted
                      ? <span style={{ fontFamily: 'var(--font)', fontSize: '11px', fontWeight: 600, color: 'var(--color-error)', background: 'var(--color-error-light)', padding: '2px 8px', borderRadius: '6px' }}>{t('common.deleted')}</span>
                      : <Badge status={m.status} />
                    }
                  </td>
                  <td style={{ padding: '12px 14px', fontFamily: 'var(--font)', fontSize: '12px', color: 'var(--text-secondary)' }}>{new Date(m.createdAt).toLocaleDateString('fr-FR')}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                      {m.isDeleted ? (
                        <IconBtn icon={RotateCcw} color="#16A34A" tooltip={t('common.restore')} onClick={() => handleRestore(m)} disabled={actionId === m._id + '_restore'} />
                      ) : (
                        <>
                          <IconBtn icon={Pencil}    color="#0A66C2" tooltip={t('common.edit')}            onClick={() => openEdit(m)} />
                          <IconBtn icon={KeyRound}  color="#7C3AED" tooltip={t('common.resetPassword')}   onClick={() => setResetPwdTarget(m)} />
                          <IconBtn icon={Hash}      color="#0284C7" tooltip={t('common.resetPin')}        onClick={() => setResetPinTarget(m)} />
                          <IconBtn
                            icon={m.status === 'active' ? PowerOff : Power}
                            color={m.status === 'active' ? '#D97706' : '#16A34A'}
                            tooltip={m.status === 'active' ? t('merchants.suspend') : t('merchants.activate')}
                            onClick={() => handleToggleStatus(m)}
                            disabled={actionId === m._id + '_status'}
                          />
                          <IconBtn icon={Trash2}   color="#DC2626" tooltip={t('common.delete')}           onClick={() => setDeleteTarget(m)} />
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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
      <Modal open={createOpen} onClose={closeCreate} title={t('merchants.newMerchant')} width={540}>
        <form onSubmit={handleCreate} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <Input
            label={t('merchants.form.fullName')}
            value={form.name} onChange={setField('name')}
            placeholder="Jean Dupont"
            icon={<User size={15} color="var(--text-secondary)" />}
            error={formErrors.name} required
            autoComplete="new-password"
          />
          <Input
            label={t('merchants.form.phone')}
            value={form.phone} onChange={setField('phone')}
            placeholder="+2290112345678"
            icon={<Phone size={15} color="var(--text-secondary)" />}
            error={formErrors.phone} required
            autoComplete="new-password"
          />
          <Input
            label={t('merchants.form.email')}
            type="email"
            value={form.email} onChange={setField('email')}
            placeholder="jean@example.com"
            icon={<Mail size={15} color="var(--text-secondary)" />}
            error={formErrors.email}
            autoComplete="new-password"
          />
          <Input
            label={t('merchants.form.businessName')}
            value={form.businessName} onChange={setField('businessName')}
            placeholder={t('merchants.form.businessNamePlaceholder')}
            icon={<Building2 size={15} color="var(--text-secondary)" />}
            autoComplete="new-password"
          />
          <Input
            label={t('merchants.form.password')}
            type="password" value={form.password} onChange={setField('password')}
            placeholder="••••••••"
            error={formErrors.password} required
            autoComplete="new-password"
          />
          <p style={{ fontFamily: 'var(--font)', fontSize: '12px', color: 'var(--text-secondary)', margin: 0, paddingTop: '2px' }}>
            {t('merchants.form.hint')}
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '4px' }}>
            <Button type="button" variant="secondary" onClick={closeCreate}>{t('common.cancel')}</Button>
            <Button type="submit" variant="primary" loading={formLoading} icon={<Store size={14} strokeWidth={2} />}>{t('merchants.form.create')}</Button>
          </div>
        </form>
      </Modal>

      {/* ── EDIT modal ── */}
      <Modal open={!!editTarget} onClose={closeEdit} title={t('common.edit') + ' — ' + (editTarget?.businessName || editTarget?.name || '')} width={480}>
        <form onSubmit={handleEdit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <Input label={t('merchants.form.fullName')} value={form.name} onChange={setField('name')} error={formErrors.name} required />
          <Input label={t('merchants.form.email')} type="email" autoComplete="email" value={form.email} onChange={setField('email')} error={formErrors.email} />
          <Input
            label={t('merchants.form.phone')}
            value={form.phone}
            onChange={setField('phone')}
            icon={<Phone size={15} color="var(--text-secondary)" />}
            error={formErrors.phone}
            autoComplete="tel"
          />
          <Input label={t('merchants.form.businessName')} value={form.businessName} onChange={setField('businessName')} />
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '4px' }}>
            <Button type="button" variant="secondary" onClick={closeEdit}>{t('common.cancel')}</Button>
            <Button type="submit" variant="primary" loading={formLoading}>{t('common.save')}</Button>
          </div>
        </form>
      </Modal>

      {/* ── RESET PASSWORD modal — confirmation ── */}
      <Modal open={!!resetPwdTarget} onClose={closeResetPwd} title={t('common.resetPassword') + ' — ' + (resetPwdTarget?.name || '')} width={420}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 16px', borderRadius: '12px', background: 'var(--color-warning-light)', border: '1px solid rgba(217,119,6,0.3)' }}>
            <KeyRound size={18} color="#D97706" style={{ flexShrink: 0, marginTop: '1px' }} />
            <p style={{ fontFamily: 'var(--font)', fontSize: '13px', color: 'var(--text)', margin: 0, lineHeight: 1.6 }}>
              {t('common.resetPasswordConfirm', { name: resetPwdTarget?.name })}
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
      <Modal open={!!resetPinTarget} onClose={closeResetPin} title={t('common.resetPin') + ' — ' + (resetPinTarget?.name || '')} width={420}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 16px', borderRadius: '12px', background: 'var(--color-info-light)', border: '1px solid rgba(2,132,199,0.3)' }}>
            <Hash size={18} color="#0284C7" style={{ flexShrink: 0, marginTop: '1px' }} />
            <p style={{ fontFamily: 'var(--font)', fontSize: '13px', color: 'var(--text)', margin: 0, lineHeight: 1.6 }}>
              {t('common.resetPinConfirm', { name: resetPinTarget?.name })}
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

      {/* ── DELETE modal ── */}
      <Modal open={!!deleteTarget} onClose={closeDelete} title={t('common.confirmDelete')} width={420}>
        <form onSubmit={handleDelete} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <p style={{ fontFamily: 'var(--font)', fontSize: '14px', color: 'var(--text)', margin: 0 }}>
            {t('merchants.deleteConfirm', { name: deleteTarget?.businessName || deleteTarget?.name })}
          </p>
          <Input
            label={t('common.deleteReason')}
            value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)}
            placeholder={t('common.deleteReasonPlaceholder')}
          />
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '4px' }}>
            <Button type="button" variant="secondary" onClick={closeDelete}>{t('common.cancel')}</Button>
            <Button type="submit" variant="danger" loading={formLoading} icon={<Trash2 size={14} />}>{t('common.delete')}</Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default MerchantsPage;
