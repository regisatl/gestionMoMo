import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';

const TOAST_COLORS = {
  success: { bg: '#DCFCE7', border: '#16A34A', text: '#14532D' },
  error: { bg: '#FEE2E2', border: '#DC2626', text: '#7F1D1D' },
  warning: { bg: '#FEF3C7', border: '#D97706', text: '#78350F' },
  info: { bg: '#E0F2FE', border: '#0284C7', text: '#0C4A6E' },
  transaction: { bg: '#EFF6FF', border: '#0A66C2', text: '#1E3A5F' },
};

const TOAST_ICONS = { success: '✓', error: '✕', warning: '!', info: 'i', transaction: '↔' };

const ToastItem = ({ toast, onDismiss }) => {
  const theme = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  const typeColors = TOAST_COLORS[toast.type] || TOAST_COLORS.info;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, tension: 80, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -20, duration: 150, useNativeDriver: true }),
    ]).start(() => onDismiss(toast.id));
  };

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ translateY }],
        backgroundColor: typeColors.bg,
        borderLeftWidth: 4,
        borderLeftColor: typeColors.border,
        borderRadius: theme.radius.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.sm,
        flexDirection: 'row',
        alignItems: 'flex-start',
        ...theme.shadows.md,
      }}
    >
      <View
        style={{
          width: 24, height: 24, borderRadius: 12,
          backgroundColor: typeColors.border,
          alignItems: 'center', justifyContent: 'center',
          marginRight: 10,
        }}
      >
        <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>
          {TOAST_ICONS[toast.type] || 'i'}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: theme.typography.fontFamily.semiBold, fontSize: 13, color: typeColors.text }}>
          {toast.title}
        </Text>
        {toast.message && (
          <Text style={{ fontFamily: theme.typography.fontFamily.regular, fontSize: 12, color: typeColors.text, marginTop: 2, opacity: 0.85 }}>
            {toast.message}
          </Text>
        )}
      </View>
      <TouchableOpacity onPress={dismiss} style={{ padding: 2, marginLeft: 8 }}>
        <Text style={{ fontSize: 16, color: typeColors.text, opacity: 0.6 }}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

/**
 * Conteneur de toasts — à placer dans le layout racine
 */
const ToastContainer = () => {
  const { toasts, dismissToast } = useNotifications();
  const theme = useTheme();

  if (!toasts.length) return null;

  return (
    <View
      style={{
        position: 'absolute',
        top: 60,
        left: theme.spacing.base,
        right: theme.spacing.base,
        zIndex: 9999,
      }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </View>
  );
};

export default ToastContainer;
