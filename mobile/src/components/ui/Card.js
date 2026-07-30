import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const Card = ({ children, style, elevated = true, padding = true }) => {
  const theme = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: theme.backgroundCard,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: theme.border,
          ...(padding && { padding: theme.spacing.base }),
          ...(elevated && theme.shadows.md),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

export default Card;
