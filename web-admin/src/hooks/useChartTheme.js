import { useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';

/**
 * useChartTheme — GestionMoMo
 *
 * Chart.js ne sait pas résoudre les variables CSS (var(--xxx)).
 * Ce hook retourne les vraies valeurs hex selon le mode courant,
 * à utiliser directement dans les options Chart.js.
 *
 * Retourne :
 *   chartColors.tickColor   — couleur des labels d'axes
 *   chartColors.gridColor   — couleur des lignes de grille
 *   chartColors.legendColor — couleur du texte de légende
 *   chartOptions(extra?)    — objet options Chart.js prêt à l'emploi
 */
const useChartTheme = () => {
  const { isDark } = useTheme();

  const chartColors = useMemo(() => ({
    tickColor:   isDark ? '#A0A0A0' : '#6B7280',
    gridColor:   isDark ? '#3D3D3D' : '#E5E7EB',
    legendColor: isDark ? '#A0A0A0' : '#6B7280',
  }), [isDark]);

  /**
   * Retourne un objet options Chart.js complet.
   * @param {object} extra — overrides optionnels fusionnés en profondeur
   */
  const buildChartOptions = useMemo(() => (extra = {}) => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300 },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: { family: 'Manrope', size: 12 },
          color: chartColors.legendColor,
          boxWidth: 12,
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: isDark ? '#F0F4FF' : '#1A1A2E',
        titleColor:      isDark ? '#1A1A2E' : '#F5F5F5',
        bodyColor:       isDark ? '#1A1A2E' : '#D1D5DB',
        borderColor:     isDark ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
        borderWidth:     1,
        padding:         10,
        cornerRadius:    7,
        titleFont:       { family: 'Manrope', size: 12, weight: '700' },
        bodyFont:        { family: 'Manrope', size: 12 },
      },
      ...extra.plugins,
    },
    scales: {
      x: {
        ticks: { font: { family: 'Manrope', size: 11 }, color: chartColors.tickColor },
        grid:  { display: false },
        border: { color: chartColors.gridColor },
        ...extra.x,
      },
      y: {
        ticks: { font: { family: 'Manrope', size: 11 }, color: chartColors.tickColor },
        grid:  { color: chartColors.gridColor },
        border: { color: chartColors.gridColor },
        ...extra.y,
      },
      ...extra.scales,
    },
    ...extra,
  }), [chartColors, isDark]);

  return { chartColors, buildChartOptions, isDark };
};

export default useChartTheme;
