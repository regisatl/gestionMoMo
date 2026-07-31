import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Icon from '../../components/ui/Icon';

const SettingRow = ({ iconName, label, value, onPress, rightElement, theme, iconColor }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={!onPress && !rightElement}
    activeOpacity={onPress ? 0.65 : 1}
    style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 13 }}
  >
    <View
      style={{
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: `${iconColor || theme.colors.primary}15`,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
      }}
    >
      <Icon name={iconName} size={18} color={iconColor || theme.colors.primary} />
    </View>
    <Text style={{ fontFamily: theme.typography.fontFamily.medium, fontSize: 14, color: theme.text, flex: 1 }}>
      {label}
    </Text>
    {rightElement || (
      value
        ? <Text style={{ fontFamily: theme.typography.fontFamily.regular, fontSize: 13, color: theme.textSecondary }}>{value}</Text>
        : null
    )}
    {onPress && !rightElement && (
      <Icon name="chevron-right" size={18} color={theme.textSecondary} style={{ marginLeft: 4 }} />
    )}
  </TouchableOpacity>
);

const Separator = ({ theme }) => <View style={{ height: 1, backgroundColor: theme.border }} />;

const ProfileScreen = () => {
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

  const flagIcon = { fr: 'flag', en: 'flag-outline' };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontFamily: theme.typography.fontFamily.extraBold, fontSize: 22, color: theme.text, marginBottom: 20 }}>
          {t('profile.title')}
        </Text>

        {/* Avatar card */}
        <Card style={{ alignItems: 'center', marginBottom: 16, paddingVertical: 24 }}>
          <View
            style={{
              width: 76,
              height: 76,
              borderRadius: 24,
              backgroundColor: theme.colors.primaryAlpha,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
            }}
          >
            <Text style={{ fontFamily: theme.typography.fontFamily.extraBold, fontSize: 28, color: theme.colors.primary }}>
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
          <Text style={{ fontFamily: theme.typography.fontFamily.bold, fontSize: 18, color: theme.text }}>{user?.name}</Text>
          <Text style={{ fontFamily: theme.typography.fontFamily.regular, fontSize: 13, color: theme.textSecondary, marginTop: 2 }}>
            {user?.phone}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            <Badge status="active" label={roleLabels[user?.role] || user?.role} />
            <Badge status={user?.status} />
          </View>
        </Card>

        {/* Account settings */}
        <Card style={{ marginBottom: 12 }}>
          <Text style={{ fontFamily: theme.typography.fontFamily.bold, fontSize: 11, color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>
            {t('profile.account')}
          </Text>
          <SettingRow iconName="account-edit-outline" label={t('profile.editProfile')} onPress={() => {}} theme={theme} />
          <Separator theme={theme} />
          <SettingRow iconName="lock-outline" label={t('profile.changePin')} onPress={() => {}} theme={theme} iconColor="#7C3AED" />
          <Separator theme={theme} />
          <SettingRow iconName="phone-outline" label={t('profile.telephone')} value={user?.phone} theme={theme} iconColor="#16A34A" />
          {user?.email && (
            <>
              <Separator theme={theme} />
              <SettingRow iconName="email-outline" label={t('profile.email')} value={user?.email} theme={theme} iconColor="#0284C7" />
            </>
          )}
        </Card>

        {/* Preferences */}
        <Card style={{ marginBottom: 16 }}>
          <Text style={{ fontFamily: theme.typography.fontFamily.bold, fontSize: 11, color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>
            {t('profile.preferences')}
          </Text>

          <SettingRow
            iconName={theme.isDark ? 'weather-night' : 'weather-sunny'}
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
            iconColor={theme.isDark ? '#7C3AED' : '#D97706'}
          />
          <Separator theme={theme} />
          <SettingRow
            iconName="translate"
            label={t('profile.language')}
            value={langNames[language] || language}
            onPress={() => setShowLangModal(true)}
            theme={theme}
            iconColor="#0284C7"
          />
        </Card>

        {/* Logout */}
        <TouchableOpacity
          onPress={handleLogout}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.colors.errorLight,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: `${theme.colors.error}40`,
            padding: 14,
            marginBottom: 32,
            gap: 10,
          }}
        >
          <Icon name="logout" size={18} color={theme.colors.error} />
          <Text style={{ fontFamily: theme.typography.fontFamily.semiBold, fontSize: 15, color: theme.colors.error }}>
            {t('profile.logout')}
          </Text>
        </TouchableOpacity>

        <Text style={{ textAlign: 'center', fontFamily: theme.typography.fontFamily.regular, fontSize: 11, color: theme.textSecondary }}>
          {t('common.copyright')}
        </Text>
      </ScrollView>

      {/* Language modal */}
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
          <View
            style={{
              width: 280,
              backgroundColor: theme.backgroundCard,
              borderRadius: 20,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
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
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 16,
                  borderBottomWidth: idx < supportedLanguages.length - 1 ? 1 : 0,
                  borderBottomColor: theme.border,
                  backgroundColor: language === lang ? theme.colors.primaryAlpha : 'transparent',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Icon name={flagIcon[lang] || 'flag'} size={18} color={theme.textSecondary} />
                  <Text style={{ fontFamily: theme.typography.fontFamily.medium, fontSize: 15, color: theme.text }}>
                    {langNames[lang]}
                  </Text>
                </View>
                {language === lang && (
                  <Icon name="check-circle" size={18} color={theme.colors.primary} />
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
