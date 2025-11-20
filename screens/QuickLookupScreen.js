import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../providers/ThemeProvider';
import { useDatabase } from '../providers/DatabaseProvider';
import { usePremium } from '../providers/PremiumProvider';
import { PREMIUM_FEATURES } from '../utils/monetization';

/**
 * Quick Lookup - Snap photo to instantly find product info
 * Perfect for "is this dishwasher safe?" moments
 * Ultra-fast product identification and info display
 */

export const QuickLookupScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { products } = useDatabase();
  const { checkFeatureAccess } = usePremium();
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [matchedProduct, setMatchedProduct] = useState(null);
  const [confidence, setConfidence] = useState(0);

  // Check premium access on mount
  useEffect(() => {
    const verifyAccess = async () => {
      const hasAccess = await checkFeatureAccess(PREMIUM_FEATURES.QUICK_LOOKUP, navigation);
      if (!hasAccess) {
        // Navigation to paywall handled by checkFeatureAccess
        return;
      }
    };
    verifyAccess();
  }, []);

  // Auto-open camera if navigated from widget/shortcut
  useEffect(() => {
    if (route.params?.autoCapture) {
      handleTakePhoto();
    }
  }, [route.params]);

  const handleTakePhoto = async () => {
    try {
      const ImagePicker = await import('expo-image-picker');
      
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera access is needed for Quick Lookup');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.7,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setCapturedPhoto(result.assets[0].uri);
        await identifyProduct(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Photo capture failed:', error);
      Alert.alert('Error', 'Failed to capture photo');
    }
  };

  const identifyProduct = async (photoUri) => {
    setIsProcessing(true);
    setMatchedProduct(null);
    
    try {
      // Step 1: Run OCR to identify brand/product
      const { recognizeProduct } = await import('../utils/ocr');
      const ocrResult = await recognizeProduct(photoUri);
      
      // Step 2: Match against existing inventory using fuzzy matching
      const { findBestMatch } = await import('../utils/match');
      
      let bestMatch = null;
      let bestScore = 0;
      
      // Try matching by brand + product name
      const searchQuery = [ocrResult.brand, ocrResult.productName]
        .filter(Boolean)
        .join(' ');
      
      if (searchQuery) {
        for (const product of products) {
          const score = findBestMatch(searchQuery, [product.name]);
          if (score > bestScore && score > 0.5) {
            bestScore = score;
            bestMatch = product;
          }
        }
      }
      
      // Step 3: Visual matching as fallback (compare photo similarity)
      if (!bestMatch) {
        bestMatch = await visualMatch(photoUri);
        if (bestMatch) {
          bestScore = 0.7; // Visual matches get decent confidence
        }
      }
      
      setMatchedProduct(bestMatch);
      setConfidence(bestScore);
      setIsProcessing(false);
      
      if (!bestMatch) {
        Alert.alert(
          'Product Not Found',
          'This item isn\'t in your inventory yet. Would you like to add it?',
          [
            { text: 'Not Now', style: 'cancel' },
            {
              text: 'Add Product',
              onPress: () => navigation.navigate('Products', { openCamera: true }),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Product identification failed:', error);
      setIsProcessing(false);
      Alert.alert('Error', 'Failed to identify product');
    }
  };

  const visualMatch = async (newPhotoUri) => {
    // Simple visual matching: check if any products have similar photos
    // In production, this could use ML image similarity
    try {
      const { persistPhoto } = await import('../utils/photo');
      
      // For now, we'll do basic matching by checking if user has products
      // with photos in the same room or category
      // A real implementation would use image hashing or ML
      
      // Return null for now - can be enhanced with ML later
      return null;
    } catch (error) {
      console.error('Visual matching failed:', error);
      return null;
    }
  };

  const ProductInfoCard = () => {
    if (!matchedProduct) return null;

    const warrantyStatus = getWarrantyStatus(matchedProduct.warranty);
    
    return (
      <View style={[styles.productCard, { backgroundColor: colors.card }]}>
        {/* Header with product name */}
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={[styles.productName, { color: colors.text }]}>
              {matchedProduct.name}
            </Text>
            <Text style={[styles.productRoom, { color: colors.textSecondary }]}>
              {matchedProduct.room} • {matchedProduct.category}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('ProductDetail', { productId: matchedProduct.id })}
          >
            <Ionicons name="open-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Confidence badge */}
        <View style={[styles.confidenceBadge, { backgroundColor: getConfidenceColor(confidence) }]}>
          <Ionicons name="checkmark-circle" size={16} color="#fff" />
          <Text style={styles.confidenceText}>
            {Math.round(confidence * 100)}% Match
          </Text>
        </View>

        {/* Quick info grid */}
        <View style={styles.infoGrid}>
          {/* Dishwasher Safe */}
          <View style={[styles.infoBox, { backgroundColor: colors.background }]}>
            <Ionicons 
              name={matchedProduct.isDishwasherSafe === 'Yes' ? 'checkmark-circle' : 'close-circle'} 
              size={32} 
              color={matchedProduct.isDishwasherSafe === 'Yes' ? '#4CAF50' : '#FF5252'} 
            />
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Dishwasher Safe
            </Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {matchedProduct.isDishwasherSafe || 'Unknown'}
            </Text>
          </View>

          {/* Warranty Status */}
          <View style={[styles.infoBox, { backgroundColor: colors.background }]}>
            <Ionicons 
              name="shield-checkmark" 
              size={32} 
              color={warrantyStatus.color} 
            />
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Warranty
            </Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {warrantyStatus.text}
            </Text>
          </View>

          {/* Manual Link */}
          <View style={[styles.infoBox, { backgroundColor: colors.background }]}>
            <Ionicons 
              name="book" 
              size={32} 
              color={matchedProduct.manualUrl ? colors.primary : colors.border} 
            />
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Manual
            </Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {matchedProduct.manualUrl ? 'Available' : 'None'}
            </Text>
          </View>
        </View>

        {/* Care Instructions */}
        {matchedProduct.careInstructions && (
          <View style={styles.careSection}>
            <View style={styles.careSectionHeader}>
              <Ionicons name="water" size={20} color={colors.primary} />
              <Text style={[styles.careSectionTitle, { color: colors.text }]}>
                Care Instructions
              </Text>
            </View>
            <Text style={[styles.careText, { color: colors.textSecondary }]}>
              {matchedProduct.careInstructions}
            </Text>
          </View>
        )}

        {/* Cleaning Tips */}
        {matchedProduct.cleaningTips && (
          <View style={styles.careSection}>
            <View style={styles.careSectionHeader}>
              <Ionicons name="sparkles" size={20} color={colors.accent} />
              <Text style={[styles.careSectionTitle, { color: colors.text }]}>
                Cleaning Tips
              </Text>
            </View>
            <Text style={[styles.careText, { color: colors.textSecondary }]}>
              {matchedProduct.cleaningTips}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {matchedProduct.manualUrl && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                // Open manual URL
                Alert.alert('Manual', 'Opening manual...');
              }}
            >
              <Ionicons name="document-text" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>View Manual</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.accent }]}
            onPress={() => navigation.navigate('ProductDetail', { productId: matchedProduct.id })}
          >
            <Ionicons name="information-circle" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Full Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const getWarrantyStatus = (warrantyDate) => {
    if (!warrantyDate) {
      return { text: 'Unknown', color: '#9E9E9E' };
    }
    
    const warranty = new Date(warrantyDate);
    const now = new Date();
    const daysRemaining = Math.ceil((warranty.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining < 0) {
      return { text: 'Expired', color: '#9E9E9E' };
    } else if (daysRemaining <= 30) {
      return { text: `${daysRemaining}d left`, color: '#FF5252' };
    } else if (daysRemaining <= 90) {
      return { text: `${daysRemaining}d left`, color: '#FF9800' };
    } else {
      const monthsRemaining = Math.floor(daysRemaining / 30);
      return { text: `${monthsRemaining}mo left`, color: '#4CAF50' };
    }
  };

  const getConfidenceColor = (score) => {
    if (score >= 0.8) return '#4CAF50';
    if (score >= 0.6) return '#FF9800';
    return '#FF5252';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}
      accessible accessibilityLabel="Quick Lookup Screen">
      {/* Header */}
      <View style={styles.header} accessible accessibilityRole="header">
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} accessibilityLabel="Close Quick Lookup">
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} allowFontScaling accessibilityLabel="Quick Lookup">Quick Lookup</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} accessibilityLabel="Quick Lookup content">
        {/* Intro text */}
        {!capturedPhoto && (
          <View style={styles.introBox}>
            <Ionicons name="flash" size={48} color={colors.accent} />
            <Text style={[styles.introTitle, { color: colors.text }]} allowFontScaling accessibilityLabel="Instant Product Info"> 
              Instant Product Info
            </Text>
            <Text style={[styles.introText, { color: colors.textSecondary }]} allowFontScaling accessibilityLabel="Snap a photo of any item in your home to instantly see care instructions, warranty status, and more."> 
              Snap a photo of any item in your home to instantly see care instructions, warranty status, and more.
            </Text>
          </View>
        )}

        {/* Captured photo preview */}
        {capturedPhoto && (
          <View style={[styles.photoPreview, { backgroundColor: colors.card }]}> 
            <Image source={{ uri: capturedPhoto }} style={styles.photoImage} />
            {isProcessing && (
              <View style={styles.processingOverlay}>
                <ActivityIndicator size="large" color={colors.accent} />
                <Text style={[styles.processingText, { color: '#fff' }]} allowFontScaling accessibilityLabel="Identifying product..."> 
                  Identifying product...
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Product info card */}
        {matchedProduct && <ProductInfoCard />}

        {/* Try again button */}
        {capturedPhoto && !isProcessing && (
          <TouchableOpacity
            style={[styles.tryAgainButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {
              setCapturedPhoto(null);
              setMatchedProduct(null);
              handleTakePhoto();
            }}
          >
            <Ionicons name="camera" size={20} color={colors.text} />
            <Text style={[styles.tryAgainText, { color: colors.text }]}>
              Try Another Item
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Camera button (when no photo) */}
      {!capturedPhoto && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.cameraButton, { backgroundColor: colors.accent }]}
            onPress={handleTakePhoto}
          >
            <Ionicons name="camera" size={32} color="#fff" />
            <Text style={styles.cameraButtonText}>Take Photo</Text>
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  content: {
    padding: 16,
  },
  introBox: {
    alignItems: 'center',
    padding: 32,
    marginBottom: 24,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  introText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  photoPreview: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  photoImage: {
    width: '100%',
    height: 300,
    resizeMode: 'contain',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  processingText: {
    fontSize: 16,
    fontWeight: '600',
  },
  productCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  productName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  productRoom: {
    fontSize: 14,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  confidenceText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  infoBox: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  careSection: {
    marginBottom: 16,
  },
  careSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  careSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  careText: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  tryAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  tryAgainText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  cameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 18,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cameraButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
