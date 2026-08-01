import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import PlexusBackground from '../../components/ui/PlexusBackground';
import Icon from '../../components/ui/Icon';

const AdminCard = ({ iconName, color, title, subtitle, onPress, theme }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.75}
    style={[styles.card, { backgroundColor: theme.backgroundCard, borderColor: theme.border, ...theme.shadows.md }]}>
    <View style={[styles.cardIcon, { backgroundColor: `${color}15` }]}>
      <Icon name={iconName} size={26} color={color} />
    </View>
    <View style={{ flex: 1, marginLeft: 16 }}>
      <Text style={{ fontFamily: theme.typography.fontFamily.bold, fontSize: 16, color: theme.text }}>{title}</Text>
      <Text style={{ fontFamily: theme.typography.fontFamily.regular, fontSize: 13, color: theme.textSecondary, marginTop: 2 }}>{subtitle}</Text>
    </View>
    <Icon name="chevron-right" size={20} color={theme.textSecondary} />
  </TouchableOpacity>
);

const AdminHomeScreen = ({ navigation }) => {
  const { t }    = useTranslation();
  const theme    = useTheme();
  const { user } = useAuth();

  const CARDS = [
    { iconName: 'account-group-outline', color: '#0A66C2', title: t('admin.users.title'),     subtitle: t('admin.home.usersSubtitle'),     screen: 'AdminUsers' },
    { iconName: 'store-outline',         color: '#16A34A', title: t('admin.merchants.title'), subtitle: t('admin.home.merchantsSubtitle'), screen: 'AdminMerchants' },
    { iconName: 'credit-card-outline',   color: '#7C3AED', title: t('admin.accounts.title'), subtitle: t('admin.home.accountsSubtitle'),  screen: 'AdminAccounts' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top']}>
      <PlexusBackground />
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View>
          <Text style={{ fontFamily: theme.typography.fontFamily.extraBold, fontSize: 22, color: theme.text }}>
            {t('admin.home.title')}
          </Text>
          <Text style={{ fontFamily: theme.typography.fontFamily.regular, fontSize: 13, color: theme.textSecondary, marginTop: 2 }}>
            {user?.name}
          </Text>
        </View>
        <View style={[styles.adminBadge, { backgroundColor: '#7C3AED18' }]}>
          <Icon name="shield-crown-outline" size={14} color="#7C3AED" />
          <Text style={{ fontFamily: theme.typography.fontFamily.semiBold, fontSize: 11, color: '#7C3AED', marginLeft: 4 }}>
            Super Admin
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontFamily: theme.typography.fontFamily.semiBold, fontSize: 13, color: theme.textSecondary, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.6 }}>
          {t('admin.home.management')}
        </Text>
        {CARDS.map((c) => (
          <AdminCard key={c.screen} {...c} onPress={() => navigation.navigate(c.screen)} theme={theme} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  adminBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  card: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, padding: 18 },
  cardIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});

export default AdminHomeScreen;
