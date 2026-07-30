import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import DashboardLayout from './components/layout/DashboardLayout';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import MerchantsPage from './pages/MerchantsPage';
import ReportsPage from './pages/ReportsPage';
import NotificationsPage from './pages/NotificationsPage';
import AuditPage from './pages/AuditPage';
import SettingsPage from './pages/SettingsPage';

// Route protégée
const ProtectedRoute = ({ children, roles }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font)', color: 'var(--text-secondary)' }}>Chargement...</div>;
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
        <ProtectedRoute>
          <DashboardLayout><div style={{ fontFamily: 'var(--font)', color: 'var(--text-secondary)' }}>Comptes — À implémenter</div></DashboardLayout>
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
          <DashboardLayout><div style={{ fontFamily: 'var(--font)', color: 'var(--text-secondary)' }}>Utilisateurs — À implémenter</div></DashboardLayout>
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
  <ThemeProvider>
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
