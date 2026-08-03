import React, { useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, TrendingUp, Users, Coins } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Card from '../components/ui/Card';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import useChartTheme from '../hooks/useChartTheme';
import Loader from '../components/ui/Loader';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler);

const fmt = (n = 0) => new Intl.NumberFormat('fr-FR').format(n);

const ReportsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { buildChartOptions, createGradient, chartColors } = useChartTheme();
  const [chartData, setChartData] = useState([]);
  const [globalStats, setGlobalStats] = useState(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const loads = [api.get(`/reports/chart?days=${days}`)];
    if (user?.role === 'super_admin') loads.push(api.get('/reports/global'));
    Promise.allSettled(loads).then(([r1, r2]) => {
      if (r1.status === 'fulfilled') setChartData(r1.value.data.chartData);
      if (r2?.status === 'fulfilled') setGlobalStats(r2.value.data.global);
    }).finally(() => setLoading(false));
  }, [days, user]);

  const labels = chartData.map((d) => d.date?.slice(5));

  /* ── Bar chart — dépôts / retraits ── */
  const barData = {
    labels,
    datasets: [
      {
        label: t('reports.chartLabels.deposits'),
        data: chartData.map((d) => d.totalDeposits || 0),
        backgroundColor: createGradient('#16A34A', 0.85, 0.55),
        borderColor: '#16A34A',
        borderWidth: 0,
        borderRadius: { topLeft: 6, topRight: 6 },
        borderSkipped: 'bottom',
        barPercentage: 0.6,
        categoryPercentage: 0.8,
      },
      {
        label: t('reports.chartLabels.withdrawals'),
        data: chartData.map((d) => d.totalWithdrawals || 0),
        backgroundColor: createGradient('#DC2626', 0.80, 0.50),
        borderColor: '#DC2626',
        borderWidth: 0,
        borderRadius: { topLeft: 6, topRight: 6 },
        borderSkipped: 'bottom',
        barPercentage: 0.6,
        categoryPercentage: 0.8,
      },
    ],
  };

  /* ── Line chart — bénéfice / volume ── */
  const lineData = {
    labels,
    datasets: [
      {
        label: t('reports.chartLabels.benefit'),
        data: chartData.map((d) => d.benefit || 0),
        borderColor: '#0A66C2',
        backgroundColor: createGradient('#0A66C2', 0.30, 0),
        borderWidth: 2.5,
        tension: 0.45,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: '#0A66C2',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
      },
      {
        label: t('reports.chartLabels.transactions'),
        data: chartData.map((d) => d.transactionsCount || 0),
        borderColor: '#7C3AED',
        backgroundColor: createGradient('#7C3AED', 0.20, 0),
        borderWidth: 2.5,
        tension: 0.45,
        fill: true,
        yAxisID: 'y2',
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: '#7C3AED',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
      },
    ],
  };

  const opts = buildChartOptions();

  const lineOpts = {
    ...opts,
    scales: {
      ...opts.scales,
      y2: {
        position: 'right',
        ticks: { font: { family: 'Manrope', size: 11 }, color: '#7C3AED', padding: 12 },
        grid: { display: false },
        border: { display: false },
      },
    },
  };

  const noDataEl = (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontFamily: 'var(--font)', fontSize: '13px', gap: '8px' }}>
      {t('reports.noData')}
    </div>
  );

  if (loading && chartData.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader message="loader.reports" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── Sélecteur période ── */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {[7, 14, 30, 90].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            style={{
              padding: '6px 18px', borderRadius: '9999px', cursor: 'pointer',
              fontFamily: 'var(--font)', fontWeight: 600, fontSize: '13px',
              border: days === d ? 'none' : '1.5px solid var(--border)',
              background: days === d ? 'var(--color-primary)' : 'transparent',
              color: days === d ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.15s',
            }}
          >
            {t('reports.periodDays', { days: d })}
          </button>
        ))}
      </div>

      {/* ── Stats globales super_admin ── */}
      {user?.role === 'super_admin' && globalStats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
          {[
            { labelKey: 'reports.totalDeposits',     value: `${fmt(globalStats.totalDeposits)} F`,   color: '#16A34A', Icon: ArrowDownCircle },
            { labelKey: 'reports.totalWithdrawals',  value: `${fmt(globalStats.totalWithdrawals)} F`, color: '#DC2626', Icon: ArrowUpCircle   },
            { labelKey: 'reports.totalRevenue',      value: `${fmt(globalStats.totalRevenue)} F`,     color: '#0A66C2', Icon: TrendingUp      },
            { labelKey: 'reports.totalBenefit',      value: `${fmt(globalStats.benefit)} F`,          color: '#7C3AED', Icon: Coins           },
            { labelKey: 'reports.activeMerchants',   value: globalStats.merchantsCount,               color: '#0284C7', Icon: Users           },
            { labelKey: 'reports.transactionsCount', value: globalStats.transactionsCount,             color: '#D97706', Icon: ArrowLeftRight  },
          ].map((s) => (
            <div key={s.labelKey} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: '14px', padding: '16px',
              boxShadow: '0 1px 4px var(--shadow)',
            }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                <s.Icon size={18} color={s.color} strokeWidth={2} />
              </div>
              <div style={{ fontFamily: 'var(--font)', fontWeight: 800, fontSize: '20px', color: s.color, letterSpacing: '-0.3px' }}>{s.value}</div>
              <div style={{ fontFamily: 'var(--font)', fontWeight: 500, fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{t(s.labelKey)}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Bar chart ── */}
      <Card title={t('reports.depositsWithdrawals', { days })}>
        <div style={{ height: '300px' }}>
          {chartData.length > 0 && !loading ? <Bar data={barData} options={opts} /> : noDataEl}
        </div>
      </Card>

      {/* ── Line chart ── */}
      <Card title={t('reports.benefitVolume')}>
        <div style={{ height: '280px' }}>
          {chartData.length > 0 && !loading ? <Line data={lineData} options={lineOpts} /> : noDataEl}
        </div>
      </Card>

      {/* ── Daily breakdown — padding corrigé ── */}
      <Card title={t('reports.dailyDetail')} padding="14px 20px">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--surface)' }}>
                {[
                  t('reports.tableHeaders.date'),
                  t('reports.tableHeaders.deposits'),
                  t('reports.tableHeaders.withdrawals'),
                  t('reports.tableHeaders.transactions'),
                  t('reports.tableHeaders.benefit'),
                ].map((h, i) => (
                  <th
                    key={h}
                    style={{
                      fontFamily: 'var(--font)', fontWeight: 600, fontSize: '11px',
                      color: 'var(--text-secondary)',
                      textAlign: i === 0 ? 'left' : 'right',
                      padding: '14px 20px',
                      borderBottom: '1px solid var(--border)',
                      textTransform: 'uppercase', letterSpacing: '0.5px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...chartData].reverse().map((d, i) => (
                <tr
                  key={i}
                  style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '14px 20px', fontFamily: 'var(--font)', fontSize: '13px', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap' }}>
                    {d.date}
                  </td>
                  <td style={{ padding: '14px 20px', fontFamily: 'var(--font)', fontSize: '13px', color: '#16A34A', fontWeight: 600, textAlign: 'right' }}>
                    {fmt(d.totalDeposits)} F
                  </td>
                  <td style={{ padding: '14px 20px', fontFamily: 'var(--font)', fontSize: '13px', color: '#DC2626', fontWeight: 600, textAlign: 'right' }}>
                    {fmt(d.totalWithdrawals)} F
                  </td>
                  <td style={{ padding: '14px 20px', fontFamily: 'var(--font)', fontSize: '13px', color: 'var(--text)', textAlign: 'right' }}>
                    {d.transactionsCount}
                  </td>
                  <td style={{
                    padding: '14px 20px', fontFamily: 'var(--font)', fontSize: '13px', fontWeight: 700,
                    color: (d.benefit || 0) >= 0 ? '#16A34A' : '#DC2626',
                    textAlign: 'right',
                  }}>
                    {(d.benefit || 0) >= 0 ? '+' : ''}{fmt(d.benefit)} F
                  </td>
                </tr>
              ))}
              {chartData.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', fontFamily: 'var(--font)', fontSize: '13px' }}>
                    {loading ? t('common.loading') : t('reports.noData')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default ReportsPage;
