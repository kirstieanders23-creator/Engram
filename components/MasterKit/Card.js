
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';

export default function Card({ children, style, ...props }) {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.card, { backgroundColor: colors.card }, style]}
      accessibilityRole="summary"
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
});
