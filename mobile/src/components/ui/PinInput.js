/**
 * PinInput — composant saisie code PIN à 5 chiffres
 * Affiche 5 cercles (remplis/vides) + clavier numérique personnalisé
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Vibration } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import Icon from './Icon';

const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', 'del'],
];

const PinInput = ({ value = '', onChange, maxLength = 5, error }) => {
  const theme = useTheme();

  const handlePress = (key) => {
    if (key === '') return;
    if (key === 'del') {
      onChange(value.slice(0, -1));
      return;
    }
    if (value.length >= maxLength) {
      Vibration.vibrate(80);
      return;
    }
    onChange(value + key);
  };

  return (
    <View style={styles.wrapper}>
      {/* Dots */}
      <View style={styles.dotsRow}>
        {Array.from({ length: maxLength }).map((_, i) => {
          const filled = i < value.length;
          return (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: filled
                    ? (error ? theme.colors.error : theme.colors.primary)
                    : 'transparent',
                  borderColor: error
                    ? theme.colors.error
                    : filled
                    ? theme.colors.primary
                    : theme.inputBorder,
                  borderWidth: 2,
                  transform: [{ scale: filled ? 1.1 : 1 }],
                },
              ]}
            />
          );
        })}
      </View>

      {/* Error */}
      {error ? (
        <Text
          style={{
            fontFamily: theme.typography.fontFamily.regular,
            fontSize: 12,
            color: theme.colors.error,
            textAlign: 'center',
            marginTop: 8,
            marginBottom: 4,
          }}
        >
          {error}
        </Text>
      ) : (
        <View style={{ height: 24 }} />
      )}

      {/* Keypad */}
      <View style={styles.keypad}>
        {KEYS.map((row, ri) => (
          <View key={ri} style={styles.row}>
            {row.map((key) => {
              if (key === '') {
                return <View key="empty" style={styles.keyEmpty} />;
              }
              const isDel = key === 'del';
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => handlePress(key)}
                  activeOpacity={0.65}
                  style={[
                    styles.key,
                    {
                      backgroundColor: isDel ? 'transparent' : theme.surface,
                      borderWidth: isDel ? 0 : 1,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  {isDel ? (
                    <Icon name="backspace-outline" size={22} color={theme.textSecondary} />
                  ) : (
                    <Text
                      style={{
                        fontFamily: theme.typography.fontFamily.semiBold,
                        fontSize: 22,
                        color: theme.text,
                      }}
                    >
                      {key}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    width: '100%',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 4,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  keypad: {
    width: '100%',
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  key: {
    width: 78,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyEmpty: {
    width: 78,
    height: 64,
  },
});

export default PinInput;
