import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import api from '../services/api';

const TYPE_LABELS = { deposit: 'Dépôt', withdrawal: 'Retrait', transfer: 'Transfert', payment: 'Paiement', refund: 'Remboursement' };
const TYPE_COLORS = { deposit: '#16A34A', withdrawal: '#DC2626', transfer: '#0A66C2', payment: '#7C3AED', refund: '#D97706' };
const fmt = (n = 0) => new Intl.NumberFormat('fr-FR').format(n);

const FILTERS = [
  { key: '', label: 'Toutes' },
  { key: 'deposit', label: 'Dépôts' },
  { key: 'withdrawal', label: 'Retraits' },
  { key: 'transfer', label: 'Transferts' },
];

const TransactionsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || '');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Barre de filtres */}
      <Card padding="16px">
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Input
            placeholder="Référence, téléphone, nom..."
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
            <option value="">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="completed">Complétées</option>
            <option value="failed">Échouées</option>
            <option value="cancelled">Annulées</option>
          </select>
          <div style={{ display: 'flex', gap: '6px' }}>
            {FILTERS.map((f) => (
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
                {['Référence', 'Marchand', 'Client', 'Type', 'Montant', 'Frais', 'Statut', 'Date', ''].map((h) => (
                  <th key={h} style={{ fontFamily: 'var(--font)', fontWeight: 600, fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'left', padding: '12px 16px', textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontFamily: 'var(--font)' }}>Chargement...</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontFamily: 'var(--font)' }}>Aucune transaction</td></tr>
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
                      {TYPE_LABELS[txn.type]}
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
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/transactions/${txn._id}`)}>Voir</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderTop: '1px solid var(--border)' }}>
          <span style={{ fontFamily: 'var(--font)', fontSize: '13px', color: 'var(--text-secondary)' }}>
            {pagination.total} transaction{pagination.total !== 1 ? 's' : ''}
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Préc.</Button>
            <span style={{ fontFamily: 'var(--font)', fontSize: '13px', color: 'var(--text)', padding: '6px 12px', background: 'var(--surface)', borderRadius: '8px' }}>
              {page} / {pagination.pages || 1}
            </span>
            <Button size="sm" variant="secondary" disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)}>Suiv. →</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TransactionsPage;
