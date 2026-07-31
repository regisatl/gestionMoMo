/**
 * Icon wrapper — GestionMoMo
 * Uses react-native-vector-icons under the hood.
 * Provides a single <Icon> component used across the whole app.
 *
 * Libraries used:
 *   MaterialIcons         (family="material")
 *   MaterialCommunityIcons (family="community")  ← default
 */
import React from 'react';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const Icon = ({
  name,
  size = 24,
  color = '#000',
  family = 'community',
  style,
}) => {
  if (family === 'material') {
    return <MaterialIcons name={name} size={size} color={color} style={style} />;
  }
  return <MaterialCommunityIcons name={name} size={size} color={color} style={style} />;
};

export default Icon;
