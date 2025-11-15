import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, Image, TouchableOpacity, ScrollView, Linking } from 'react-native';
import PropTypes from 'prop-types';
import { useTheme } from '../providers/ThemeProvider';
import { PhotoViewer } from '../components/PhotoViewer';

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const now = new Date();
  const target = new Date(dateStr);
  if (isNaN(target.getTime())) return null;
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export const ProductDetailScreen = ({ route, navigation }) => {
  const { colors } = useTheme();
  const { product } = route.params || {};

  const remaining = useMemo(() => daysUntil(product?.warranty), [product?.warranty]);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const openViewer = (idx) => {
    setViewerIndex(idx);
    setViewerVisible(true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>{product?.name || 'Product'}</Text>
          <TouchableOpacity style={[styles.editButton, { backgroundColor: colors.primary }]} onPress={() => navigation.goBack()}>
            <Text style={styles.editText}>Back</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.meta}>
          {product?.category ? (
            <Text style={[styles.metaText, { color: colors.text }]}>📦 Category: {product.category}</Text>
          ) : null}
          {product?.room ? (
            <Text style={[styles.metaText, { color: colors.text }]}>🏠 Room: {product.room}</Text>
          ) : null}
          {product?.barcode ? (
            <Text style={[styles.metaText, { color: colors.text }]}>🔢 Barcode: {product.barcode}</Text>
          ) : null}
          {product?.warranty ? (
            <Text style={[styles.metaText, { color: colors.text }]}>📅 Warranty until: {product.warranty}{remaining != null ? `  (in ${remaining} days)` : ''}</Text>
          ) : null}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.accent }]}
            onPress={() => navigation.navigate('UpgradeFinder', { productId: product?.id })}
          >
            <Text style={styles.actionIcon}>🔍</Text>
            <Text style={styles.actionButtonText}>Find Upgrade</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('ManualLookup', { productId: product?.id, product })}
          >
            <Text style={styles.actionIcon}>📖</Text>
            <Text style={styles.actionButtonText}>Find Manual</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
            onPress={() => navigation.navigate('Transfer', { product })}
          >
            <Text style={styles.actionIcon}>🔗</Text>
            <Text style={styles.actionButtonText}>Transfer Product</Text>
          </TouchableOpacity>
        </View>

        {/* Care & Cleaning Section */}
        {(product?.careInstructions || product?.isDishwasherSafe || product?.cleaningTips) ? (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>🧼 Care & Cleaning</Text>
            <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {product?.isDishwasherSafe ? (
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.text }]}>Dishwasher Safe:</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{product.isDishwasherSafe}</Text>
                </View>
              ) : null}
              {product?.careInstructions ? (
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.text }]}>Care Instructions:</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{product.careInstructions}</Text>
                </View>
              ) : null}
              {product?.cleaningTips ? (
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.text }]}>Cleaning Tips:</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{product.cleaningTips}</Text>
                </View>
              ) : null}
            </View>
          </>
        ) : null}

        {/* Usage & Specs Section */}
        {(product?.usageNotes || product?.specifications) ? (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>📋 Usage & Specifications</Text>
            <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {product?.usageNotes ? (
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.text }]}>Usage Notes:</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{product.usageNotes}</Text>
                </View>
              ) : null}
              {product?.specifications ? (
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.text }]}>Specifications:</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{product.specifications}</Text>
                </View>
              ) : null}
            </View>
          </>
        ) : null}

        {/* Manual Section */}
        {product?.manualUrl ? (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>📖 Manual & Instructions</Text>
            <TouchableOpacity 
              style={[styles.manualButton, { backgroundColor: colors.primary }]}
              onPress={() => Linking.openURL(product.manualUrl).catch(() => {})}
            >
              <Text style={styles.manualButtonText}>Open Manual/Instructions</Text>
            </TouchableOpacity>
          </>
        ) : null}

        <Text style={[styles.sectionTitle, { color: colors.text }]}>📸 Photos</Text>
        {product?.photos?.length ? (
          <FlatList
            data={product.photos}
            horizontal
            keyExtractor={(uri, idx) => `${uri}-${idx}`}
            contentContainerStyle={styles.photosRow}
            renderItem={({ item, index }) => (
              <TouchableOpacity onPress={() => openViewer(index)}>
                <Image source={{ uri: item }} style={styles.photo} />
              </TouchableOpacity>
            )}
          />
        ) : (
          <Text style={{ color: colors.border, marginHorizontal: 20 }}>No photos</Text>
        )}
        <PhotoViewer visible={viewerVisible} photos={product?.photos} initialIndex={viewerIndex} onClose={() => setViewerVisible(false)} />
      </ScrollView>
    </SafeAreaView>
  );
};

ProductDetailScreen.propTypes = {
  route: PropTypes.shape({
    params: PropTypes.shape({ product: PropTypes.object })
  }).isRequired,
  navigation: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
  }).isRequired,
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  title: { fontSize: 24, fontWeight: 'bold', flex: 1 },
  editButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  editText: { color: '#fff', fontWeight: 'bold' },
  meta: { paddingHorizontal: 20, paddingBottom: 10 },
  metaText: { marginVertical: 4, fontSize: 14 },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    fontSize: 20,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  sectionTitle: { marginTop: 20, marginBottom: 10, marginHorizontal: 20, fontSize: 18, fontWeight: 'bold' },
  infoCard: {
    marginHorizontal: 20,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  infoRow: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    lineHeight: 20,
  },
  manualButton: {
    marginHorizontal: 20,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  manualButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  photosRow: { paddingHorizontal: 16, paddingVertical: 10 },
  photo: { width: 140, height: 140, borderRadius: 8, marginRight: 10, backgroundColor: '#222' },
});


