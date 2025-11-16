import React, { useEffect } from 'react';
import { Animated, Text, StyleSheet, View, Platform } from 'react-native';

export const Banner = ({ visible, message, onHide, duration = 3000, type = 'info' }) => {
  const translateY = React.useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(translateY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
      const timer = setTimeout(() => {
        Animated.timing(translateY, {
          toValue: -100,
          duration: 250,
          useNativeDriver: true,
        }).start(() => onHide && onHide());
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.banner, styles[type], { transform: [{ translateY }] }]}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
    >
      <Text style={styles.bannerText}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 48 : 24,
    left: 0,
    right: 0,
    marginHorizontal: 0,
    padding: 16,
    borderRadius: 0,
    backgroundColor: '#333',
    zIndex: 1000,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  info: {
    backgroundColor: '#333',
  },
  success: {
    backgroundColor: '#4e8d7c',
  },
  error: {
    backgroundColor: '#c0392b',
  },
  bannerText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default Banner;
