import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, Title, Tooltip, Legend,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, TrendingUp, Users, Coins } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Card from '../components/ui/Card';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

const fmt = (n = 0) => new Intl.NumberFormat('fr-FR').format(n);

const ReportsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [chartData, setChartData] = useState([]);
  const [globalStats, setGlobalStats] = useState(null);
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
      { label: t('reports.chartLabels.deposits'),    data: chartData.map((d) => d.totalDeposits || 0),    backgroundColor: 'rgba(22,163,74,0.75)',  borderRadius: 6 },
      { label: t('reports.chartLabels.withdrawals'), data: chartData.map((d) => d.totalWithdrawals || 0), backgroundColor: 'rgba(220,38,38,0.65)', borderRadius: 6 },
    ],
  };

  const lineData = {
    labels,
    datasets: [
      { label: t('reports.chartLabels.benefit'),      data: chartData.map((d) => d.benefit || 0),            borderColor: '#0A66C2', backgroundColor: 'rgba(10,102,194,0.08)', tension: 0.4, fill: true,  pointRadius: 3 },
      { label: t('reports.chartLabels.transactions'), data: chartData.map((d) => d.transactionsCount || 0), borderColor: '#7C3AED', backgroundColor: 'rgba(124,58,237,0.08)',  tension: 0.4, fill: false, yAxisID: 'y2', pointRadius: 3 },
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

  const noDataEl = (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontFamily: 'var(--font)' }}>
      {loading ? t('common.loading') : t('reports.noData')}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Sélecteur période */}
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
            {t('reports.periodDays', { days: d })}
          </button>
        ))}
      </div>

      {/* Stats globales super_admin */}
      {user?.role === 'super_admin' && globalStats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          {[
            { labelKey: 'reports.totalDeposits',     value: `${fmt(globalStats.totalDeposits)} F`,   color: '#16A34A', Icon: ArrowDownCircle },
            { labelKey: 'reports.totalWithdrawals',  value: `${fmt(globalStats.totalWithdrawals)} F`, color: '#DC2626', Icon: ArrowUpCircle   },
            { labelKey: 'reports.totalRevenue',      value: `${fmt(globalStats.totalRevenue)} F`,     color: '#0A66C2', Icon: TrendingUp      },
            { labelKey: 'reports.totalBenefit',      value: `${fmt(globalStats.benefit)} F`,          color: '#7C3AED', Icon: Coins           },
            { labelKey: 'reports.activeMerchants',   value: globalStats.merchantsCount,               color: '#0284C7', Icon: Users           },
            { labelKey: 'reports.transactionsCount', value: globalStats.transactionsCount,             color: '#D97706', Icon: ArrowLeftRight  },
          ].map((s) => (
            <Card key={s.labelKey} padding="16px">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <s.Icon size={18} color={s.color} strokeWidth={2} />
                </div>
              </div>
              <div style={{ fontFamily: 'var(--font)', fontWeight: 800, fontSize: '22px', color: s.color }}>{s.value}</div>
              <div style={{ fontFamily: 'var(--font)', fontWeight: 500, fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{t(s.labelKey)}</div>
            </Card>
          ))}
        </div>
      )}

      {/* Graphique barres */}
      <Card title={t('reports.depositsWithdrawals', { days })}>
        <div style={{ height: '300px' }}>
          {chartData.length > 0 && !loading ? <Bar data={barData} options={opts} /> : noDataEl}
        </div>
      </Card>

      {/* Graphique ligne */}
      <Card title={t('reports.benefitVolume')}>
        <div style={{ height: '280px' }}>
          {chartData.length > 0 ? (
            <Line data={lineData} options={{
              ...opts,
              scales: {
                ...opts.scales,
                y2: { position: 'right', ticks: { font: { family: 'Manrope', size: 11 }, color: '#7C3AED' }, grid: { display: false } },
              },
            }} />
          ) : noDataEl}
        </div>
      </Card>

      {/* Tableau récapitulatif */}
      <Card title={t('reports.dailyDetail')} padding="0">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {[
                  t('reports.tableHeaders.date'),
                  t('reports.tableHeaders.deposits'),
                  t('reports.tableHeaders.withdrawals'),
                  t('reports.tableHeaders.transactions'),
                  t('reports.tableHeaders.benefit'),
                ].map((h) => (
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
