import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import api from '../services/api';

const TYPE_COLORS = { deposit: '#16A34A', withdrawal: '#DC2626', transfer: '#0A66C2', payment: '#7C3AED', refund: '#D97706' };
const fmt = (n = 0) => new Intl.NumberFormat('fr-FR').format(n);

const TransactionsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || '');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const TYPE_FILTERS = [
    { key: '',           label: t('transactions.filters.all') },
    { key: 'deposit',    label: t('transactions.filters.deposits') },
    { key: 'withdrawal', label: t('transactions.filters.withdrawals') },
    { key: 'transfer',   label: t('transactions.filters.transfers') },
  ];

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (typeFilter) params.type = typeFilter;
      if (statusFilter) params.status = statusFilter;
      if (search.trim()) params.search = search.trim();
      const { data } = await api.get('/transactions', { params });
      setTransactions(data.transactions);
      setPagination(data.pagination);
    } catch (_) {
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, statusFilter, search]);

  useEffect(() => { loadTransactions(); }, [loadTransactions]);

  const totalLabel = pagination.total <= 1
    ? t('transactions.transactionCount', { count: pagination.total })
    : t('transactions.transactionCountPlural', { count: pagination.total });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Barre de filtres */}
      <Card padding="16px">
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Input
            placeholder={t('transactions.searchPlaceholder')}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            icon={<Search size={16} color="var(--text-secondary)" />}
            style={{ flex: '1 1 240px', minWidth: '200px' }}
          />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            style={{ height: '42px', padding: '0 12px', borderRadius: '10px', border: '1.5px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--text)', fontFamily: 'var(--font)', fontSize: '14px', cursor: 'pointer' }}
          >
            <option value="">{t('transactions.filters.allStatuses')}</option>
            <option value="pending">{t('transactions.filters.pending')}</option>
            <option value="completed">{t('transactions.filters.completed')}</option>
            <option value="failed">{t('transactions.filters.failed')}</option>
            <option value="cancelled">{t('transactions.filters.cancelled')}</option>
          </select>
          <div style={{ display: 'flex', gap: '6px' }}>
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => { setTypeFilter(f.key); setPage(1); }}
                style={{
                  padding: '7px 14px', borderRadius: '9999px', cursor: 'pointer',
                  border: 'none', fontFamily: 'var(--font)', fontWeight: 500, fontSize: '13px',
                  background: typeFilter === f.key ? 'var(--color-primary)' : 'var(--surface)',
                  color: typeFilter === f.key ? '#fff' : 'var(--text-secondary)',
                  transition: 'background 0.15s',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Tableau */}
      <Card padding="0">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {[
                  t('transactions.tableHeaders.reference'),
                  t('transactions.tableHeaders.merchant'),
                  t('transactions.tableHeaders.client'),
                  t('transactions.tableHeaders.type'),
                  t('transactions.tableHeaders.amount'),
                  t('transactions.tableHeaders.fees'),
                  t('transactions.tableHeaders.status'),
                  t('transactions.tableHeaders.date'),
                  '',
                ].map((h, i) => (
                  <th key={i} style={{ fontFamily: 'var(--font)', fontWeight: 600, fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'left', padding: '12px 16px', textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontFamily: 'var(--font)' }}>{t('transactions.loadingText')}</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontFamily: 'var(--font)' }}>{t('transactions.noTransactions')}</td></tr>
              ) : transactions.map((txn) => (
                <tr
                  key={txn._id}
                  style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.1s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '13px 16px', fontFamily: 'var(--font)', fontSize: '13px', color: 'var(--color-primary)', fontWeight: 500 }}>{txn.reference}</td>
                  <td style={{ padding: '13px 16px', fontFamily: 'var(--font)', fontSize: '13px', color: 'var(--text)' }}>{txn.merchantId?.businessName || txn.merchantId?.name || '—'}</td>
                  <td style={{ padding: '13px 16px', fontFamily: 'var(--font)', fontSize: '13px', color: 'var(--text)' }}>{txn.clientName || txn.clientPhone || '—'}</td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{ fontFamily: 'var(--font)', fontWeight: 600, fontSize: '12px', color: TYPE_COLORS[txn.type] }}>
                      {t(`transactions.types.${txn.type}`, { defaultValue: txn.type })}
                    </span>
                  </td>
                  <td style={{ padding: '13px 16px', fontFamily: 'var(--font)', fontSize: '13px', fontWeight: 700, color: txn.type === 'withdrawal' ? 'var(--color-error)' : 'var(--color-success)' }}>
                    {txn.type === 'withdrawal' ? '-' : '+'}{fmt(txn.amount)} F
                  </td>
                  <td style={{ padding: '13px 16px', fontFamily: 'var(--font)', fontSize: '13px', color: 'var(--text-secondary)' }}>{txn.fee > 0 ? `${fmt(txn.fee)} F` : '—'}</td>
                  <td style={{ padding: '13px 16px' }}><Badge status={txn.status} /></td>
                  <td style={{ padding: '13px 16px', fontFamily: 'var(--font)', fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {new Date(txn.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/transactions/${txn._id}`)}>{t('transactions.view')}</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderTop: '1px solid var(--border)' }}>
          <span style={{ fontFamily: 'var(--font)', fontSize: '13px', color: 'var(--text-secondary)' }}>
            {totalLabel}
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

export default TransactionsPage;
