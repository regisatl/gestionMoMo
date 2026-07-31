import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

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
  const { t } = useTranslation();
  const theme = useTheme();
  const { user, logout } = useAuth();
  const { language, changeLanguage, supportedLanguages } = useLanguage();

  const [showLangModal, setShowLangModal] = React.useState(false);

  const handleLogout = () => {
    Alert.alert(
      t('profile.logoutTitle'),
      t('profile.logoutMessage'),
      [
        { text: t('profile.logoutCancel'), style: 'cancel' },
        { text: t('profile.logoutConfirm'), style: 'destructive', onPress: logout },
      ],
    );
  };

  const roleLabels = {
    super_admin: t('profile.roles.super_admin'),
    merchant:    t('profile.roles.merchant'),
    client:      t('profile.roles.client'),
  };

  const langNames = {
    fr: t('profile.languageNames.fr'),
    en: t('profile.languageNames.en'),
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: theme.spacing.base }}>
        <Text style={{ fontFamily: theme.typography.fontFamily.extraBold, fontSize: theme.typography.fontSize.xl, color: theme.text, marginBottom: theme.spacing.lg }}>
          {t('profile.title')}
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
            <Badge status="active" label={roleLabels[user?.role] || user?.role} />
            <Badge status={user?.status} />
          </View>
        </Card>

        {/* Paramètres compte */}
        <Card style={{ marginBottom: theme.spacing.md }}>
          <Text style={{ fontFamily: theme.typography.fontFamily.bold, fontSize: 12, color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
            {t('profile.account')}
          </Text>
          <SettingRow icon="✏️" label={t('profile.editProfile')} onPress={() => {}} theme={theme} />
          <Separator theme={theme} />
          <SettingRow icon="🔒" label={t('profile.changePassword')} onPress={() => {}} theme={theme} />
          <Separator theme={theme} />
          <SettingRow icon="📱" label={t('profile.telephone')} value={user?.phone} theme={theme} />
          {user?.email && (
            <>
              <Separator theme={theme} />
              <SettingRow icon="📧" label={t('profile.email')} value={user?.email} theme={theme} />
            </>
          )}
        </Card>

        {/* Préférences */}
        <Card style={{ marginBottom: theme.spacing.md }}>
          <Text style={{ fontFamily: theme.typography.fontFamily.bold, fontSize: 12, color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
            {t('profile.preferences')}
          </Text>

          {/* Mode sombre */}
          <SettingRow
            icon={theme.isDark ? '🌙' : '☀️'}
            label={t('profile.darkMode')}
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

          {/* Sélecteur de langue */}
          <SettingRow
            icon="🌐"
            label={t('profile.language')}
            value={langNames[language] || language}
            onPress={() => setShowLangModal(true)}
            theme={theme}
          />
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
            {t('profile.logout')}
          </Text>
        </TouchableOpacity>

        <Text style={{ textAlign: 'center', fontFamily: theme.typography.fontFamily.regular, fontSize: 11, color: theme.textSecondary }}>
          {t('common.copyright')}
        </Text>
      </ScrollView>

      {/* Modal sélecteur de langue */}
      <Modal
        visible={showLangModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLangModal(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' }}
          activeOpacity={1}
          onPress={() => setShowLangModal(false)}
        >
          <View style={{
            width: 280,
            backgroundColor: theme.backgroundCard,
            borderRadius: theme.radius.xl,
            overflow: 'hidden',
            borderWidth: 1, borderColor: theme.border,
          }}>
            <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: theme.border }}>
              <Text style={{ fontFamily: theme.typography.fontFamily.bold, fontSize: 16, color: theme.text, textAlign: 'center' }}>
                {t('profile.language')}
              </Text>
            </View>
            {supportedLanguages.map((lang, idx) => (
              <TouchableOpacity
                key={lang}
                onPress={() => { changeLanguage(lang); setShowLangModal(false); }}
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  padding: 16,
                  borderBottomWidth: idx < supportedLanguages.length - 1 ? 1 : 0,
                  borderBottomColor: theme.border,
                  backgroundColor: language === lang ? theme.colors.primaryAlpha : 'transparent',
                }}
              >
                <Text style={{ fontFamily: theme.typography.fontFamily.medium, fontSize: 15, color: theme.text }}>
                  {lang === 'fr' ? '🇫🇷' : '🇬🇧'} {langNames[lang]}
                </Text>
                {language === lang && (
                  <Text style={{ color: theme.colors.primary, fontSize: 18 }}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

export default ProfileScreen;
