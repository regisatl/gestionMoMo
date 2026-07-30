import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

const ROLE_LABELS = { super_admin: 'Super Admin', merchant: 'Marchand', client: 'Client' };

const SettingRow = ({ icon, label, value, onPress, rightElement, theme }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={!onPress && !rightElement}
    style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 13 }}
  >
    <Text style={{ fontSize: 18, marginRight: 14 }}>{icon}</Text>
    <Text style={{ fontFamily: theme.typography.fontFamily.medium, fontSize: 14, color: theme.text, flex: 1 }}>
      {label}
    </Text>
    {rightElement || (
      value ? <Text style={{ fontFamily: theme.typography.fontFamily.regular, fontSize: 13, color: theme.textSecondary }}>{value}</Text> : null
    )}
    {onPress && <Text style={{ fontSize: 16, color: theme.textSecondary, marginLeft: 4 }}>›</Text>}
  </TouchableOpacity>
);

const Separator = ({ theme }) => <View style={{ height: 1, backgroundColor: theme.border }} />;

const ProfileScreen = ({ navigation }) => {
  const theme = useTheme();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnecter', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: theme.spacing.base }}>
        <Text style={{ fontFamily: theme.typography.fontFamily.extraBold, fontSize: theme.typography.fontSize.xl, color: theme.text, marginBottom: theme.spacing.lg }}>
          Profil
        </Text>

        {/* Avatar + info */}
        <Card style={{ alignItems: 'center', marginBottom: theme.spacing.lg }}>
          <View style={{
            width: 72, height: 72, borderRadius: 36,
            backgroundColor: theme.colors.primaryAlpha,
            alignItems: 'center', justifyContent: 'center', marginBottom: 12,
          }}>
            <Text style={{ fontFamily: theme.typography.fontFamily.extraBold, fontSize: 26, color: theme.colors.primary }}>
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
          <Text style={{ fontFamily: theme.typography.fontFamily.bold, fontSize: 18, color: theme.text }}>{user?.name}</Text>
          <Text style={{ fontFamily: theme.typography.fontFamily.regular, fontSize: 13, color: theme.textSecondary, marginTop: 2 }}>{user?.phone}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            <Badge status="active" label={ROLE_LABELS[user?.role] || user?.role} />
            <Badge status={user?.status} />
          </View>
        </Card>

        {/* Paramètres compte */}
        <Card style={{ marginBottom: theme.spacing.md }}>
          <Text style={{ fontFamily: theme.typography.fontFamily.bold, fontSize: 12, color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
            Compte
          </Text>
          <SettingRow icon="✏️" label="Modifier le profil" onPress={() => {}} theme={theme} />
          <Separator theme={theme} />
          <SettingRow icon="🔒" label="Changer le mot de passe" onPress={() => {}} theme={theme} />
          <Separator theme={theme} />
          <SettingRow icon="📱" label="Téléphone" value={user?.phone} theme={theme} />
          {user?.email && (
            <>
              <Separator theme={theme} />
              <SettingRow icon="📧" label="Email" value={user?.email} theme={theme} />
            </>
          )}
        </Card>

        {/* Préférences */}
        <Card style={{ marginBottom: theme.spacing.md }}>
          <Text style={{ fontFamily: theme.typography.fontFamily.bold, fontSize: 12, color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
            Préférences
          </Text>
          <SettingRow
            icon={theme.isDark ? '🌙' : '☀️'}
            label="Mode sombre"
            rightElement={
              <Switch
                value={theme.isDark}
                onValueChange={theme.toggleTheme}
                trackColor={{ false: theme.border, true: theme.colors.primary }}
                thumbColor="#FFF"
              />
            }
            theme={theme}
          />
          <Separator theme={theme} />
          <SettingRow icon="🌐" label="Langue" value={user?.language === 'fr' ? 'Français' : 'English'} onPress={() => {}} theme={theme} />
        </Card>

        {/* Déconnexion */}
        <TouchableOpacity
          onPress={handleLogout}
          style={{
            backgroundColor: theme.colors.errorLight,
            borderRadius: theme.radius.lg,
            borderWidth: 1, borderColor: theme.colors.error,
            padding: theme.spacing.md,
            alignItems: 'center',
            marginBottom: theme.spacing['2xl'],
          }}
        >
          <Text style={{ fontFamily: theme.typography.fontFamily.semiBold, fontSize: 15, color: theme.colors.error }}>
            Se déconnecter
          </Text>
        </TouchableOpacity>

        <Text style={{ textAlign: 'center', fontFamily: theme.typography.fontFamily.regular, fontSize: 11, color: theme.textSecondary }}>
          GestionMoMo v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;
