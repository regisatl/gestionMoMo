import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search, Plus, ArrowDownLeft, ArrowUpRight,
  Smartphone, Wifi, Infinity, ArrowLeftRight,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Loader from '../components/ui/Loader';
import NewTransactionModal from '../components/ui/NewTransactionModal';
import api from '../services/api';

// ─── Couleurs et icônes par type ─────────────────────────────────────────────
const TYPE_META = {
  deposit:     { color: '#16A34A', Icon: ArrowDownLeft },
  withdrawal:  { color: '#DC2626', Icon: ArrowUpRight  },
  transfer:    { color: '#0891B2', Icon: ArrowLeftRight },
  credit_sale: { color: '#D97706', Icon: Smartphone    },
  data_sale:   { color: '#0A66C2', Icon: Wifi          },
  unlimited:   { color: '#7C3AED', Icon: Infinity      },
  payment:     { color: '#7C3AED', Icon: ArrowDownLeft },
  refund:      { color: '#D97706', Icon: ArrowUpRight  },
};

const fmt = (n = 0) => new Intl.NumberFormat('fr-FR').format(n);

const TransactionsPage = () => {
  const { t }   = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination]     = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading]           = useState(false);
  const [search, setSearch]             = useState('');
  const [typeFilter, setTypeFilter]     = useState(searchParams.get('type') || '');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage]                 = useState(1);
  const [showModal, setShowModal]       = useState(false);

  // ─── Filtres type ──────────────────────────────────────────────────────────
  const TYPE_FILTERS = [
    { key: '',            label: t('transactions.filters.all') },
    { key: 'deposit',     label: t('transactions.filters.deposits') },
    { key: 'withdrawal',  label: t('transactions.filters.withdrawals') },
    { key: 'credit_sale', label: t('transactions.filters.credits') },
    { key: 'data_sale',   label: t('transactions.filters.data') },
    { key: 'unlimited',   label: t('transactions.filters.unlimited') },
    { key: 'transfer',    label: t('transactions.filters.transfers') },
  ];

  // ─── Chargement ────────────────────────────────────────────────────────────
  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (typeFilter)    params.type   = typeFilter;
      if (statusFilter)  params.status = statusFilter;
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
    ? t('transactions.transactionCount',       { count: pagination.total })
    : t('transactions.transactionCountPlural', { count: pagination.total });

  // ─── Callback après création ───────────────────────────────────────────────
  const handleCreated = () => {
    setPage(1);
    loadTransactions();
  };

  // ─── Loader initial ────────────────────────────────────────────────────────
  if (loading && transactions.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader message="common.loader.transactions" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── Barre d'actions ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ fontFamily: 'var(--font)', fontWeight: 800, fontSize: '22px', color: 'var(--text)', margin: 0 }}>
          {t('nav.transactions')}
        </h1>
        <Button onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={16} />
          {t('transactions.newTransaction')}
        </Button>
      </div>

      {/* ── Filtres ── */}
      <Card padding="16px">
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Recherche */}
          <Input
            placeholder={t('transactions.searchPlaceholder')}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            icon={<Search size={16} color="var(--text-secondary)" />}
            style={{ flex: '1 1 220px', minWidth: '180px' }}
          />

          {/* Statut */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            style={{
              height: '42px', padding: '0 12px', borderRadius: '10px',
              border: '1.5px solid var(--input-border)', background: 'var(--input-bg)',
              color: 'var(--text)', fontFamily: 'var(--font)', fontSize: '14px', cursor: 'pointer',
            }}
          >
            <option value="">{t('transactions.filters.allStatuses')}</option>
            <option value="pending">{t('transactions.filters.pending')}</option>
            <option value="processing">{t('transactions.status.processing', { defaultValue: 'En cours' })}</option>
            <option value="completed">{t('transactions.filters.completed')}</option>
            <option value="failed">{t('transactions.filters.failed')}</option>
            <option value="cancelled">{t('transactions.filters.cancelled')}</option>
          </select>

          {/* Types */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
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

      {/* ── Tableau ── */}
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
                  t('transactions.tableHeaders.package'),
                  t('transactions.tableHeaders.status'),
                  t('transactions.tableHeaders.date'),
                  '',
                ].map((h, i) => (
                  <th
                    key={i}
                    style={{
                      fontFamily: 'var(--font)', fontWeight: 600, fontSize: '11px',
                      color: 'var(--text-secondary)', textAlign: 'left',
                      padding: '12px 16px', textTransform: 'uppercase',
                      letterSpacing: '0.4px', whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontFamily: 'var(--font)' }}>
                    {t('transactions.loadingText')}
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '48px', fontFamily: 'var(--font)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'var(--text-secondary)' }}>
                      <ArrowLeftRight size={40} opacity={0.3} />
                      <span style={{ fontSize: '15px' }}>{t('transactions.noTransactions')}</span>
                      <Button size="sm" onClick={() => setShowModal(true)}>
                        <Plus size={14} /> {t('transactions.newTransaction')}
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : transactions.map((txn) => {
                const meta = TYPE_META[txn.type] || TYPE_META.transfer;
                const isDebit = ['withdrawal', 'credit_sale', 'data_sale', 'unlimited', 'transfer'].includes(txn.type);
                return (
                  <tr
                    key={txn._id}
                    style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.1s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Référence */}
                    <td style={{ padding: '13px 16px', fontFamily: 'var(--font)', fontSize: '13px', color: 'var(--color-primary)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                      {txn.reference}
                    </td>
                    {/* Marchand */}
                    <td style={{ padding: '13px 16px', fontFamily: 'var(--font)', fontSize: '13px', color: 'var(--text)' }}>
                      {txn.merchantId?.businessName || txn.merchantId?.name || '—'}
                    </td>
                    {/* Client */}
                    <td style={{ padding: '13px 16px', fontFamily: 'var(--font)', fontSize: '13px', color: 'var(--text)' }}>
                      <div>{txn.clientName || '—'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{txn.clientPhone}</div>
                    </td>
                    {/* Type */}
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: `${meta.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <meta.Icon size={13} color={meta.color} />
                        </div>
                        <span style={{ fontFamily: 'var(--font)', fontWeight: 600, fontSize: '12px', color: meta.color, whiteSpace: 'nowrap' }}>
                          {t(`transactions.types.${txn.type}`, { defaultValue: txn.type })}
                        </span>
                      </div>
                    </td>
                    {/* Montant */}
                    <td style={{ padding: '13px 16px', fontFamily: 'var(--font)', fontSize: '13px', fontWeight: 700, color: isDebit ? 'var(--color-error)' : 'var(--color-success)', whiteSpace: 'nowrap' }}>
                      {isDebit ? '−' : '+'}{fmt(txn.amount)} F
                    </td>
                    {/* Frais */}
                    <td style={{ padding: '13px 16px', fontFamily: 'var(--font)', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {txn.fee > 0 ? `${fmt(txn.fee)} F` : '—'}
                    </td>
                    {/* Package */}
                    <td style={{ padding: '13px 16px', fontFamily: 'var(--font)', fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '120px' }}>
                      {txn.packageLabel ? (
                        <div>
                          <div style={{ fontWeight: 500, color: 'var(--text)' }}>{txn.packageLabel}</div>
                          {txn.packageValidity && <div style={{ fontSize: '11px' }}>{txn.packageValidity}</div>}
                        </div>
                      ) : '—'}
                    </td>
                    {/* Statut */}
                    <td style={{ padding: '13px 16px' }}>
                      <Badge status={txn.status} />
                    </td>
                    {/* Date */}
                    <td style={{ padding: '13px 16px', fontFamily: 'var(--font)', fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {new Date(txn.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                    {/* Action */}
                    <td style={{ padding: '13px 16px' }}>
                      <Button size="sm" variant="ghost" onClick={() => navigate(`/transactions/${txn._id}`)}>
                        {t('transactions.view')}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderTop: '1px solid var(--border)', flexWrap: 'wrap', gap: '10px' }}>
          <span style={{ fontFamily: 'var(--font)', fontSize: '13px', color: 'var(--text-secondary)' }}>
            {totalLabel}
          </span>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              {t('common.previous')}
            </Button>
            <span style={{ fontFamily: 'var(--font)', fontSize: '13px', color: 'var(--text)', padding: '6px 12px', background: 'var(--surface)', borderRadius: '8px' }}>
              {page} {t('common.of')} {pagination.pages || 1}
            </span>
            <Button size="sm" variant="secondary" disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)}>
              {t('common.next')}
            </Button>
          </div>
        </div>
      </Card>

      {/* ── Modal nouvelle transaction ── */}
      {showModal && (
        <NewTransactionModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
};

export default TransactionsPage;
