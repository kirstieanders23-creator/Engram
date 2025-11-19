import React from 'react';
import { TextInput, StyleSheet, View } from 'react-native';

export default function Input({ value, onChangeText, placeholder, style, left, right, ...props }) {
  return (
    <View style={styles.inputWrapper}>
      {left && <View style={styles.icon}>{left}</View>}
      <TextInput
        style={[styles.input, style]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9BB092"
        {...props}
      />
      {right && <View style={styles.icon}>{right}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F8F7',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginVertical: 6,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 10,
    backgroundColor: 'transparent',
  },
  icon: {
    marginHorizontal: 4,
  },
});
