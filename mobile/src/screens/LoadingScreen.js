import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const LoadingScreen = () => {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={{ marginTop: 16, fontFamily: theme.typography.fontFamily.medium, color: theme.textSecondary, fontSize: 14 }}>
        Chargement...
      </Text>
    </View>
  );
};

export default LoadingScreen;
