import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import DashboardLayout from './components/layout/DashboardLayout';
import Loader from './components/ui/Loader';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import MerchantsPage from './pages/MerchantsPage';
import ReportsPage from './pages/ReportsPage';
import NotificationsPage from './pages/NotificationsPage';
import AuditPage from './pages/AuditPage';
import SettingsPage from './pages/SettingsPage';
import UsersPage from './pages/UsersPage';
import AccountsPage from './pages/AccountsPage';

// Route protégée
const ProtectedRoute = ({ children, roles }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <Loader message="loader.session" overlay />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />

      {/* Dashboard routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <DashboardLayout><DashboardPage /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/transactions" element={
        <ProtectedRoute>
          <DashboardLayout><TransactionsPage /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/accounts" element={
        <ProtectedRoute roles={['super_admin']}>
          <DashboardLayout><AccountsPage /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/reports" element={
        <ProtectedRoute roles={['super_admin', 'merchant']}>
          <DashboardLayout><ReportsPage /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/merchants" element={
        <ProtectedRoute roles={['super_admin']}>
          <DashboardLayout><MerchantsPage /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/users" element={
        <ProtectedRoute roles={['super_admin']}>
          <DashboardLayout><UsersPage /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/notifications" element={
        <ProtectedRoute>
          <DashboardLayout><NotificationsPage /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/audit" element={
        <ProtectedRoute roles={['super_admin']}>
          <DashboardLayout><AuditPage /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <DashboardLayout><SettingsPage /></DashboardLayout>
        </ProtectedRoute>
      } />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => (
  <I18nextProvider i18n={i18n}>
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  </I18nextProvider>
);

export default App;
