import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';

const NOTIF_ICONS = { success: '✓', error: '✕', warning: '!', info: 'ℹ', transaction: '↔', system: '⚙' };
const NOTIF_COLORS = {
  success: '#16A34A', error: '#DC2626', warning: '#D97706',
  info: '#0284C7', transaction: '#0A66C2', system: '#6B7280',
};

const NotificationsScreen = () => {
  const theme = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => !item.isRead && markAsRead(item._id)}
      style={{
        flexDirection: 'row',
        backgroundColor: item.isRead ? theme.backgroundCard : theme.colors.primaryAlpha,
        marginHorizontal: theme.spacing.base,
        marginBottom: theme.spacing.sm,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: item.isRead ? theme.border : theme.colors.primary,
        padding: theme.spacing.md,
      }}
    >
      <View style={{
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: `${NOTIF_COLORS[item.type] || theme.colors.primary}18`,
        alignItems: 'center', justifyContent: 'center', marginRight: 12,
      }}>
        <Text style={{ fontSize: 16, color: NOTIF_COLORS[item.type] || theme.colors.primary }}>
          {NOTIF_ICONS[item.type] || 'ℹ'}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: item.isRead ? theme.typography.fontFamily.medium : theme.typography.fontFamily.bold, fontSize: 14, color: theme.text }}>
          {item.title}
        </Text>
        <Text style={{ fontFamily: theme.typography.fontFamily.regular, fontSize: 12, color: theme.textSecondary, marginTop: 3 }}>
          {item.message}
        </Text>
        <Text style={{ fontFamily: theme.typography.fontFamily.regular, fontSize: 11, color: theme.textSecondary, marginTop: 4, opacity: 0.7 }}>
          {new Date(item.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      {!item.isRead && (
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.primary, marginTop: 4 }} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top']}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: theme.spacing.base }}>
        <Text style={{ fontFamily: theme.typography.fontFamily.extraBold, fontSize: theme.typography.fontSize.xl, color: theme.text }}>
          Notifications {unreadCount > 0 && `(${unreadCount})`}
        </Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={{ fontFamily: theme.typography.fontFamily.medium, fontSize: 13, color: theme.colors.primary }}>
              Tout lire
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
          <View style={{ alignItems: 'center', paddingTop: 80 }}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>🔔</Text>
            <Text style={{ fontFamily: theme.typography.fontFamily.medium, color: theme.textSecondary, fontSize: 15 }}>
              Aucune notification
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default NotificationsScreen;
