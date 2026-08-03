import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Loader from '../components/ui/Loader';
import api from '../services/api';

const ACTION_COLORS = {
  user_login: '#16A34A', user_logout: '#6B7280', user_login_failed: '#DC2626',
  user_created: '#0A66C2', user_updated: '#0A66C2',
  user_deleted: '#DC2626', user_restored: '#16A34A',
  user_suspended: '#D97706', user_activated: '#16A34A',
  transaction_created: '#0A66C2', transaction_deleted: '#DC2626', transaction_restored: '#16A34A',
  password_changed: '#D97706', password_reset: '#D97706', password_reset_admin: '#7C3AED',
  pin_changed: '#0284C7', pin_reset_admin: '#0284C7',
  momo_callback_received: '#7C3AED',
};

const AuditPage = () => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [loading, setLoading] = useState(false);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 30 };
      if (actionFilter) params.action = actionFilter;
      const { data } = await api.get('/audit', { params });
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch (_) {
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const entryLabel = pagination.total <= 1
    ? t('audit.entryCount', { count: pagination.total })
    : t('audit.entryCountPlural', { count: pagination.total });

  if (loading && logs.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader message="loader.audit" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Filtre */}
      <Card padding="14px">
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            style={{ height: '42px', padding: '0 14px', borderRadius: '10px', border: '1.5px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--text)', fontFamily: 'var(--font)', fontSize: '14px' }}
          >
            <option value="">{t('audit.allActions')}</option>
            <option value="user_login">{t('audit.actions.user_login')}</option>
            <option value="user_login_failed">{t('audit.actions.user_login_failed')}</option>
            <option value="user_created">{t('audit.actions.user_created')}</option>
            <option value="user_updated">{t('audit.actions.user_updated')}</option>
            <option value="user_deleted">{t('audit.actions.user_deleted')}</option>
            <option value="user_restored">{t('audit.actions.user_restored')}</option>
            <option value="user_suspended">{t('audit.actions.user_suspended')}</option>
            <option value="user_activated">{t('audit.actions.user_activated')}</option>
            <option value="password_changed">{t('audit.actions.password_changed')}</option>
            <option value="password_reset_admin">{t('audit.actions.password_reset_admin')}</option>
            <option value="pin_changed">{t('audit.actions.pin_changed')}</option>
            <option value="pin_reset_admin">{t('audit.actions.pin_reset_admin')}</option>
            <option value="transaction_created">{t('audit.actions.transaction_created')}</option>
            <option value="transaction_deleted">{t('audit.actions.transaction_deleted')}</option>
            <option value="momo_callback_received">{t('audit.actions.momo_callback_received')}</option>
          </select>
          <span style={{ fontFamily: 'var(--font)', fontSize: '13px', color: 'var(--text-secondary)' }}>
            {entryLabel}
          </span>
        </div>
      </Card>

      {/* Tableau */}
      <Card padding="0">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {[
                  t('audit.tableHeaders.timestamp'),
                  t('audit.tableHeaders.action'),
                  t('audit.tableHeaders.performedBy'),
                  t('audit.tableHeaders.target'),
                  t('audit.tableHeaders.ip'),
                  t('audit.tableHeaders.details'),
                ].map((h) => (
                  <th key={h} style={{ fontFamily: 'var(--font)', fontWeight: 600, fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'left', padding: '12px 16px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontFamily: 'var(--font)' }}>{t('audit.loading')}</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontFamily: 'var(--font)' }}>{t('audit.noLogs')}</td></tr>
              ) : logs.map((log) => (
                <tr key={log._id} style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--font)', fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {new Date(log.timestamp).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontFamily: 'var(--font)', fontWeight: 600, fontSize: '12px', color: ACTION_COLORS[log.action] || 'var(--text-secondary)', background: `${ACTION_COLORS[log.action] || '#6B7280'}14`, padding: '3px 8px', borderRadius: '6px' }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--font)', fontSize: '13px', color: 'var(--text)' }}>
                    {log.performedBy?.name || '—'}
                    {log.performedBy?.role && (
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: '6px' }}>({log.performedBy.role})</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--font)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {log.targetModel ? `${log.targetModel}:${log.targetId?.toString().slice(-6)}` : '—'}
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--font)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {log.ipAddress || '—'}
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--font)', fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {log.details ? JSON.stringify(log.details) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderTop: '1px solid var(--border)' }}>
          <span style={{ fontFamily: 'var(--font)', fontSize: '13px', color: 'var(--text-secondary)' }}>
            {t('common.page', { current: page, total: pagination.pages || 1 })}
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>{t('common.previous')}</Button>
            <Button size="sm" variant="secondary" disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)}>{t('common.next')}</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AuditPage;
