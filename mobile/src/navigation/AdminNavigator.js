/**
 * AdminNavigator
 *
 * Stack navigator pour les écrans d'administration.
 * Accessible uniquement si user.role === 'super_admin'.
 *
 * Screens :
 *   AdminHome     — hub principal avec 3 cartes (Users, Merchants, Accounts)
 *   AdminUsers    — gestion utilisateurs
 *   AdminMerchants — gestion marchands
 *   AdminAccounts — gestion comptes MoMo
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminHomeScreen    from '../screens/admin/AdminHomeScreen';
import AdminUsersScreen   from '../screens/admin/AdminUsersScreen';
import AdminMerchantsScreen from '../screens/admin/AdminMerchantsScreen';
import AdminAccountsScreen  from '../screens/admin/AdminAccountsScreen';

const Stack = createNativeStackNavigator();

const AdminNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
    <Stack.Screen name="AdminHome"      component={AdminHomeScreen} />
    <Stack.Screen name="AdminUsers"     component={AdminUsersScreen} />
    <Stack.Screen name="AdminMerchants" component={AdminMerchantsScreen} />
    <Stack.Screen name="AdminAccounts"  component={AdminAccountsScreen} />
  </Stack.Navigator>
);

export default AdminNavigator;
