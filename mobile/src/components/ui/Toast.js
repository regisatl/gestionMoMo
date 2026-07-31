/**
 * Toast system — GestionMoMo Mobile
 *
 * Position : bas de l'écran, centré horizontalement.
 * Animation : slide-up + fade in, slide-down + fade out.
 * Style     : pill avec icône vecteur, fond coloré semi-transparent.
 *
 * Usage : <ToastContainer /> dans App.js (déjà en place).
 * Pour déclencher un toast depuis n'importe quel screen :
 *   const { addToast } = useToast();
 *   addToast({ type: 'success', title: 'Créé !', message: 'Ref: XYZ' });
 */
import React, { useEffect, useRef } from 'react';
import {
  View, Text, Animated, TouchableOpacity,
  StyleSheet, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import Icon from './Icon';

/* ─── couleurs par type ─────────────────────────────── */
const TYPE_CONFIG = {
  success:     { bg: '#16A34A', icon: 'check-circle-outline',    label: 'Succès' },
  error:       { bg: '#DC2626', icon: 'close-circle-outline',    label: 'Erreur' },
  warning:     { bg: '#D97706', icon: 'alert-circle-outline',    label: 'Attention' },
  info:        { bg: '#0284C7', icon: 'information-outline',     label: 'Info' },
  transaction: { bg: '#0A66C2', icon: 'swap-horizontal',         label: 'Transaction' },
};

/* ─── single toast item ─────────────────────────────── */
const ToastItem = ({ toast, onDismiss, index, total }) => {
  const theme  = useTheme();
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(40)).current;
  const scale      = useRef(new Animated.Value(0.92)).current;

  const config = TYPE_CONFIG[toast.type] || TYPE_CONFIG.info;

  /* mount — slide up */
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1, duration: 260, useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0, tension: 90, friction: 10, useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1, tension: 90, friction: 10, useNativeDriver: true,
      }),
    ]).start();
  }, []);

  /* dismiss — slide down */
  const dismiss = () => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 40, duration: 200, useNativeDriver: true }),
    ]).start(() => onDismiss(toast.id));
  };

  /* stacking: les toasts plus anciens sont légèrement plus petits et remontés */
  const stackOffset = (total - 1 - index) * 8;

  return (
    <Animated.View
      style={[
        styles.pill,
        {
          backgroundColor: config.bg,
          opacity,
          transform: [
            { translateY: Animated.add(translateY, new Animated.Value(-stackOffset)) },
            { scale },
          ],
          marginBottom: 8,
          zIndex: index + 1,
        },
      ]}
    >
      {/* icône */}
      <View style={styles.iconWrap}>
        <Icon name={config.icon} size={18} color="#FFF" />
      </View>

      {/* texte */}
      <View style={styles.textWrap}>
        <Text style={styles.title} numberOfLines={1}>
          {toast.title}
        </Text>
        {!!toast.message && (
          <Text style={styles.message} numberOfLines={2}>
            {toast.message}
          </Text>
        )}
      </View>

      {/* fermer */}
      <TouchableOpacity onPress={dismiss} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Icon name="close" size={14} color="rgba(255,255,255,0.8)" />
      </TouchableOpacity>
    </Animated.View>
  );
};

/* ─── container (racine de l'app) ──────────────────── */
const ToastContainer = () => {
  const { toasts, dismissToast } = useNotifications();
  const insets = useSafeAreaInsets();

  if (!toasts.length) return null;

  /* n'affiche que les 3 derniers pour éviter l'empilement excessif */
  const visible = toasts.slice(-3);

  return (
    <View
      style={[
        styles.container,
        { bottom: insets.bottom + 16 },
      ]}
      pointerEvents="box-none"
    >
      {visible.map((toast, index) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={dismissToast}
          index={index}
          total={visible.length}
        />
      ))}
    </View>
  );
};

/* ─── styles ────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 24,
    right: 24,
    alignItems: 'center',
    zIndex: 9999,
    elevation: 20,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    width: '100%',
    /* subtle inner shadow on Android via elevation */
    elevation: 8,
    /* iOS shadow */
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    flexShrink: 0,
  },
  textWrap: {
    flex: 1,
    marginRight: 6,
  },
  title: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 13,
    color: '#FFF',
    letterSpacing: 0.1,
  },
  message: {
    fontFamily: 'Manrope-Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.88)',
    marginTop: 2,
    lineHeight: 17,
  },
  closeBtn: {
    padding: 2,
    flexShrink: 0,
  },
});

export default ToastContainer;
