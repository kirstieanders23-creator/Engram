
import React, { useEffect } from 'react';
import { Animated, Text, StyleSheet, View, Platform, useWindowDimensions } from 'react-native';
import { useTheme } from '../providers/ThemeProvider';

export const Toast = ({ visible, message, onHide, duration = 2000, type = 'info' }) => {
  const opacity = React.useRef(new Animated.Value(0)).current;
  const { colors } = useTheme();
  const { fontScale } = useWindowDimensions();

  useEffect(() => {
    if (visible) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
      const timer = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => onHide && onHide());
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  // Choose background color based on type and theme
  const backgroundColor =
    type === 'success' ? colors.success || '#4e8d7c'
    : type === 'error' ? colors.error || '#c0392b'
    : colors.card || '#222';

  return (
    <Animated.View
      style={[styles.toast, { backgroundColor, opacity }]}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      accessible
      accessibilityLabel={`Toast: ${message}`}
    >
      <Text style={[styles.toastText, { color: colors.textOnPrimary || '#fff', fontSize: 15 * fontScale }]} allowFontScaling>
        {message}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 48 : 24,
    left: 24,
    right: 24,
    padding: 16,
    borderRadius: 12,
    zIndex: 1000,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  toastText: {
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default Toast;
