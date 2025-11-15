import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../providers/ThemeProvider';
import { useDatabase } from '../providers/DatabaseProvider';
import { getTransferData, claimTransfer } from '../utils/transfer-generator';

/**
 * Receive Transfer Screen - View and claim transferred products
 * "Carfax for Homes" buyer view
 */

export const ReceiveTransferScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { addProduct } = useDatabase();
  const transferId = route.params?.transferId;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [transferData, setTransferData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (transferId) {
      loadTransfer();
    }
  }, [transferId]);

  const loadTransfer = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await getTransferData(transferId);
      
      if (result.success) {
        setTransferData(result.data);
      } else {
        setError(result.error);
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error('Load transfer error:', err);
      setError('Failed to load transfer');
      setIsLoading(false);
    }
  };

  const handleClaim = async () => {
    setIsClaiming(true);
    
    try {
      // In real app, get actual user ID from auth
      const userId = 'current-user-id';
      
      const result = await claimTransfer(transferId, userId);
      
      if (result.success) {
        // Add product to buyer's inventory
        await addProduct(result.productData);
        
        Alert.alert(
          'Product Added! ✓',
          'This product has been added to your inventory.',
          [
            {
              text: 'View Product',
              onPress: () => navigation.navigate('Main', { screen: 'Home' }),
            },
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to claim transfer');
      }
      
      setIsClaiming(false);
    } catch (error) {
      console.error('Claim error:', error);
      setIsClaiming(false);
      Alert.alert('Error', 'Failed to claim product');
    }
  };

  const getWarrantyStatus = (warrantyDate) => {
    if (!warrantyDate) return { status: 'Unknown', color: '#9E9E9E' };
    
    const today = new Date();
    const warranty = new Date(warrantyDate);
    const daysLeft = Math.ceil((warranty - today) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) return { status: 'Expired', color: '#9E9E9E' };
    if (daysLeft <= 30) return { status: `${daysLeft} days left`, color: '#F44336' };
    if (daysLeft <= 90) return { status: `${daysLeft} days left`, color: '#FF9800' };
    return { status: `${daysLeft} days left`, color: '#4CAF50' };
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading transfer...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.error} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const warrantyStatus = getWarrantyStatus(transferData?.warrantyDate);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Product Transfer</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView>
        {transferData?.claimed && (
          <View style={[styles.claimedBanner, { backgroundColor: '#FF9800' }]}>
            <Ionicons name="checkmark-circle" size={24} color="#fff" />
            <Text style={styles.claimedText}>
              This product has already been claimed
            </Text>
          </View>
        )}

        {/* Product Preview */}
        <View style={[
          styles.previewCard, 
          { 
            backgroundColor: colors.card,
            marginTop: transferData?.claimed ? 0 : 16,
          }
        ]}>
          <Text style={[styles.previewTitle, { color: colors.text }]}>
            {transferData?.name}
          </Text>
          <Text style={[styles.previewMeta, { color: colors.textSecondary }]}>
            {transferData?.category} • {transferData?.room}
          </Text>
          
          {/* Photos */}
          {transferData?.photos && transferData.photos.length > 0 && (
            <View style={styles.photoGrid}>
              {transferData.photos.slice(0, 3).map((photo, index) => (
                <Image
                  key={index}
                  source={{ uri: photo }}
                  style={styles.photoThumb}
                />
              ))}
            </View>
          )}
        </View>

        {/* Warranty Status */}
        {transferData?.warrantyDate && (
          <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
            <View style={styles.infoHeader}>
              <Ionicons name="shield-checkmark" size={28} color={warrantyStatus.color} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  Warranty Status
                </Text>
                <Text style={[styles.infoValue, { color: warrantyStatus.color }]}>
                  {warrantyStatus.status}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Purchase Date */}
        {transferData?.purchaseDate && (
          <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
            <View style={styles.infoHeader}>
              <Ionicons name="calendar" size={28} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  Purchase Date
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {new Date(transferData.purchaseDate).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Purchase Price */}
        {transferData?.purchasePrice && (
          <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
            <View style={styles.infoHeader}>
              <Ionicons name="cash" size={28} color={colors.accent} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  Original Price
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  ${transferData.purchasePrice}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Care Instructions */}
        {transferData?.careInstructions && (
          <View style={[styles.detailCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.detailTitle, { color: colors.text }]}>
              💧 Care Instructions
            </Text>
            <Text style={[styles.detailText, { color: colors.text }]}>
              {transferData.careInstructions}
            </Text>
          </View>
        )}

        {/* Cleaning Tips */}
        {transferData?.cleaningTips && (
          <View style={[styles.detailCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.detailTitle, { color: colors.text }]}>
              ✨ Cleaning Tips
            </Text>
            <Text style={[styles.detailText, { color: colors.text }]}>
              {transferData.cleaningTips}
            </Text>
          </View>
        )}

        {/* Dishwasher Safe */}
        {transferData?.isDishwasherSafe && (
          <View style={[styles.badgeCard, { backgroundColor: colors.card }]}>
            <Ionicons
              name={transferData.isDishwasherSafe === 'Yes' ? 'checkmark-circle' : 'close-circle'}
              size={32}
              color={transferData.isDishwasherSafe === 'Yes' ? '#4CAF50' : '#F44336'}
            />
            <Text style={[styles.badgeText, { color: colors.text }]}>
              {transferData.isDishwasherSafe === 'Yes' ? 'Dishwasher Safe' : 'Hand Wash Only'}
            </Text>
          </View>
        )}

        {/* Manual Link */}
        {transferData?.manualUrl && (
          <View style={[styles.detailCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.detailTitle, { color: colors.text }]}>
              📖 Manual & Documentation
            </Text>
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              {transferData.manualUrl}
            </Text>
          </View>
        )}

        {/* Specifications */}
        {transferData?.specifications && (
          <View style={[styles.detailCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.detailTitle, { color: colors.text }]}>
              📋 Specifications
            </Text>
            <Text style={[styles.detailText, { color: colors.text }]}>
              {transferData.specifications}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Claim Button */}
      {!transferData?.claimed && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.claimButton, { backgroundColor: colors.accent }]}
            onPress={handleClaim}
            disabled={isClaiming}
          >
            {isClaiming ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="add-circle" size={24} color="#fff" />
                <Text style={styles.claimButtonText}>Add to My Inventory</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  claimedBanner: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  claimedText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  previewCard: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  previewTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  previewMeta: {
    fontSize: 14,
    marginBottom: 16,
  },
  photoGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  photoThumb: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
  },
  infoCard: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  detailCard: {
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 14,
    lineHeight: 20,
  },
  badgeCard: {
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  badgeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  claimButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
