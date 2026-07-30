import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

/**
 * Bouton principal GestionMoMo
 * Variants: primary | secondary | outline | ghost | danger
 */
const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon = null,
  iconPosition = 'left',
  fullWidth = false,
  style,
  textStyle,
}) => {
  const theme = useTheme();
  const styles = makeStyles(theme);

  const variantStyles = {
    primary: {
      container: { backgroundColor: theme.colors.primary },
      text: { color: '#FFFFFF' },
    },
    secondary: {
      container: { backgroundColor: theme.surface },
      text: { color: theme.text },
    },
    outline: {
      container: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: theme.colors.primary },
      text: { color: theme.colors.primary },
    },
    ghost: {
      container: { backgroundColor: 'transparent' },
      text: { color: theme.colors.primary },
    },
    danger: {
      container: { backgroundColor: theme.colors.error },
      text: { color: '#FFFFFF' },
    },
  };

  const sizeStyles = {
    sm: { container: { paddingVertical: 8, paddingHorizontal: 14 }, text: { fontSize: 13 } },
    md: { container: { paddingVertical: 13, paddingHorizontal: 20 }, text: { fontSize: 15 } },
    lg: { container: { paddingVertical: 16, paddingHorizontal: 28 }, text: { fontSize: 17 } },
  };

  const isDisabled = disabled || loading;
  const vStyle = variantStyles[variant] || variantStyles.primary;
  const sStyle = sizeStyles[size] || sizeStyles.md;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={[
        styles.base,
        vStyle.container,
        sStyle.container,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? theme.colors.primary : '#FFF'} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
          <Text style={[styles.text, vStyle.text, sStyle.text, textStyle]}>{title}</Text>
          {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

const makeStyles = (theme) =>
  StyleSheet.create({
    base: {
      borderRadius: theme.radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    },
    fullWidth: { width: '100%' },
    disabled: { opacity: 0.5 },
    content: { flexDirection: 'row', alignItems: 'center' },
    text: {
      fontFamily: theme.typography.fontFamily.semiBold,
      letterSpacing: 0.3,
    },
    iconLeft: { marginRight: 8 },
    iconRight: { marginLeft: 8 },
  });

export default Button;
