import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Header({ title, subtitle, right, style }) {
  return (
    <View style={[styles.header, style]}>
      <View>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {right && <View>{right}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#F6F8F7',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#6B8E7D',
  },
  subtitle: {
    fontSize: 14,
    color: '#9BB092',
    marginTop: 2,
  },
});
