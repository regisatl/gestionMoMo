import { useMemo, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';

/**
 * useChartTheme — GestionMoMo
 *
 * Fournit :
 *   chartColors          — valeurs hex résolues selon isDark
 *   buildChartOptions()  — objet options Chart.js moderne prêt à l'emploi
 *   createGradient()     — helper pour générer un gradient canvas (area fill)
 *   isDark               — boolean courant
 */
const useChartTheme = () => {
  const { isDark } = useTheme();

  const chartColors = useMemo(() => ({
    tickColor:   isDark ? '#888888' : '#9CA3AF',
    gridColor:   isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    legendColor: isDark ? '#A0A0A0' : '#6B7280',
    zeroLine:    isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)',
  }), [isDark]);

  /**
   * Génère un gradient vertical canvas pour l'area fill des Line charts.
   * À appeler depuis `dataset.backgroundColor` avec une fonction callback.
   *
   * @param {string} hexColor  — couleur de base (#RRGGBB)
   * @param {number} alphaTop  — opacité en haut (0–1), défaut 0.35
   * @param {number} alphaBot  — opacité en bas  (0–1), défaut 0
   */
  const createGradient = useCallback((hexColor, alphaTop = 0.35, alphaBot = 0) => {
    return (ctx) => {
      const chart = ctx.chart;
      const { top, bottom } = chart.chartArea || {};
      if (!chart.chartArea) return `${hexColor}00`;
      const gradient = chart.ctx.createLinearGradient(0, top, 0, bottom);
      gradient.addColorStop(0,   hexToRgba(hexColor, alphaTop));
      gradient.addColorStop(0.6, hexToRgba(hexColor, alphaTop * 0.4));
      gradient.addColorStop(1,   hexToRgba(hexColor, alphaBot));
      return gradient;
    };
  }, []);

  const buildChartOptions = useMemo(() => (extra = {}) => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    animation: {
      duration: 600,
      easing: 'easeInOutQuart',
    },
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          font: { family: 'Manrope', size: 12, weight: '500' },
          color: chartColors.legendColor,
          boxWidth: 10,
          boxHeight: 10,
          borderRadius: 3,
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: isDark ? '#2D2D2D' : '#FFFFFF',
        titleColor:      isDark ? '#F5F5F5' : '#111827',
        bodyColor:       isDark ? '#A0A0A0' : '#6B7280',
        borderColor:     isDark ? '#3D3D3D' : '#E5E7EB',
        borderWidth:     1,
        padding:         12,
        cornerRadius:    10,
        caretSize:       6,
        caretPadding:    8,
        titleFont:       { family: 'Manrope', size: 12, weight: '700' },
        bodyFont:        { family: 'Manrope', size: 12, weight: '500' },
        displayColors:   true,
        boxWidth:        8,
        boxHeight:       8,
        boxPadding:      4,
        callbacks: {
          labelColor: (ctx) => ({
            borderColor: 'transparent',
            backgroundColor: ctx.dataset.borderColor || ctx.dataset.backgroundColor,
            borderRadius: 3,
          }),
        },
      },
      ...extra.plugins,
    },
    scales: {
      x: {
        ticks: {
          font:       { family: 'Manrope', size: 11 },
          color:      chartColors.tickColor,
          maxRotation: 0,
          padding:    8,
        },
        grid:   { display: false },
        border: { display: false },
        ...extra.x,
      },
      y: {
        ticks: {
          font:     { family: 'Manrope', size: 11 },
          color:    chartColors.tickColor,
          padding:  12,
          maxTicksLimit: 6,
        },
        grid: {
          color:     chartColors.gridColor,
          lineWidth: 1,
          drawTicks: false,
        },
        border:   { display: false, dash: [4, 4] },
        beginAtZero: true,
        ...extra.y,
      },
      ...extra.scales,
    },
    elements: {
      line: {
        tension:     0.45,
        borderWidth: 2.5,
        borderCapStyle: 'round',
        borderJoinStyle: 'round',
      },
      point: {
        radius:      0,         // invisible par défaut
        hitRadius:   20,
        hoverRadius: 5,
        hoverBorderWidth: 2.5,
        hoverBackgroundColor: isDark ? '#2D2D2D' : '#FFFFFF',
      },
      bar: {
        borderRadius:     { topLeft: 6, topRight: 6 },
        borderSkipped:    'bottom',
        borderWidth:      0,
      },
    },
    ...extra,
  }), [chartColors, isDark]);

  return { chartColors, buildChartOptions, createGradient, isDark };
};

/** Convertit un hex (#RRGGBB) en rgba(r,g,b,a) */
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default useChartTheme;
