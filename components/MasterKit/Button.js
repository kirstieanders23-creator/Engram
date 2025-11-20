
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';

export default function Button({ title, onPress, style, loading, icon, accessibilityLabel, ...props }) {
  const { colors } = useTheme();
  const { fontScale } = useWindowDimensions();
  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: colors.accent }, style]}
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      {...props}
    >
      {icon && <>{icon}</>}
      {loading
        ? <ActivityIndicator color={colors.textOnPrimary || '#fff'} />
        : <Text style={[styles.text, { color: colors.textOnPrimary || '#fff', fontSize: 16 * fontScale }]} allowFontScaling>{title}</Text>
      }
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    flexDirection: 'row',
    marginVertical: 6,
  },
  text: {
    fontWeight: '600',
    marginLeft: 8,
  },
});
