import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function ListItem({ title, subtitle, checked, onPress, right, style }) {
  return (
    <TouchableOpacity style={[styles.item, style]} onPress={onPress}>
      <View style={styles.left}>
        <View style={[styles.checkbox, checked && styles.checked]} />
        <View>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
      {right && <View style={styles.right}>{right}</View>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginVertical: 5,
    elevation: 1,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#6B8E7D',
    marginRight: 12,
    backgroundColor: '#fff',
  },
  checked: {
    backgroundColor: '#6B8E7D',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  subtitle: {
    fontSize: 13,
    color: '#9BB092',
  },
  right: {
    marginLeft: 10,
  },
});
