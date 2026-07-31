import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Defs, LinearGradient, Stop, Rect, Line, Text as SvgText, G, Circle } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import Card from '../../components/ui/Card';
import Icon from '../../components/ui/Icon';
import api from '../../services/api';

const { width: SCREEN_W } = Dimensions.get('window');
const CHART_PADDING = 20; // padding horizontal de la Card
const CARD_INNER = SCREEN_W - CHART_PADDING * 2 - 32; // largeur nette SVG

/* ─── StatCard ─────────────────────────────────────── */
const StatCard = ({ label, value, iconName, color, theme }) => (
  <Card style={{ flex: 1 }}>
    <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: `${color}18`, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
      <Icon name={iconName} size={20} color={color} />
    </View>
    <Text style={{ fontFamily: theme.typography.fontFamily.regular, fontSize: 11, color: theme.textSecondary, marginBottom: 4 }}>
      {label}
    </Text>
    <Text style={{ fontFamily: theme.typography.fontFamily.extraBold, fontSize: 17, color: theme.text }}>
      {value}
    </Text>
  </Card>
);

/* ─── BarChart SVG moderne ──────────────────────────── */
const ModernBarChart = ({ data, theme }) => {
  const W = CARD_INNER;
  const H = 140;
  const BAR_AREA_H = 100;
  const LABEL_H = 28;
  const BAR_GAP = 4;

  const maxDep = Math.max(...data.map((d) => d.totalDeposits || 0), 1);
  const maxWit = Math.max(...data.map((d) => d.totalWithdrawals || 0), 1);
  const maxVal = Math.max(maxDep, maxWit, 1);

  const colW = data.length > 0 ? W / data.length : W;
  const barW = Math.max(6, (colW - BAR_GAP * 3) / 2);

  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <Svg width={W} height={H + LABEL_H}>
      <Defs>
        <LinearGradient id="depGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#16A34A" stopOpacity="0.9" />
          <Stop offset="1" stopColor="#16A34A" stopOpacity="0.4" />
        </LinearGradient>
        <LinearGradient id="witGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#DC2626" stopOpacity="0.85" />
          <Stop offset="1" stopColor="#DC2626" stopOpacity="0.35" />
        </LinearGradient>
      </Defs>

      {/* Grid lines */}
      {gridLines.map((ratio) => {
        const y = H - ratio * BAR_AREA_H;
        return (
          <Line
            key={ratio}
            x1={0} y1={y} x2={W} y2={y}
            stroke={theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}
            strokeWidth={1}
          />
        );
      })}

      {/* Barres */}
      {data.map((d, i) => {
        const cx = i * colW + colW / 2;
        const depH = Math.max(4, ((d.totalDeposits || 0) / maxVal) * BAR_AREA_H);
        const witH = Math.max(4, ((d.totalWithdrawals || 0) / maxVal) * BAR_AREA_H);
        const depX = cx - barW - BAR_GAP / 2;
        const witX = cx + BAR_GAP / 2;

        return (
          <G key={i}>
            {/* Dépôt */}
            <Rect
              x={depX} y={H - depH}
              width={barW} height={depH}
              fill="url(#depGrad)"
              rx={4} ry={4}
            />
            {/* Retrait */}
            <Rect
              x={witX} y={H - witH}
              width={barW} height={witH}
              fill="url(#witGrad)"
              rx={4} ry={4}
            />
            {/* Label date */}
            <SvgText
              x={cx} y={H + LABEL_H - 6}
              textAnchor="middle"
              fontSize={9}
              fill={theme.textSecondary}
              fontFamily="Manrope-Regular"
            >
              {d.date?.slice(5)}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
};

/* ─── LineChart SVG moderne ─────────────────────────── */
const ModernLineChart = ({ data, color, gradientId, theme }) => {
  const W = CARD_INNER;
  const H = 110;
  const LABEL_H = 24;
  const PADDING_Y = 12;

  const values = data.map((d) => d.totalDeposits || 0);
  const maxVal = Math.max(...values, 1);
  const minVal = Math.min(...values, 0);
  const range  = maxVal - minVal || 1;

  const getX = (i) => (i / Math.max(data.length - 1, 1)) * W;
  const getY = (v) => PADDING_Y + (1 - (v - minVal) / range) * (H - PADDING_Y * 2);

  // Courbe smooth via bezier
  const points = values.map((v, i) => ({ x: getX(i), y: getY(v) }));

  const linePath = points.reduce((path, pt, i) => {
    if (i === 0) return `M${pt.x},${pt.y}`;
    const prev = points[i - 1];
    const cpx = (prev.x + pt.x) / 2;
    return `${path} C${cpx},${prev.y} ${cpx},${pt.y} ${pt.x},${pt.y}`;
  }, '');

  const areaPath = points.length > 0
    ? `${linePath} L${points[points.length - 1].x},${H} L${points[0].x},${H} Z`
    : '';

  return (
    <Svg width={W} height={H + LABEL_H}>
      <Defs>
        <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="0.35" />
          <Stop offset="1" stopColor={color} stopOpacity="0"   />
        </LinearGradient>
      </Defs>

      {/* Area */}
      {areaPath ? (
        <Path d={areaPath} fill={`url(#${gradientId})`} />
      ) : null}

      {/* Line */}
      {linePath ? (
        <Path d={linePath} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      ) : null}

      {/* Points hover-like dots */}
      {points.map((pt, i) => (
        <Circle key={i} cx={pt.x} cy={pt.y} r={3.5} fill={color} />
      ))}

      {/* Labels */}
      {data.map((d, i) => (
        <SvgText
          key={i}
          x={getX(i)} y={H + LABEL_H - 4}
          textAnchor="middle"
          fontSize={9}
          fill={theme.textSecondary}
          fontFamily="Manrope-Regular"
        >
          {d.date?.slice(5)}
        </SvgText>
      ))}
    </Svg>
  );
};

/* ─── Légende ───────────────────────────────────────── */
const Legend = ({ items, theme }) => (
  <View style={{ flexDirection: 'row', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
    {items.map(({ color, label }) => (
      <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: color }} />
        <Text style={{ fontFamily: theme.typography.fontFamily.medium, fontSize: 11, color: theme.textSecondary }}>
          {label}
        </Text>
      </View>
    ))}
  </View>
);

/* ─── ReportsScreen ─────────────────────────────────── */
const ReportsScreen = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [report, setReport] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().slice(0, 10);
  const formatAmount = (n = 0) => new Intl.NumberFormat('fr-FR').format(n);

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      api.get(`/reports/daily?date=${today}`),
      api.get('/reports/chart?days=7'),
    ]).then(([r1, r2]) => {
      if (r1.status === 'fulfilled') setReport(r1.value.data.report);
      if (r2.status === 'fulfilled') setChartData(r2.value.data.chartData);
    }).finally(() => setLoading(false));
  }, []);

  const sectionLabel = (text) => (
    <Text style={{
      fontFamily: theme.typography.fontFamily.bold, fontSize: 11,
      color: theme.textSecondary, marginBottom: 12,
      textTransform: 'uppercase', letterSpacing: 0.6,
    }}>
      {text}
    </Text>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontFamily: theme.typography.fontFamily.extraBold, fontSize: 22, color: theme.text, marginBottom: 20 }}>
          {t('reports.title')}
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 60 }} />
        ) : (
          <>
            {/* Stats du jour */}
            {sectionLabel(t('reports.today'))}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
              <StatCard label={t('reports.deposits')}         value={`${formatAmount(report?.totalDeposits)} F`}    iconName="arrow-bottom-left" color="#16A34A" theme={theme} />
              <StatCard label={t('reports.withdrawals')}      value={`${formatAmount(report?.totalWithdrawals)} F`} iconName="arrow-top-right"   color="#DC2626" theme={theme} />
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 28 }}>
              <StatCard label={t('reports.transactionsCount')} value={report?.transactionsCount || 0}               iconName="swap-horizontal"   color="#0A66C2" theme={theme} />
              <StatCard label={t('reports.benefit')}           value={`${formatAmount(report?.benefit)} F`}         iconName="trending-up"       color="#7C3AED" theme={theme} />
            </View>

            {/* Bar chart dépôts/retraits 7j */}
            {sectionLabel(t('reports.evolution7Days'))}
            <Card style={{ marginBottom: 24, overflow: 'hidden' }}>
              {chartData.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                  <Icon name="chart-bar" size={32} color={theme.border} />
                  <Text style={{ fontFamily: theme.typography.fontFamily.regular, color: theme.textSecondary, marginTop: 8 }}>
                    {t('reports.noData')}
                  </Text>
                </View>
              ) : (
                <>
                  <Legend
                    items={[
                      { color: '#16A34A', label: t('reports.deposits') },
                      { color: '#DC2626', label: t('reports.withdrawals') },
                    ]}
                    theme={theme}
                  />
                  <ModernBarChart data={chartData} theme={theme} />
                </>
              )}
            </Card>

            {/* Line chart dépôts */}
            {sectionLabel(t('reports.depositsEvolution'))}
            <Card style={{ marginBottom: 24, overflow: 'hidden' }}>
              {chartData.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                  <Text style={{ fontFamily: theme.typography.fontFamily.regular, color: theme.textSecondary }}>
                    {t('reports.noData')}
                  </Text>
                </View>
              ) : (
                <>
                  <Legend items={[{ color: '#0A66C2', label: t('reports.deposits') }]} theme={theme} />
                  <ModernLineChart data={chartData} color="#0A66C2" gradientId="depLineGrad" theme={theme} />
                </>
              )}
            </Card>

            {/* Résumé statuts */}
            <Card>
              <Text style={{ fontFamily: theme.typography.fontFamily.bold, fontSize: 14, color: theme.text, marginBottom: 12 }}>
                {t('reports.summary')}
              </Text>
              {[
                { labelKey: 'reports.completed', value: report?.completedCount || 0, color: '#16A34A', iconName: 'check-circle-outline' },
                { labelKey: 'reports.pending',   value: report?.pendingCount   || 0, color: '#D97706', iconName: 'clock-outline'         },
                { labelKey: 'reports.failed',    value: report?.failedCount    || 0, color: '#DC2626', iconName: 'close-circle-outline'  },
              ].map((row) => (
                <View key={row.labelKey} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Icon name={row.iconName} size={18} color={row.color} />
                    <Text style={{ fontFamily: theme.typography.fontFamily.regular, fontSize: 13, color: theme.textSecondary }}>
                      {t(row.labelKey)}
                    </Text>
                  </View>
                  <Text style={{ fontFamily: theme.typography.fontFamily.bold, fontSize: 15, color: row.color }}>
                    {row.value}
                  </Text>
                </View>
              ))}
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ReportsScreen;
