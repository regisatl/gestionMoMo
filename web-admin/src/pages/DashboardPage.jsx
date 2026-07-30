import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Title, Tooltip, Legend, ArcElement,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import api from '../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement);

const StatBox = ({ label, value, icon, color, delta, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px',
      padding: '20px', cursor: onClick ? 'pointer' : 'default',
      boxShadow: '0 1px 4px var(--shadow)', transition: 'transform 0.15s, box-shadow 0.15s',
    }}
    onMouseEnter={(e) => { if (onClick) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px var(--shadow)'; } }}
    onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 4px var(--shadow)'; }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
      <div style={{
        width: '40px', height: '40px', borderRadius: '12px',
        background: `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
      }}>{icon}</div>
      {delta !== undefined && (
        <span style={{ fontFamily: 'var(--font)', fontWeight: 600, fontSize: '12px', color: delta >= 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
          {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)}%
        </span>
      )}
    </div>
    <div style={{ fontFamily: 'var(--font)', fontWeight: 800, fontSize: '26px', color: 'var(--text)', letterSpacing: '-0.5px' }}>
      {value}
    </div>
    <div style={{ fontFamily: 'var(--font)', fontWeight: 500, fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
      {label}
    </div>
  </div>
);

const fmt = (n = 0) => new Intl.NumberFormat('fr-FR').format(n);

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [recentTxns, setRecentTxns] = useState([]);
  const [globalStats, setGlobalStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const loads = [
      api.get(`/reports/daily?date=${today}`),
      api.get('/reports/chart?days=30'),
      api.get('/transactions?limit=6'),
    ];
    if (user?.role === 'super_admin') {
      loads.push(api.get('/reports/global'));
    }

    Promise.allSettled(loads).then(([r1, r2, r3, r4]) => {
      if (r1.status === 'fulfilled') setReport(r1.value.data.report);
      if (r2.status === 'fulfilled') setChartData(r2.value.data.chartData);
      if (r3.status === 'fulfilled') setRecentTxns(r3.value.data.transactions);
      if (r4?.status === 'fulfilled') setGlobalStats(r4.value.data.global);
    }).finally(() => setLoading(false));
  }, [user]);

  const chartLabels = chartData.map((d) => d.date?.slice(5));
  const depositData = chartData.map((d) => d.totalDeposits || 0);
  const withdrawalData = chartData.map((d) => d.totalWithdrawals || 0);

  const barChartData = {
    labels: chartLabels,
    datasets: [
      { label: 'Dépôts', data: depositData, backgroundColor: 'rgba(22,163,74,0.75)', borderRadius: 6 },
      { label: 'Retraits', data: withdrawalData, backgroundColor: 'rgba(220,38,38,0.65)', borderRadius: 6 },
    ],
  };

  const lineChartData = {
    labels: chartLabels,
    datasets: [{
      label: 'Bénéfice', data: chartData.map((d) => d.benefit || 0),
      borderColor: '#0A66C2', backgroundColor: 'rgba(10,102,194,0.1)',
      tension: 0.4, fill: true, pointRadius: 3,
    }],
  };

  const doughnutData = {
    labels: ['Complétées', 'En attente', 'Échouées'],
    datasets: [{
      data: [report?.completedCount || 0, report?.pendingCount || 0, report?.failedCount || 0],
      backgroundColor: ['#16A34A', '#D97706', '#DC2626'],
      borderWidth: 0,
    }],
  };

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'top', labels: { font: { family: 'Manrope', size: 12 }, color: 'var(--text-secondary)' } } },
    scales: {
      x: { ticks: { font: { family: 'Manrope', size: 11 }, color: 'var(--text-secondary)' }, grid: { display: false } },
      y: { ticks: { font: { family: 'Manrope', size: 11 }, color: 'var(--text-secondary)' }, grid: { color: 'var(--border)' } },
    },
  };

  const TYPE_COLORS = { deposit: '#16A34A', withdrawal: '#DC2626', transfer: '#0A66C2', payment: '#7C3AED', refund: '#D97706' };
  const TYPE_LABELS = { deposit: 'Dépôt', withdrawal: 'Retrait', transfer: 'Transfert', payment: 'Paiement', refund: 'Remboursement' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Stats principales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatBox label="Dépôts du jour" value={`${fmt(report?.totalDeposits)} F`} icon="⬇" color="#16A34A" onClick={() => navigate('/transactions?type=deposit')} />
        <StatBox label="Retraits du jour" value={`${fmt(report?.totalWithdrawals)} F`} icon="⬆" color="#DC2626" onClick={() => navigate('/transactions?type=withdrawal')} />
        <StatBox label="Transactions" value={report?.transactionsCount || 0} icon="↔" color="#0A66C2" onClick={() => navigate('/transactions')} />
        <StatBox label="Bénéfice du jour" value={`${fmt(report?.benefit)} F`} icon="💰" color="#7C3AED" />
        {user?.role === 'super_admin' && globalStats && (
          <StatBox label="Revenus globaux" value={`${fmt(globalStats.totalRevenue)} F`} icon="🌍" color="#0284C7" onClick={() => navigate('/reports')} />
        )}
      </div>

      {/* Graphiques */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Card title="Dépôts & Retraits (30 jours)" style={{ gridColumn: '1 / -1' }}>
          <div style={{ height: '260px' }}>
            {chartData.length > 0 ? <Bar data={barChartData} options={chartOptions} /> : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontFamily: 'var(--font)' }}>
                Pas encore de données
              </div>
            )}
          </div>
        </Card>

        <Card title="Évolution bénéfice">
          <div style={{ height: '220px' }}>
            {chartData.length > 0 ? <Line data={lineChartData} options={chartOptions} /> : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontFamily: 'var(--font)' }}>
                Pas encore de données
              </div>
            )}
          </div>
        </Card>

        <Card title="Statut transactions du jour">
          <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {(report?.completedCount || report?.pendingCount || report?.failedCount) ? (
              <Doughnut data={doughnutData} options={{ ...chartOptions, scales: undefined, cutout: '60%' }} />
            ) : (
              <div style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font)' }}>Pas encore de données</div>
            )}
          </div>
        </Card>
      </div>

      {/* Transactions récentes */}
      <Card
        title="Transactions récentes"
        action={
          <button onClick={() => navigate('/transactions')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: '13px', color: 'var(--color-primary)', fontWeight: 600 }}>
            Voir tout →
          </button>
        }
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Référence', 'Client', 'Type', 'Montant', 'Statut', 'Date'].map((h) => (
                <th key={h} style={{ fontFamily: 'var(--font)', fontWeight: 600, fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid var(--border)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentTxns.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)', fontFamily: 'var(--font)' }}>Aucune transaction</td></tr>
            ) : recentTxns.map((txn) => (
              <tr
                key={txn._id}
                onClick={() => navigate(`/transactions/${txn._id}`)}
                style={{ cursor: 'pointer' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '12px', fontFamily: 'var(--font)', fontSize: '13px', color: 'var(--color-primary)', fontWeight: 500 }}>{txn.reference}</td>
                <td style={{ padding: '12px', fontFamily: 'var(--font)', fontSize: '13px', color: 'var(--text)' }}>{txn.clientName || txn.clientPhone || '—'}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{ fontFamily: 'var(--font)', fontSize: '12px', fontWeight: 600, color: TYPE_COLORS[txn.type] }}>
                    {TYPE_LABELS[txn.type]}
                  </span>
                </td>
                <td style={{ padding: '12px', fontFamily: 'var(--font)', fontSize: '13px', fontWeight: 700, color: txn.type === 'withdrawal' ? 'var(--color-error)' : 'var(--color-success)' }}>
                  {txn.type === 'withdrawal' ? '-' : '+'}{fmt(txn.amount)} F
                </td>
                <td style={{ padding: '12px' }}><Badge status={txn.status} /></td>
                <td style={{ padding: '12px', fontFamily: 'var(--font)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {new Date(txn.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default DashboardPage;
