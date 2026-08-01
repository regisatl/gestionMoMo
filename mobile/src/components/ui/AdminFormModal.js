/**
 * AdminFormModal
 *
 * Modal de formulaire réutilisable pour les écrans admin.
 * Wraps ModalWrapper avec un titre, bouton fermer, et scroll si le
 * contenu dépasse la hauteur de l'écran.
 *
 * Props:
 *   visible   boolean   — visibilité
 *   onClose   function  — fermer
 *   title     string    — titre du modal
 *   children  node      — contenu (champs du formulaire)
 */

import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, StyleSheet, Dimensions,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import ModalWrapper from './ModalWrapper';
import Icon from './Icon';

const { height: SCREEN_H } = Dimensions.get('window');

const AdminFormModal = ({ visible, onClose, title, children }) => {
  const theme = useTheme();

  return (
    <ModalWrapper visible={visible} onClose={onClose} width={Math.min(380, Dimensions.get('window').width - 40)}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ── Header ── */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Text style={{
            fontFamily: theme.typography.fontFamily.bold,
            fontSize: theme.typography.fontSize.md,
            color: theme.text,
            flex: 1,
          }}>
            {title}
          </Text>
          <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.surface }]} activeOpacity={0.7}>
            <Icon name="close" size={18} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* ── Body ── */}
        <ScrollView
          style={{ maxHeight: SCREEN_H * 0.65 }}
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </ModalWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  body: {
    padding: 18,
    paddingBottom: 24,
  },
});

export default AdminFormModal;
