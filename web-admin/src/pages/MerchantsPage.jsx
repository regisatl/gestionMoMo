import React, { useState, useEffect, useCallback } from 'react';
import { Search, Store } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import api from '../services/api';

const fmt = (n = 0) => new Intl.NumberFormat('fr-FR').format(n);

const MerchantsPage = () => {
  const { t } = useTranslation();
  const [merchants, setMerchants] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const loadMerchants = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      if (search.trim()) params.search = search.trim();
      const { data } = await api.get('/users/merchants', { params });
      setMerchants(data.merchants);
      setPagination(data.pagination);
    } catch (_) {
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => { loadMerchants(); }, [loadMerchants]);

  const handleStatusChange = async (merchantId, newStatus) => {
    setActionLoading(merchantId);
    try {
      await api.patch(`/users/${merchantId}/status`, { status: newStatus });
      loadMerchants();
    } catch (_) {
    } finally {
      setActionLoading(null);
    }
  };

  const merchantLabel = pagination.total <= 1
    ? t('merchants.merchantCount', { count: pagination.total })
    : t('merchants.merchantCountPlural', { count: pagination.total });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
          <Input
            placeholder={t('merchants.searchPlaceholder')}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            icon={<Search size={16} color="var(--text-secondary)" />}
            style={{ flex: '1 1 240px', minWidth: '180px' }}
          />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            style={{ height: '42px', padding: '0 12px', borderRadius: '10px', border: '1.5px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--text)', fontFamily: 'var(--font)', fontSize: '14px' }}
          >
            <option value="">{t('merchants.filters.allStatuses')}</option>
            <option value="active">{t('merchants.filters.active')}</option>
            <option value="inactive">{t('merchants.filters.inactive')}</option>
            <option value="suspended">{t('merchants.filters.suspended')}</option>
          </select>
        </div>
        <Button variant="primary" onClick={() => setShowModal(true)} icon={<Store size={16} strokeWidth={2} />}>
          {t('merchants.newMerchant')}
        </Button>
      </div>

      {/* Tableau */}
      <Card padding="0">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {[
                  t('merchants.tableHeaders.merchant'),
                  t('merchants.tableHeaders.phone'),
                  t('merchants.tableHeaders.momoAccount'),
                  t('merchants.tableHeaders.balance'),
                  t('merchants.tableHeaders.status'),
                  t('merchants.tableHeaders.createdAt'),
                  t('merchants.tableHeaders.actions'),
                ].map((h) => (
                  <th key={h} style={{ fontFamily: 'var(--font)', fontWeight: 600, fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'left', padding: '12px 16px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontFamily: 'var(--font)' }}>{t('merchants.loading')}</td></tr>
              ) : merchants.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontFamily: 'var(--font)' }}>{t('merchants.noMerchants')}</td></tr>
              ) : merchants.map((m) => (
                <tr key={m._id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--color-primary-alpha)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font)', fontWeight: 700, fontSize: '14px', color: 'var(--color-primary)', flexShrink: 0 }}>
                        {m.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontFamily: 'var(--font)', fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>{m.businessName || m.name}</div>
                        <div style={{ fontFamily: 'var(--font)', fontSize: '12px', color: 'var(--text-secondary)' }}>{m.email || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px', fontFamily: 'var(--font)', fontSize: '13px', color: 'var(--text)' }}>{m.phone}</td>
                  <td style={{ padding: '13px 16px', fontFamily: 'var(--font)', fontSize: '13px', color: 'var(--text-secondary)' }}>{m.account?.momoAccountNumber || '—'}</td>
                  <td style={{ padding: '13px 16px', fontFamily: 'var(--font)', fontSize: '14px', fontWeight: 700, color: 'var(--color-success)' }}>
                    {m.account ? `${fmt(m.account.balance)} F` : '—'}
                  </td>
                  <td style={{ padding: '13px 16px' }}><Badge status={m.status} /></td>
                  <td style={{ padding: '13px 16px', fontFamily: 'var(--font)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {new Date(m.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {m.status === 'active' ? (
                        <Button size="sm" variant="secondary" loading={actionLoading === m._id} onClick={() => handleStatusChange(m._id, 'suspended')}>
                          {t('merchants.suspend')}
                        </Button>
                      ) : (
                        <Button size="sm" variant="success" loading={actionLoading === m._id} onClick={() => handleStatusChange(m._id, 'active')}>
                          {t('merchants.activate')}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderTop: '1px solid var(--border)' }}>
          <span style={{ fontFamily: 'var(--font)', fontSize: '13px', color: 'var(--text-secondary)' }}>
            {merchantLabel}
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>{t('common.previous')}</Button>
            <span style={{ fontFamily: 'var(--font)', fontSize: '13px', color: 'var(--text)', padding: '6px 12px', background: 'var(--surface)', borderRadius: '8px' }}>
              {page} {t('common.of')} {pagination.pages || 1}
            </span>
            <Button size="sm" variant="secondary" disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)}>{t('common.next')}</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MerchantsPage;
