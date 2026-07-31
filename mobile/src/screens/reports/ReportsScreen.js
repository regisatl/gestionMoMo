import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import Card from '../../components/ui/Card';
import Icon from '../../components/ui/Icon';
import api from '../../services/api';

const StatCard = ({ label, value, iconName, color, theme }) => (
  <Card style={{ flex: 1 }}>
    <View
      style={{
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: `${color}18`,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
      }}
    >
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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontFamily: theme.typography.fontFamily.extraBold, fontSize: 22, color: theme.text, marginBottom: 20 }}>
          {t('reports.title')}
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 60 }} />
        ) : (
          <>
            {/* Today stats */}
            <Text style={{ fontFamily: theme.typography.fontFamily.bold, fontSize: 11, color: theme.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.6 }}>
              {t('reports.today')}
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
              <StatCard
                label={t('reports.deposits')}
                value={`${formatAmount(report?.totalDeposits)} F`}
                iconName="arrow-bottom-left"
                color="#16A34A"
                theme={theme}
              />
              <StatCard
                label={t('reports.withdrawals')}
                value={`${formatAmount(report?.totalWithdrawals)} F`}
                iconName="arrow-top-right"
                color="#DC2626"
                theme={theme}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
              <StatCard
                label={t('reports.transactionsCount')}
                value={report?.transactionsCount || 0}
                iconName="swap-horizontal"
                color="#0A66C2"
                theme={theme}
              />
              <StatCard
                label={t('reports.benefit')}
                value={`${formatAmount(report?.benefit)} F`}
                iconName="trending-up"
                color="#7C3AED"
                theme={theme}
              />
            </View>

            {/* 7-day chart */}
            <Text style={{ fontFamily: theme.typography.fontFamily.bold, fontSize: 11, color: theme.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.6 }}>
              {t('reports.evolution7Days')}
            </Text>
            <Card style={{ marginBottom: 24 }}>
              {chartData.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                  <Icon name="chart-bar" size={32} color={theme.border} />
                  <Text style={{ fontFamily: theme.typography.fontFamily.regular, color: theme.textSecondary, marginTop: 8 }}>
                    {t('reports.noData')}
                  </Text>
                </View>
              ) : (
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 100, gap: 6, marginBottom: 8 }}>
                    {chartData.map((d, i) => {
                      const height = Math.max(4, ((d.totalDeposits || 0) / maxVal) * 90);
                      return (
                        <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                          <View
                            style={{
                              width: '70%',
                              height,
                              backgroundColor: theme.colors.primary,
                              borderRadius: 4,
                              opacity: 0.85,
                            }}
                          />
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

            {/* Summary */}
            <Card>
              <Text style={{ fontFamily: theme.typography.fontFamily.bold, fontSize: 14, color: theme.text, marginBottom: 12 }}>
                {t('reports.summary')}
              </Text>
              {[
                { labelKey: 'reports.completed', value: report?.completedCount || 0, color: '#16A34A', iconName: 'check-circle-outline' },
                { labelKey: 'reports.pending',   value: report?.pendingCount || 0,   color: '#D97706', iconName: 'clock-outline' },
                { labelKey: 'reports.failed',    value: report?.failedCount || 0,    color: '#DC2626', iconName: 'close-circle-outline' },
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
