import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, Title, Tooltip, Legend,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

const fmt = (n = 0) => new Intl.NumberFormat('fr-FR').format(n);

const ReportsPage = () => {
  const { user } = useAuth();
  const [chartData, setChartData] = useState([]);
  const [globalStats, setGlobalStats] = useState(null);
  const [rangeReports, setRangeReports] = useState([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const loads = [api.get(`/reports/chart?days=${days}`)];
    if (user?.role === 'super_admin') {
      loads.push(api.get('/reports/global'));
    }
    Promise.allSettled(loads).then(([r1, r2]) => {
      if (r1.status === 'fulfilled') setChartData(r1.value.data.chartData);
      if (r2?.status === 'fulfilled') setGlobalStats(r2.value.data.global);
    }).finally(() => setLoading(false));
  }, [days, user]);

  const labels = chartData.map((d) => d.date?.slice(5));

  const barData = {
    labels,
    datasets: [
      { label: 'Dépôts', data: chartData.map((d) => d.totalDeposits || 0), backgroundColor: 'rgba(22,163,74,0.75)', borderRadius: 6 },
      { label: 'Retraits', data: chartData.map((d) => d.totalWithdrawals || 0), backgroundColor: 'rgba(220,38,38,0.65)', borderRadius: 6 },
    ],
  };

  const lineData = {
    labels,
    datasets: [
      { label: 'Bénéfice', data: chartData.map((d) => d.benefit || 0), borderColor: '#0A66C2', backgroundColor: 'rgba(10,102,194,0.08)', tension: 0.4, fill: true, pointRadius: 3 },
      { label: 'Transactions', data: chartData.map((d) => d.transactionsCount || 0), borderColor: '#7C3AED', backgroundColor: 'rgba(124,58,237,0.08)', tension: 0.4, fill: false, yAxisID: 'y2', pointRadius: 3 },
    ],
  };

  const opts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'top', labels: { font: { family: 'Manrope', size: 12 }, color: 'var(--text-secondary)' } } },
    scales: {
      x: { ticks: { font: { family: 'Manrope', size: 11 }, color: 'var(--text-secondary)' }, grid: { display: false } },
      y: { ticks: { font: { family: 'Manrope', size: 11 }, color: 'var(--text-secondary)' }, grid: { color: 'var(--border)' } },
    },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Période */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {[7, 14, 30, 90].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            style={{
              padding: '7px 18px', borderRadius: '9999px', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font)', fontWeight: 500, fontSize: '13px',
              background: days === d ? 'var(--color-primary)' : 'var(--surface)',
              color: days === d ? '#fff' : 'var(--text-secondary)',
              transition: 'background 0.15s',
            }}
          >
            {d}j
          </button>
        ))}
      </div>

      {/* Stats globales super_admin */}
      {user?.role === 'super_admin' && globalStats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          {[
            { label: 'Total dépôts', value: `${fmt(globalStats.totalDeposits)} F`, color: '#16A34A' },
            { label: 'Total retraits', value: `${fmt(globalStats.totalWithdrawals)} F`, color: '#DC2626' },
            { label: 'Revenu total', value: `${fmt(globalStats.totalRevenue)} F`, color: '#0A66C2' },
            { label: 'Bénéfice total', value: `${fmt(globalStats.benefit)} F`, color: '#7C3AED' },
            { label: 'Marchands actifs', value: globalStats.merchantsCount, color: '#0284C7' },
            { label: 'Nb. transactions', value: globalStats.transactionsCount, color: '#D97706' },
          ].map((s) => (
            <Card key={s.label} padding="16px">
              <div style={{ fontFamily: 'var(--font)', fontWeight: 800, fontSize: '22px', color: s.color }}>{s.value}</div>
              <div style={{ fontFamily: 'var(--font)', fontWeight: 500, fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{s.label}</div>
            </Card>
          ))}
        </div>
      )}

      {/* Graphique barres */}
      <Card title={`Dépôts & Retraits — ${days} derniers jours`}>
        <div style={{ height: '300px' }}>
          {loading ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontFamily: 'var(--font)' }}>
              Chargement...
            </div>
          ) : chartData.length > 0 ? (
            <Bar data={barData} options={opts} />
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontFamily: 'var(--font)' }}>
              Pas encore de données
            </div>
          )}
        </div>
      </Card>

      {/* Graphique ligne */}
      <Card title="Bénéfice & Volume de transactions">
        <div style={{ height: '280px' }}>
          {chartData.length > 0 ? (
            <Line data={lineData} options={{
              ...opts,
              scales: {
                ...opts.scales,
                y2: { position: 'right', ticks: { font: { family: 'Manrope', size: 11 }, color: '#7C3AED' }, grid: { display: false } },
              },
            }} />
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontFamily: 'var(--font)' }}>
              Pas encore de données
            </div>
          )}
        </div>
      </Card>

      {/* Tableau récapitulatif */}
      <Card title="Détail journalier" padding="0">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Date', 'Dépôts', 'Retraits', 'Transactions', 'Bénéfice'].map((h) => (
                  <th key={h} style={{ fontFamily: 'var(--font)', fontWeight: 600, fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'left', padding: '12px 16px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...chartData].reverse().map((d, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--font)', fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>{d.date}</td>
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--font)', fontSize: '13px', color: 'var(--color-success)', fontWeight: 600 }}>{fmt(d.totalDeposits)} F</td>
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--font)', fontSize: '13px', color: 'var(--color-error)', fontWeight: 600 }}>{fmt(d.totalWithdrawals)} F</td>
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--font)', fontSize: '13px', color: 'var(--text)' }}>{d.transactionsCount}</td>
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--font)', fontSize: '13px', fontWeight: 700, color: (d.benefit || 0) >= 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
                    {fmt(d.benefit)} F
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default ReportsPage;
