import React from 'react';
import { Modal as RNModal, View, StyleSheet } from 'react-native';

export default function Modal({ visible, onRequestClose, children, style, ...props }) {
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onRequestClose}
      {...props}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, style]}>{children}</View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    minWidth: 280,
    maxWidth: '90%',
    elevation: 4,
  },
});
