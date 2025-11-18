import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

/**
 * EngramButton - A modern, reusable button for the Engram design system
 * Props:
 * - title: string (button label)
 * - onPress: function
 * - type: 'primary' | 'secondary' | 'danger' (default: 'primary')
 * - disabled: boolean
 */
export default function EngramButton({ title, onPress, type = 'primary', disabled = false }) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles[type],
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled}
    >
      <Text style={[styles.text, styles[`${type}Text`], disabled && styles.disabledText]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  primary: {
    backgroundColor: '#6C8F6E', // Sage green
  },
  secondary: {
    backgroundColor: '#F4F6F4',
    borderWidth: 1,
    borderColor: '#B0B8B4',
  },
  danger: {
    backgroundColor: '#E57373',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryText: {
    color: '#fff',
  },
  secondaryText: {
    color: '#6C8F6E',
  },
  dangerText: {
    color: '#fff',
  },
  disabledText: {
    color: '#B0B8B4',
  },
});
