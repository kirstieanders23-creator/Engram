import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, Alert, ActivityIndicator, RefreshControl, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../providers/ThemeProvider';
import { useDatabase } from '../providers/DatabaseProvider';
import { usePremium } from '../providers/PremiumProvider';
import { PREMIUM_FEATURES } from '../utils/monetization';

/**
 * Upgrade Finder - Find newer models and manage wish list
 * Shows upgrade recommendations with comparison features
 */

export const UpgradeFinderScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { products } = useDatabase();
  const { checkFeatureAccess } = usePremium();
  const productId = route.params?.productId;
  
  const [currentProduct, setCurrentProduct] = useState(null);
  const [upgrades, setUpgrades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUpgrade, setSelectedUpgrade] = useState(null);
  const [showComparison, setShowComparison] = useState(false);

  // Check premium access on mount
  useEffect(() => {
    const verifyAccess = async () => {
      const hasAccess = await checkFeatureAccess(PREMIUM_FEATURES.UPGRADE_FINDER, navigation);
      if (!hasAccess) return;
    };
    verifyAccess();
  }, []);

  useEffect(() => {
    loadProductAndUpgrades();
  }, [productId]);

  const loadProductAndUpgrades = async () => {
    setIsLoading(true);
    
    try {
      // Find current product
      const product = products.find(p => p.id === productId);
      if (!product) {
        Alert.alert('Error', 'Product not found');
        navigation.goBack();
        return;
      }
      setCurrentProduct(product);
      
      // Search for upgrades
      const { findUpgrades } = await import('../utils/upgrade-finder');
      const result = await findUpgrades(product.name, product.name);
      
      setUpgrades(result.upgrades || []);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load upgrades:', error);
      setIsLoading(false);
      Alert.alert('Error', 'Failed to find upgrades');
    }
  };

  const handleAddToWishList = async (upgrade) => {
    try {
      const { addToWishList } = await import('../utils/wishlist-storage');
      
      await addToWishList({
        productName: currentProduct.name,
        currentProductId: productId,
        model: upgrade.model,
        price: upgrade.price,
        features: upgrade.features,
        url: upgrade.url,
      });
      
      Alert.alert(
        'Added to Wish List! 🎉',
        `${upgrade.model} has been saved to your wish list.`,
        [
          { text: 'OK' },
          {
            text: 'View Wish List',
            onPress: () => navigation.navigate('WishList'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to add to wish list');
    }
  };

  const handleShowComparison = (upgrade) => {
    setSelectedUpgrade(upgrade);
    setShowComparison(true);
  };

  const ComparisonView = () => {
    if (!selectedUpgrade) return null;
    
    const { compareProducts, getUpgradeScore } = require('../utils/upgrade-finder');
    const comparison = compareProducts(currentProduct, selectedUpgrade);
    const score = getUpgradeScore(currentProduct, selectedUpgrade, comparison);
    
    return (
      <View style={[styles.comparisonModal, { backgroundColor: colors.background }]}>
        <SafeAreaView style={styles.comparisonContent}>
          {/* Header */}
          <View style={styles.comparisonHeader}>
            <Text style={[styles.comparisonTitle, { color: colors.text }]}>
              Upgrade Comparison
            </Text>
            <TouchableOpacity onPress={() => setShowComparison(false)}>
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView>
            {/* Upgrade Score */}
            <View style={[styles.scoreCard, { backgroundColor: colors.card }]}>
              <View style={styles.scoreCircle}>
                <Text style={[styles.scoreNumber, { color: getScoreColor(score) }]}>
                  {score}
                </Text>
                <Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>
                  Upgrade Score
                </Text>
              </View>
              <View style={styles.recommendation}>
                <Ionicons 
                  name={comparison.shouldUpgrade === 'recommended' ? 'checkmark-circle' : 
                        comparison.shouldUpgrade === 'consider' ? 'help-circle' : 'time'}
                  size={32}
                  color={comparison.shouldUpgrade === 'recommended' ? '#4CAF50' :
                         comparison.shouldUpgrade === 'consider' ? '#FF9800' : '#9E9E9E'}
                />
                <Text style={[styles.recommendationText, { color: colors.text }]}>
                  {comparison.shouldUpgrade === 'recommended' ? 'Recommended' :
                   comparison.shouldUpgrade === 'consider' ? 'Consider' : 'Wait'}
                </Text>
                <Text style={[styles.recommendationReason, { color: colors.textSecondary }]}>
                  {comparison.reason}
                </Text>
              </View>
            </View>

            {/* Price Comparison */}
            <View style={[styles.comparisonSection, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Price</Text>
              <View style={styles.priceComparison}>
                <View style={styles.priceItem}>
                  <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>
                    You Paid
                  </Text>
                  <Text style={[styles.priceValue, { color: colors.text }]}>
                    ${currentProduct.purchasePrice || '???'}
                  </Text>
                </View>
                <Ionicons name="arrow-forward" size={24} color={colors.textSecondary} />
                <View style={styles.priceItem}>
                  <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>
                    New Model
                  </Text>
                  <Text style={[styles.priceValue, { color: colors.accent }]}>
                    ${selectedUpgrade.price}
                  </Text>
                </View>
              </View>
              {comparison.priceIncreasePercent !== null && (
                <Text style={[styles.priceDiff, { color: colors.textSecondary }]}>
                  {comparison.priceIncreasePercent > 0 ? '+' : ''}{comparison.priceIncreasePercent}% 
                  (${Math.abs(comparison.priceIncrease).toFixed(2)})
                </Text>
              )}
            </View>

            {/* New Features */}
            {selectedUpgrade.features && selectedUpgrade.features.length > 0 && (
              <View style={[styles.comparisonSection, { backgroundColor: colors.card }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>New Features</Text>
                {selectedUpgrade.features.map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <Ionicons name="add-circle" size={20} color={colors.primary} />
                    <Text style={[styles.featureText, { color: colors.text }]}>
                      {feature}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Improvements */}
            {selectedUpgrade.improvements && selectedUpgrade.improvements.length > 0 && (
              <View style={[styles.comparisonSection, { backgroundColor: colors.card }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Improvements</Text>
                {selectedUpgrade.improvements.map((improvement, index) => (
                  <View key={index} style={styles.featureRow}>
                    <Ionicons name="trending-up" size={20} color={colors.accent} />
                    <Text style={[styles.featureText, { color: colors.text }]}>
                      {improvement}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Energy Rating */}
            {selectedUpgrade.energyRating && (
              <View style={[styles.comparisonSection, { backgroundColor: colors.card }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Energy Efficiency</Text>
                <View style={styles.energyBadge}>
                  <Ionicons name="leaf" size={24} color="#4CAF50" />
                  <Text style={[styles.energyText, { color: colors.text }]}>
                    {selectedUpgrade.energyRating}
                  </Text>
                </View>
              </View>
            )}

            {/* Actions */}
            <View style={styles.comparisonActions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.accent }]}
                onPress={() => {
                  setShowComparison(false);
                  handleAddToWishList(selectedUpgrade);
                }}
              >
                <Ionicons name="heart" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Add to Wish List</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  };

  const getScoreColor = (score) => {
    if (score >= 70) return '#4CAF50';
    if (score >= 40) return '#FF9800';
    return '#9E9E9E';
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Finding upgrades...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Find Upgrades</Text>
        <TouchableOpacity onPress={() => navigation.navigate('WishList')}>
          <Ionicons name="heart-outline" size={28} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView>
        {/* Current Product */}
        {currentProduct && (
          <View style={[styles.currentProduct, { backgroundColor: colors.card }]}>
            <Text style={[styles.currentLabel, { color: colors.textSecondary }]}>
              Your Current Product
            </Text>
            <Text style={[styles.currentName, { color: colors.text }]}>
              {currentProduct.name}
            </Text>
            {currentProduct.purchaseDate && (
              <Text style={[styles.currentInfo, { color: colors.textSecondary }]}>
                Purchased: {new Date(currentProduct.purchaseDate).toLocaleDateString()}
              </Text>
            )}
          </View>
        )}

        {/* Upgrades List */}
        {upgrades.length > 0 ? (
          <View style={styles.upgradesList}>
            <Text style={[styles.sectionHeader, { color: colors.text }]}>
              Available Upgrades ({upgrades.length})
            </Text>
            {upgrades.map((upgrade, index) => (
              <View key={index} style={[styles.upgradeCard, { backgroundColor: colors.card }]}>
                <View style={styles.upgradeHeader}>
                  <View style={styles.upgradeInfo}>
                    <Text style={[styles.upgradeName, { color: colors.text }]}>
                      {upgrade.model}
                    </Text>
                    <Text style={[styles.upgradePrice, { color: colors.accent }]}>
                      ${upgrade.price}
                    </Text>
                  </View>
                  {upgrade.releaseDate && (
                    <View style={[styles.newBadge, { backgroundColor: colors.primary }]}>
                      <Text style={styles.newBadgeText}>NEW</Text>
                    </View>
                  )}
                </View>

                {/* Features */}
                <View style={styles.featuresList}>
                  {upgrade.features && upgrade.features.slice(0, 3).map((feature, i) => (
                    <View key={i} style={styles.featureChip}>
                      <Text style={[styles.featureChipText, { color: colors.text }]}>
                        {feature}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Actions */}
                <View style={styles.upgradeActions}>
                  <TouchableOpacity
                    style={[styles.upgradeButton, { backgroundColor: colors.background }]}
                    onPress={() => handleShowComparison(upgrade)}
                  >
                    <Ionicons name="stats-chart" size={18} color={colors.text} />
                    <Text style={[styles.upgradeButtonText, { color: colors.text }]}>
                      Compare
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.upgradeButton, { backgroundColor: colors.accent }]}
                    onPress={() => handleAddToWishList(upgrade)}
                  >
                    <Ionicons name="heart-outline" size={18} color="#fff" />
                    <Text style={[styles.upgradeButtonText, { color: '#fff' }]}>
                      Wish List
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.noResults}>
            <Ionicons name="search" size={64} color={colors.border} />
            <Text style={[styles.noResultsText, { color: colors.textSecondary }]}>
              No upgrades found for this product yet
            </Text>
            <Text style={[styles.noResultsHint, { color: colors.textSecondary }]}>
              Check back later or search manually
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Comparison Modal */}
      {showComparison && <ComparisonView />}
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
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  currentProduct: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  currentLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: '700',
    marginBottom: 8,
  },
  currentName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  currentInfo: {
    fontSize: 14,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  upgradesList: {
    padding: 16,
    gap: 16,
  },
  upgradeCard: {
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    gap: 12,
  },
  upgradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  upgradeInfo: {
    flex: 1,
  },
  upgradeName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  upgradePrice: {
    fontSize: 24,
    fontWeight: '700',
  },
  newBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  newBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  featuresList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
  },
  featureChipText: {
    fontSize: 12,
  },
  upgradeActions: {
    flexDirection: 'row',
    gap: 12,
  },
  upgradeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  upgradeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  noResults: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    gap: 16,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  noResultsHint: {
    fontSize: 14,
    textAlign: 'center',
  },
  comparisonModal: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  comparisonContent: {
    flex: 1,
  },
  comparisonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  comparisonTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  scoreCard: {
    flexDirection: 'row',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    gap: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  scoreCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: '700',
  },
  scoreLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  recommendation: {
    flex: 1,
    justifyContent: 'center',
    gap: 8,
  },
  recommendationText: {
    fontSize: 20,
    fontWeight: '700',
  },
  recommendationReason: {
    fontSize: 14,
  },
  comparisonSection: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  priceComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceItem: {
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  priceDiff: {
    textAlign: 'center',
    fontSize: 14,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
  },
  energyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  energyText: {
    fontSize: 18,
    fontWeight: '700',
  },
  comparisonActions: {
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
