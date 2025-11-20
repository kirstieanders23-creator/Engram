
import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, Linking, useWindowDimensions } from 'react-native';
import PropTypes from 'prop-types';
import { useTheme } from '../providers/ThemeProvider';

// Quick view modal for showing product info without editing
export const QuickView = ({ visible, product, onClose, onEdit, colors: propColors }) => {
  const { colors } = useTheme();
  const { fontScale } = useWindowDimensions();
  const themeColors = propColors || colors;
  if (!product) return null;

  const openManual = () => {
    if (product.manualUrl) {
      Linking.openURL(product.manualUrl).catch(() => {});
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: themeColors.background }]} accessibilityViewIsModal accessible accessibilityLabel="Product Quick View Modal">
          <View style={styles.header}>
            <Text style={[styles.title, { color: themeColors.text, fontSize: 22 * fontScale }]} accessibilityRole="header">{product.name}</Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Close quick view">
              <Text style={[styles.closeButton, { color: themeColors.text }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Basic Info */}
            <View style={[styles.section, { borderBottomColor: themeColors.border }]}
              accessible accessibilityLabel="Product basic info section">
              {product.category && (
                <Text style={[styles.infoText, { color: themeColors.text, fontSize: 15 * fontScale }]}>📦 <Text style={styles.label}>Category:</Text> {product.category}</Text>
              )}
              {product.room && (
                <Text style={[styles.infoText, { color: themeColors.text, fontSize: 15 * fontScale }]}>🏠 <Text style={styles.label}>Room:</Text> {product.room}</Text>
              )}
              {product.warranty && (
                <Text style={[styles.infoText, { color: themeColors.text, fontSize: 15 * fontScale }]}>📅 <Text style={styles.label}>Warranty:</Text> {product.warranty}</Text>
              )}
            </View>

            {/* Care & Cleaning - Most Important */}
            {(product.isDishwasherSafe || product.careInstructions || product.cleaningTips) && (
              <View style={[styles.section, { borderBottomColor: themeColors.border }]} accessible accessibilityLabel="Care and cleaning section">
                <Text style={[styles.sectionTitle, { color: themeColors.primary }]}>🧼 Care & Cleaning</Text>
                {product.isDishwasherSafe && (
                  <Text style={[styles.infoText, { color: themeColors.text, fontSize: 15 * fontScale }]}><Text style={styles.label}>Dishwasher:</Text> {product.isDishwasherSafe}</Text>
                )}
                {product.careInstructions && (
                  <Text style={[styles.infoText, { color: themeColors.text, fontSize: 15 * fontScale }]}><Text style={styles.label}>Care:</Text> {product.careInstructions}</Text>
                )}
                {product.cleaningTips && (
                  <Text style={[styles.infoText, { color: themeColors.text, fontSize: 15 * fontScale }]}><Text style={styles.label}>Tips:</Text> {product.cleaningTips}</Text>
                )}
              </View>
            )}

            {/* Usage & Specs */}
            {(product.usageNotes || product.specifications) && (
              <View style={[styles.section, { borderBottomColor: themeColors.border }]} accessible accessibilityLabel="Usage and specs section">
                <Text style={[styles.sectionTitle, { color: themeColors.primary }]}>📋 Usage & Specs</Text>
                {product.usageNotes && (
                  <Text style={[styles.infoText, { color: themeColors.text, fontSize: 15 * fontScale }]}><Text style={styles.label}>Usage:</Text> {product.usageNotes}</Text>
                )}
                {product.specifications && (
                  <Text style={[styles.infoText, { color: themeColors.text, fontSize: 15 * fontScale }]}><Text style={styles.label}>Specs:</Text> {product.specifications}</Text>
                )}
              </View>
            )}

            {/* Manual Link */}
            {product.manualUrl && (
              <TouchableOpacity 
                style={[styles.manualButton, { backgroundColor: themeColors.primary }]}
                onPress={openManual}
                accessibilityLabel="Open manual or instructions"
              >
                <Text style={styles.manualButtonText}>📖 Open Manual/Instructions</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.button, styles.closeBtn, { backgroundColor: themeColors.secondary || '#666' }]}
              onPress={onClose}
              accessibilityLabel="Close quick view"
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.editBtn, { backgroundColor: themeColors.primary }]}
              onPress={() => { onClose(); onEdit(product); }}
              accessibilityLabel="Edit product details"
            >
              <Text style={styles.buttonText}>Edit Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

QuickView.propTypes = {
  visible: PropTypes.bool.isRequired,
  product: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  colors: PropTypes.object.isRequired,
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    maxHeight: '80%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  content: {
    paddingHorizontal: 20,
  },
  section: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 8,
  },
  label: {
    fontWeight: '600',
  },
  manualButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 15,
  },
  manualButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 15,
    gap: 10,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
