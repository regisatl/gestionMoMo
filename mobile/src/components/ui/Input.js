import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import Icon from './Icon';

const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  multiline = false,
  numberOfLines = 1,
  style,
  ...props
}) => {
  const theme = useTheme();
  const [focused, setFocused]       = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = secureTextEntry;

  return (
    <View style={[{ marginBottom: theme.spacing.md }, style]}>
      {label && (
        <Text
          style={{
            fontFamily: theme.typography.fontFamily.medium,
            fontSize: theme.typography.fontSize.sm,
            color: theme.textSecondary,
            marginBottom: 6,
          }}
        >
          {label}
        </Text>
      )}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.inputBackground,
          borderWidth: 1.5,
          borderColor: error
            ? theme.colors.error
            : focused
            ? theme.inputBorderFocused
            : theme.inputBorder,
          borderRadius: theme.radius.md,
          paddingHorizontal: theme.spacing.md,
          minHeight: multiline ? 90 : 50,
        }}
      >
        {leftIcon && <View style={{ marginRight: 10 }}>{leftIcon}</View>}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.placeholder}
          secureTextEntry={isPassword && !showPassword}
          keyboardType={keyboardType}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          multiline={multiline}
          numberOfLines={numberOfLines}
          style={{
            flex: 1,
            fontFamily: theme.typography.fontFamily.regular,
            fontSize: theme.typography.fontSize.base,
            color: theme.text,
            paddingVertical: 0,
          }}
          {...props}
        />

        {/* Bouton œil — champs password */}
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword((v) => !v)}
            activeOpacity={0.6}
            style={{ padding: 6, marginLeft: 4 }}
            accessibilityLabel={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          >
            <Icon
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={focused ? theme.inputBorderFocused : theme.textSecondary}
            />
          </TouchableOpacity>
        )}

        {/* Icône droite personnalisée (non password) */}
        {rightIcon && !isPassword && (
          <TouchableOpacity onPress={onRightIconPress} style={{ padding: 6, marginLeft: 4 }}>
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <Text
          style={{
            fontFamily: theme.typography.fontFamily.regular,
            fontSize: theme.typography.fontSize.xs,
            color: theme.colors.error,
            marginTop: 4,
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
};

export default Input;
