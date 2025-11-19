import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, useColorScheme } from 'react-native';
import PropTypes from 'prop-types';
import LinearGradient from 'react-native-linear-gradient';


export default function Header({
  title,
  subtitle,
  left,
  right,
  style,
  onPressLeft,
  onPressRight,
  icon,
  backgroundGradient,
  ...props
}) {
  const colorScheme = useColorScheme();
  // Default gradients for light/dark
  const gradients = backgroundGradient ||
    (colorScheme === 'dark'
      ? ['#233329', '#3a4d3f']
      : ['#e6f2e6', '#F6F8F7']);

  return (
    <LinearGradient colors={gradients} style={[styles.container, style]} {...props}>
      {icon ? (
        <View style={styles.iconWrap} accessible accessibilityLabel="App icon">
          {typeof icon === 'string' ? (
            <Image source={{ uri: icon }} style={styles.iconImg} />
          ) : (
            icon
          )}
        </View>
      ) : left ? (
        <TouchableOpacity
          style={styles.side}
          onPress={onPressLeft}
          accessibilityLabel="Left action"
        >
          {left}
        </TouchableOpacity>
      ) : (
        <View style={styles.side} />
      )}
      <View style={styles.center}>
        <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? (
        <TouchableOpacity
          style={styles.side}
          onPress={onPressRight}
          accessibilityLabel="Right action"
        >
          {right}
        </TouchableOpacity>
      ) : (
        <View style={styles.side} />
      )}
    </LinearGradient>
  );
}

Header.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  left: PropTypes.node,
  right: PropTypes.node,
  style: PropTypes.object,
  onPressLeft: PropTypes.func,
  onPressRight: PropTypes.func,
  icon: PropTypes.oneOfType([PropTypes.node, PropTypes.string]),
  backgroundGradient: PropTypes.arrayOf(PropTypes.string),
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 18,
    minHeight: 64,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E4E2',
  },
  iconWrap: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconImg: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  side: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D3A35',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13,
    color: '#6B8E7D',
    marginTop: 2,
    fontWeight: '400',
  },
});