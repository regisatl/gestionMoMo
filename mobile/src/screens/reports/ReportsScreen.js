import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import Card from '../../components/ui/Card';
import api from '../../services/api';

const StatCard = ({ label, value, icon, color, theme }) => (
  <Card style={{ flex: 1 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: `${color}18`, alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
        <Text style={{ fontSize: 14, color }}>{icon}</Text>
      </View>
      <Text style={{ fontFamily: theme.typography.fontFamily.regular, fontSize: 11, color: theme.textSecondary, flex: 1 }}>{label}</Text>
    </View>
    <Text style={{ fontFamily: theme.typography.fontFamily.extraBold, fontSize: 18, color: theme.text }}>{value}</Text>
  </Card>
);

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

  const maxVal = Math.max(...chartData.map((d) => d.totalDeposits || 0), 1);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: theme.spacing.base }}>
        <Text style={{ fontFamily: theme.typography.fontFamily.extraBold, fontSize: theme.typography.fontSize.xl, color: theme.text, marginBottom: theme.spacing.lg }}>
          {t('reports.title')}
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 60 }} />
        ) : (
          <>
            {/* Stats du jour */}
            <Text style={{ fontFamily: theme.typography.fontFamily.bold, fontSize: 14, color: theme.textSecondary, marginBottom: theme.spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {t('reports.today')}
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: theme.spacing.lg }}>
              <StatCard label={t('reports.deposits')} value={`${formatAmount(report?.totalDeposits)} F`} icon="⬇" color="#16A34A" theme={theme} />
              <StatCard label={t('reports.withdrawals')} value={`${formatAmount(report?.totalWithdrawals)} F`} icon="⬆" color="#DC2626" theme={theme} />
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: theme.spacing.xl }}>
              <StatCard label={t('reports.transactionsCount')} value={report?.transactionsCount || 0} icon="↔" color="#0A66C2" theme={theme} />
              <StatCard label={t('reports.benefit')} value={`${formatAmount(report?.benefit)} F`} icon="💰" color="#7C3AED" theme={theme} />
            </View>

            {/* Graphique 7 jours */}
            <Text style={{ fontFamily: theme.typography.fontFamily.bold, fontSize: 14, color: theme.textSecondary, marginBottom: theme.spacing.md, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {t('reports.evolution7Days')}
            </Text>
            <Card style={{ marginBottom: theme.spacing.xl }}>
              {chartData.length === 0 ? (
                <Text style={{ fontFamily: theme.typography.fontFamily.regular, color: theme.textSecondary, textAlign: 'center', paddingVertical: theme.spacing.lg }}>
                  {t('reports.noData')}
                </Text>
              ) : (
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 100, gap: 6, marginBottom: 8 }}>
                    {chartData.map((d, i) => {
                      const height = Math.max(4, ((d.totalDeposits || 0) / maxVal) * 90);
                      return (
                        <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                          <View style={{ width: '70%', height, backgroundColor: theme.colors.primary, borderRadius: 3, opacity: 0.85 }} />
                        </View>
                      );
                    })}
                  </View>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {chartData.map((d, i) => (
                      <Text key={i} style={{ flex: 1, fontFamily: theme.typography.fontFamily.regular, fontSize: 9, color: theme.textSecondary, textAlign: 'center' }}>
                        {d.date?.slice(5)}
                      </Text>
                    ))}
                  </View>
                </View>
              )}
            </Card>

            {/* Résumé */}
            <Card>
              <Text style={{ fontFamily: theme.typography.fontFamily.bold, fontSize: 14, color: theme.text, marginBottom: theme.spacing.md }}>
                {t('reports.summary')}
              </Text>
              {[
                { labelKey: 'reports.completed', value: report?.completedCount || 0, color: '#16A34A' },
                { labelKey: 'reports.pending',   value: report?.pendingCount || 0,   color: '#D97706' },
                { labelKey: 'reports.failed',    value: report?.failedCount || 0,    color: '#DC2626' },
              ].map((row) => (
                <View key={row.labelKey} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: row.color, marginRight: 8 }} />
                    <Text style={{ fontFamily: theme.typography.fontFamily.regular, fontSize: 13, color: theme.textSecondary }}>
                      {t(row.labelKey)}
                    </Text>
                  </View>
                  <Text style={{ fontFamily: theme.typography.fontFamily.bold, fontSize: 14, color: row.color }}>{row.value}</Text>
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
