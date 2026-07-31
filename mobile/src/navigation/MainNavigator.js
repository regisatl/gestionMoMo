import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import Icon from '../components/ui/Icon';

// Screens
import HomeScreen from '../screens/home/HomeScreen';
import TransactionsScreen from '../screens/transactions/TransactionsScreen';
import TransactionDetailScreen from '../screens/transactions/TransactionDetailScreen';
import NewTransactionScreen from '../screens/transactions/NewTransactionScreen';
import ReportsScreen from '../screens/reports/ReportsScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TransactionsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="TransactionsList" component={TransactionsScreen} />
    <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
    <Stack.Screen name="NewTransaction" component={NewTransactionScreen} />
  </Stack.Navigator>
);

const MainNavigator = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { unreadCount } = useNotifications();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarLabelStyle: {
          fontFamily: theme.typography.fontFamily.medium,
          fontSize: 11,
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: t('nav.home'),
          tabBarIcon: ({ color, size }) => (
            <Icon name="home-variant-outline" size={size ?? 24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Transactions"
        component={TransactionsStack}
        options={{
          tabBarLabel: t('nav.transactions'),
          tabBarIcon: ({ color, size }) => (
            <Icon name="swap-horizontal" size={size ?? 24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{
          tabBarLabel: t('nav.reports'),
          tabBarIcon: ({ color, size }) => (
            <Icon name="chart-bar" size={size ?? 24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarLabel: t('nav.notifications'),
          tabBarIcon: ({ color, size }) => (
            <Icon name="bell-outline" size={size ?? 24} color={color} />
          ),
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: { backgroundColor: theme.colors.error, fontSize: 10 },
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: t('nav.profile'),
          tabBarIcon: ({ color, size }) => (
            <Icon name="account-circle-outline" size={size ?? 24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
