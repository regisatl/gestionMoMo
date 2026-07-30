import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const STATUS_COLORS = {
  completed: { bg: '#DCFCE7', text: '#16A34A' },
  pending: { bg: '#FEF3C7', text: '#D97706' },
  processing: { bg: '#DBEAFE', text: '#2563EB' },
  failed: { bg: '#FEE2E2', text: '#DC2626' },
  cancelled: { bg: '#F3F4F6', text: '#6B7280' },
  active: { bg: '#DCFCE7', text: '#16A34A' },
  inactive: { bg: '#F3F4F6', text: '#6B7280' },
  suspended: { bg: '#FEE2E2', text: '#DC2626' },
};

const LABELS = {
  completed: 'Complété', pending: 'En attente', processing: 'En cours',
  failed: 'Échoué', cancelled: 'Annulé', active: 'Actif',
  inactive: 'Inactif', suspended: 'Suspendu',
};

const Badge = ({ status, label, style }) => {
  const theme = useTheme();
  const colors = STATUS_COLORS[status] || { bg: theme.surface, text: theme.textSecondary };
  const displayLabel = label || LABELS[status] || status;

  return (
    <View
      style={[
        {
          backgroundColor: colors.bg,
          borderRadius: theme.radius.full,
          paddingVertical: 3,
          paddingHorizontal: 10,
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      <Text
        style={{
          fontFamily: theme.typography.fontFamily.semiBold,
          fontSize: 11,
          color: colors.text,
          letterSpacing: 0.3,
        }}
      >
        {displayLabel}
      </Text>
    </View>
  );
};

export default Badge;
