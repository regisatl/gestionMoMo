/**
 * ScreenWrapper
 *
 * Drop-in replacement for SafeAreaView that automatically adds
 * the animated PlexusBackground behind all screen content.
 *
 * Usage:
 *   <ScreenWrapper edges={['top','bottom']}>
 *     ...screen content...
 *   </ScreenWrapper>
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import PlexusBackground from './PlexusBackground';

const ScreenWrapper = ({ children, edges, style, safeAreaStyle }) => {
  const theme = useTheme();

  return (
    <SafeAreaView
      style={[
        styles.root,
        { backgroundColor: theme.background },
        safeAreaStyle,
      ]}
      edges={edges}
    >
      {/* Plexus sits at z-index 0, behind everything */}
      <PlexusBackground />

      {/* Content at z-index 1, on top */}
      <View style={[styles.content, style]}>
        {children}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
});

export default ScreenWrapper;
