import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import Icon from '../../components/ui/Icon';
import useToast from '../../hooks/useToast';

const NOTIF_META = {
  success:     { icon: 'check-circle-outline', color: '#16A34A' },
  error:       { icon: 'close-circle-outline', color: '#DC2626' },
  warning:     { icon: 'alert-circle-outline', color: '#D97706' },
  info:        { icon: 'information-outline',  color: '#0284C7' },
  transaction: { icon: 'swap-horizontal',      color: '#0A66C2' },
  system:      { icon: 'cog-outline',          color: '#6B7280' },
};

const NotificationsScreen = () => {
  const { t }   = useTranslation();
  const theme   = useTheme();
  const toast   = useToast();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const handleMarkAsRead = async (id) => {
    await markAsRead(id);
    toast.info('Lu', 'Notification marquée comme lue');
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    toast.success('Tout lu', 'Toutes les notifications ont été lues');
  };

  const renderItem = ({ item }) => {
    const meta = NOTIF_META[item.type] || NOTIF_META.info;
    return (
      <TouchableOpacity
        onPress={() => !item.isRead && handleMarkAsRead(item._id)}
        activeOpacity={0.7}
        style={{ flexDirection: 'row', backgroundColor: item.isRead ? theme.backgroundCard : theme.colors.primaryAlpha, marginHorizontal: 20, marginBottom: 10, borderRadius: 14, borderWidth: 1, borderColor: item.isRead ? theme.border : theme.colors.primary, padding: 14 }}
      >
        <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: `${meta.color}15`, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
          <Icon name={meta.icon} size={20} color={meta.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: item.isRead ? theme.typography.fontFamily.medium : theme.typography.fontFamily.bold, fontSize: 14, color: theme.text }}>
            {item.title}
          </Text>
          <Text style={{ fontFamily: theme.typography.fontFamily.regular, fontSize: 12, color: theme.textSecondary, marginTop: 3, lineHeight: 18 }}>
            {item.message}
          </Text>
          <Text style={{ fontFamily: theme.typography.fontFamily.regular, fontSize: 11, color: theme.textSecondary, marginTop: 5, opacity: 0.7 }}>
            {new Date(item.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        {!item.isRead && (
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.primary, marginTop: 6 }} />
        )}
      </TouchableOpacity>
    );
  };

  const title = unreadCount > 0
    ? t('notifications.titleWithCount', { count: unreadCount })
    : t('notifications.title');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top']}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 }}>
        <Text style={{ fontFamily: theme.typography.fontFamily.extraBold, fontSize: 22, color: theme.text }}>
          {title}
        </Text>
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={handleMarkAllAsRead}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
          >
            <Icon name="check-all" size={16} color={theme.colors.primary} />
            <Text style={{ fontFamily: theme.typography.fontFamily.medium, fontSize: 13, color: theme.colors.primary }}>
              {t('notifications.markAllRead')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 80, gap: 12 }}>
            <Icon name="bell-off-outline" size={52} color={theme.border} />
            <Text style={{ fontFamily: theme.typography.fontFamily.medium, color: theme.textSecondary, fontSize: 15 }}>
              {t('notifications.noNotifications')}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default NotificationsScreen;
