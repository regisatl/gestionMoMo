/**
 * ModalWrapper
 *
 * Reusable modal container with animated PlexusBackground behind content.
 * Replaces the raw React Native <Modal> + overlay <View> pattern used across
 * the app.
 *
 * Usage:
 *   <ModalWrapper visible={show} onClose={() => setShow(false)}>
 *     <View>...modal content...</View>
 *   </ModalWrapper>
 *
 * Props:
 *   visible       boolean   — controls modal visibility
 *   onClose       function  — called when backdrop is pressed
 *   children      node      — modal card content
 *   width         number    — card width (default 300)
 *   style         object    — extra style applied to the card View
 */

import React from 'react';
import { Modal, TouchableOpacity, View, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import PlexusBackground from './PlexusBackground';

const { width: SCREEN_W } = Dimensions.get('window');

const ModalWrapper = ({
  visible,
  onClose,
  children,
  width = 300,
  style,
}) => {
  const theme = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Full-screen backdrop — tap to close */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        {/* Plexus rendered inside the full-screen overlay */}
        <PlexusBackground />

        {/* Card — stop propagation so tapping card doesn't close */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {}} // swallow touch
          style={[
            styles.card,
            {
              width,
              backgroundColor: theme.backgroundCard,
              borderColor: theme.border,
              borderRadius: theme.radius.xl,
            },
            style,
          ]}
        >
          {children}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.50)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    overflow: 'hidden',
    borderWidth: 1,
    zIndex: 2,
  },
});

export default ModalWrapper;
