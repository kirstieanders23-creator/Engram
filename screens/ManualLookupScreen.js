import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../providers/ThemeProvider';
import { useDatabase } from '../providers/DatabaseProvider';
import { usePremium } from '../providers/PremiumProvider';
import { PREMIUM_FEATURES } from '../utils/monetization';

/**
 * Manual Lookup - Find user manuals and care instructions
 * Auto-populates product manual URL and care tips
 */

export const ManualLookupScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { updateProduct } = useDatabase();
  const { checkFeatureAccess } = usePremium();
  const productId = route.params?.productId;
  const product = route.params?.product;
  
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Check premium access on mount
  useEffect(() => {
    const verifyAccess = async () => {
      const hasAccess = await checkFeatureAccess(PREMIUM_FEATURES.MANUAL_LOOKUP, navigation);
      if (!hasAccess) return;
    };
    verifyAccess();
  }, []);

  useEffect(() => {
    if (product) {
      handleSearch();
    }
  }, [product]);

  const handleSearch = async () => {
    setIsSearching(true);
    
    try {
      const { searchManual, generateCareTips } = await import('../utils/manual-lookup');
      
      // Extract brand from product name (simple approach)
      const words = product.name.split(' ');
      const possibleBrand = words[0];
      
      // Search for manual
      const manualResults = await searchManual(product.name, possibleBrand);
      
      // Generate additional tips
      const generatedTips = generateCareTips(product);
      
      setResults({
        ...manualResults,
        generatedTips,
      });
      
      setIsSearching(false);
    } catch (error) {
      console.error('Manual search failed:', error);
      setIsSearching(false);
      Alert.alert('Error', 'Failed to search for manual');
    }
  };

  const handleSaveToProduct = async () => {
    if (!results || !productId) return;
    
    try {
      setIsSaving(true);
      
      const updates = {};
      
      if (results.manualUrl) {
        updates.manualUrl = results.manualUrl;
      }
      
      if (results.careTips && results.careTips.length > 0) {
        // Combine with existing care instructions
        const existingCare = product.careInstructions || '';
        const newCare = results.careTips.join('\n');
        updates.careInstructions = existingCare 
          ? `${existingCare}\n\n${newCare}` 
          : newCare;
      }
      
      if (results.generatedTips && results.generatedTips.length > 0) {
        const existingTips = product.cleaningTips || '';
        const newTips = results.generatedTips.join('\n');
        updates.cleaningTips = existingTips 
          ? `${existingTips}\n\n${newTips}` 
          : newTips;
      }
      
      await updateProduct(productId, updates);
      
      setIsSaving(false);
      Alert.alert(
        'Saved! ✓',
        'Manual and care instructions have been added to your product.',
        [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]
      );
    } catch (error) {
      console.error('Save failed:', error);
      setIsSaving(false);
      Alert.alert('Error', 'Failed to save manual information');
    }
  };

  const handleOpenManual = (url) => {
    if (url) {
      Linking.openURL(url).catch(err => 
        Alert.alert('Error', 'Failed to open manual')
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Find Manual</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView>
        {/* Product Info */}
        {product && (
          <View style={[styles.productCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.productName, { color: colors.text }]}>
              {product.name}
            </Text>
            {product.category && (
              <Text style={[styles.productMeta, { color: colors.textSecondary }]}>
                {product.category} • {product.room}
              </Text>
            )}
          </View>
        )}

        {/* Loading State */}
        {isSearching && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Searching for manual and care instructions...
            </Text>
          </View>
        )}

        {/* Results */}
        {!isSearching && results && (
          <View style={styles.resultsContainer}>
            {/* Manual Link */}
            {results.manualUrl && (
              <View style={[styles.resultCard, { backgroundColor: colors.card }]}>
                <View style={styles.resultHeader}>
                  <Ionicons name="document-text" size={32} color={colors.primary} />
                  <View style={styles.resultInfo}>
                    <Text style={[styles.resultTitle, { color: colors.text }]}>
                      User Manual Found
                    </Text>
                    <Text style={[styles.resultSource, { color: colors.textSecondary }]}>
                      Source: {results.source === 'manufacturer' ? 'Official Manufacturer' : 'Online Database'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.primary }]}
                  onPress={() => handleOpenManual(results.manualUrl)}
                >
                  <Ionicons name="open-outline" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Open Manual</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Care Guide */}
            {results.careGuideUrl && (
              <View style={[styles.resultCard, { backgroundColor: colors.card }]}>
                <View style={styles.resultHeader}>
                  <Ionicons name="water" size={32} color={colors.accent} />
                  <View style={styles.resultInfo}>
                    <Text style={[styles.resultTitle, { color: colors.text }]}>
                      Care Guide Available
                    </Text>
                    <Text style={[styles.resultSource, { color: colors.textSecondary }]}>
                      Official care instructions
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.accent }]}
                  onPress={() => handleOpenManual(results.careGuideUrl)}
                >
                  <Ionicons name="open-outline" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>View Care Guide</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Care Tips */}
            {results.careTips && results.careTips.length > 0 && (
              <View style={[styles.resultCard, { backgroundColor: colors.card }]}>
                <View style={styles.resultHeader}>
                  <Ionicons name="bulb" size={32} color="#FF9800" />
                  <Text style={[styles.resultTitle, { color: colors.text }]}>
                    Care Tips
                  </Text>
                </View>
                <View style={styles.tipsList}>
                  {results.careTips.map((tip, index) => (
                    <View key={index} style={styles.tipRow}>
                      <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                      <Text style={[styles.tipText, { color: colors.text }]}>
                        {tip}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Generated Tips */}
            {results.generatedTips && results.generatedTips.length > 0 && (
              <View style={[styles.resultCard, { backgroundColor: colors.card }]}>
                <View style={styles.resultHeader}>
                  <Ionicons name="sparkles" size={32} color="#9C27B0" />
                  <Text style={[styles.resultTitle, { color: colors.text }]}>
                    Recommended Care
                  </Text>
                </View>
                <View style={styles.tipsList}>
                  {results.generatedTips.map((tip, index) => (
                    <View key={index} style={styles.tipRow}>
                      <Ionicons name="star" size={20} color="#FF9800" />
                      <Text style={[styles.tipText, { color: colors.text }]}>
                        {tip}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* No Results */}
            {!results.manualUrl && !results.careGuideUrl && 
             (!results.careTips || results.careTips.length === 0) && 
             (!results.generatedTips || results.generatedTips.length === 0) && (
              <View style={styles.noResults}>
                <Ionicons name="search" size={64} color={colors.border} />
                <Text style={[styles.noResultsTitle, { color: colors.text }]}>
                  No Manual Found
                </Text>
                <Text style={[styles.noResultsText, { color: colors.textSecondary }]}>
                  We couldn't find an official manual for this product. Try searching online or contact the manufacturer.
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Save Button */}
      {!isSearching && results && (results.manualUrl || 
        (results.careTips && results.careTips.length > 0) || 
        (results.generatedTips && results.generatedTips.length > 0)) && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.accent }]}
            onPress={handleSaveToProduct}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
                <Text style={styles.saveButtonText}>Save to Product</Text>
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
  productCard: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  productName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  productMeta: {
    fontSize: 14,
  },
  loadingContainer: {
    padding: 48,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },
  resultsContainer: {
    padding: 16,
    gap: 16,
  },
  resultCard: {
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    gap: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  resultSource: {
    fontSize: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  tipsList: {
    gap: 12,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  noResults: {
    padding: 48,
    alignItems: 'center',
    gap: 16,
  },
  noResultsTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  noResultsText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  saveButton: {
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
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
