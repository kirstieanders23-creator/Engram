import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../providers/ThemeProvider';
import {
  SUBSCRIPTION_PLANS,
  purchasePremium,
  restorePurchases,
  getOfferings,
  calculateYearlySavings,
  formatPrice,
} from '../utils/monetization';

/**
 * Paywall Screen - Premium subscription purchase
 */

export const PaywallScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const feature = route.params?.feature; // Which feature triggered paywall
  const showClose = route.params?.showClose !== false;
  
  const [selectedPlan, setSelectedPlan] = useState('premium_yearly');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const savings = calculateYearlySavings();

  const handlePurchase = async () => {
    setIsPurchasing(true);
    
    try {
      const result = await purchasePremium(selectedPlan);
      
      if (result.success) {
        Alert.alert(
          'Welcome to Premium! 🎉',
          'All premium features are now unlocked. Enjoy!',
          [
            {
              text: 'Get Started',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else if (result.cancelled) {
        // User cancelled, do nothing
      } else {
        Alert.alert('Purchase Failed', result.error || 'Please try again');
      }
      
      setIsPurchasing(false);
    } catch (error) {
      console.error('Purchase error:', error);
      setIsPurchasing(false);
      Alert.alert('Error', 'Failed to process purchase');
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    
    try {
      const result = await restorePurchases();
      
      if (result.success) {
        if (result.isPremium) {
          Alert.alert(
            'Purchases Restored! ✓',
            'Your premium subscription has been restored.',
            [
              {
                text: 'Continue',
                onPress: () => navigation.goBack(),
              },
            ]
          );
        } else {
          Alert.alert(
            'No Purchases Found',
            'No previous purchases were found for this account.'
          );
        }
      } else {
        Alert.alert('Restore Failed', result.error || 'Please try again');
      }
      
      setIsRestoring(false);
    } catch (error) {
      console.error('Restore error:', error);
      setIsRestoring(false);
      Alert.alert('Error', 'Failed to restore purchases');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 28 }} />
        <Text style={[styles.headerTitle, { color: colors.text }]}>Upgrade to Premium</Text>
        {showClose ? (
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 28 }} />
        )}
      </View>

      <ScrollView>
        {/* Hero Section */}
        {feature && (
          <View style={[styles.featureCard, { backgroundColor: colors.accent }]}>
            <Ionicons name="lock-closed" size={48} color="#fff" />
            <Text style={styles.featureTitle}>
              Premium Feature
            </Text>
            <Text style={styles.featureText}>
              {getFeatureDescription(feature)}
            </Text>
          </View>
        )}

        {/* Benefits */}
        <View style={[styles.benefitsCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.benefitsTitle, { color: colors.text }]}>
            Premium Includes:
          </Text>
          
          {SUBSCRIPTION_PLANS.PREMIUM_MONTHLY.features.map((feature, index) => (
            <View key={index} style={styles.benefitRow}>
              <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
              <Text style={[styles.benefitText, { color: colors.text }]}>
                {feature}
              </Text>
            </View>
          ))}
        </View>

        {/* Plan Selection */}
        <View style={styles.plansContainer}>
          {/* Yearly Plan */}
          <TouchableOpacity
            style={[
              styles.planCard,
              {
                backgroundColor: colors.card,
                borderColor: selectedPlan === 'premium_yearly' ? colors.accent : colors.border,
                borderWidth: 3,
              },
            ]}
            onPress={() => setSelectedPlan('premium_yearly')}
          >
            {/* Best Value Badge */}
            <View style={[styles.badge, { backgroundColor: colors.accent }]}>
              <Text style={styles.badgeText}>BEST VALUE</Text>
            </View>

            <View style={styles.planHeader}>
              <Ionicons
                name={selectedPlan === 'premium_yearly' ? 'radio-button-on' : 'radio-button-off'}
                size={24}
                color={selectedPlan === 'premium_yearly' ? colors.accent : colors.border}
              />
              <View style={styles.planInfo}>
                <Text style={[styles.planName, { color: colors.text }]}>
                  Premium Yearly
                </Text>
                <Text style={[styles.planPrice, { color: colors.text }]}>
                  ${SUBSCRIPTION_PLANS.PREMIUM_YEARLY.price}/year
                </Text>
              </View>
            </View>
            
            <Text style={[styles.savings, { color: colors.accent }]}>
              {savings.formatted}
            </Text>
            
            <Text style={[styles.trial, { color: colors.textSecondary }]}>
              7-day free trial, then ${SUBSCRIPTION_PLANS.PREMIUM_YEARLY.price}/year
            </Text>
          </TouchableOpacity>

          {/* Monthly Plan */}
          <TouchableOpacity
            style={[
              styles.planCard,
              {
                backgroundColor: colors.card,
                borderColor: selectedPlan === 'premium_monthly' ? colors.accent : colors.border,
                borderWidth: 3,
              },
            ]}
            onPress={() => setSelectedPlan('premium_monthly')}
          >
            <View style={styles.planHeader}>
              <Ionicons
                name={selectedPlan === 'premium_monthly' ? 'radio-button-on' : 'radio-button-off'}
                size={24}
                color={selectedPlan === 'premium_monthly' ? colors.accent : colors.border}
              />
              <View style={styles.planInfo}>
                <Text style={[styles.planName, { color: colors.text }]}>
                  Premium Monthly
                </Text>
                <Text style={[styles.planPrice, { color: colors.text }]}>
                  ${SUBSCRIPTION_PLANS.PREMIUM_MONTHLY.price}/month
                </Text>
              </View>
            </View>
            
            <Text style={[styles.trial, { color: colors.textSecondary }]}>
              7-day free trial, then ${SUBSCRIPTION_PLANS.PREMIUM_MONTHLY.price}/month
            </Text>
          </TouchableOpacity>
        </View>

        {/* Fine Print */}
        <Text style={[styles.finePrint, { color: colors.textSecondary }]}>
          Cancel anytime. Subscription automatically renews unless auto-renew is turned off at least 24 hours before the end of the current period.
        </Text>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.purchaseButton, { backgroundColor: colors.accent }]}
          onPress={handlePurchase}
          disabled={isPurchasing}
        >
          {isPurchasing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.purchaseButtonText}>
              Start Free Trial
            </Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestore}
          disabled={isRestoring}
        >
          {isRestoring ? (
            <ActivityIndicator color={colors.text} size="small" />
          ) : (
            <Text style={[styles.restoreButtonText, { color: colors.text }]}>
              Restore Purchases
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const getFeatureDescription = (feature) => {
  const descriptions = {
    quick_lookup: 'Instantly identify products and check if they\'re dishwasher safe with Quick Lookup Camera',
    upgrade_finder: 'Find and compare product upgrades with intelligent scoring',
    wish_list: 'Track upgrade wish list with price alerts',
    manual_lookup: 'Auto-search product manuals and care instructions',
    transfer: 'Share product history with home buyers using QR codes',
    csv_import: 'Bulk import products from Amazon order history',
    push_notifications: 'Receive warranty expiration alerts',
    pdf_export: 'Generate professional insurance reports',
    cloud_sync: 'Sync your inventory across all devices',
    unlimited: 'Add unlimited products (free plan limited to 10)',
  };
  
  return descriptions[feature] || 'Unlock all premium features';
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
  featureCard: {
    margin: 16,
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    gap: 12,
  },
  featureTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  featureText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  benefitsCard: {
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
  benefitsTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  benefitText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
  },
  plansContainer: {
    padding: 16,
    paddingTop: 8,
    gap: 12,
  },
  planCard: {
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  planPrice: {
    fontSize: 16,
    fontWeight: '600',
  },
  savings: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  trial: {
    fontSize: 13,
    lineHeight: 18,
  },
  finePrint: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    padding: 16,
    paddingTop: 8,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
  },
  purchaseButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  purchaseButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  restoreButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  restoreButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
