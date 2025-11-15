import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * Monetization System - Premium subscription management
 * RevenueCat integration for subscription payments
 */

const STORAGE_KEY = '@engram_premium';

// RevenueCat API keys (REPLACE WITH YOUR KEYS)
const REVENUECAT_API_KEY_IOS = 'appl_xxxxxxxxxx'; // From RevenueCat dashboard
const REVENUECAT_API_KEY_ANDROID = 'goog_xxxxxxxxxx'; // From RevenueCat dashboard

// Subscription tiers
export const SUBSCRIPTION_PLANS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    maxProducts: 10,
    features: [
      'Up to 10 products',
      'Basic warranty tracking',
      'Manual photo upload',
      'Local storage only',
      'Basic search & filter',
    ],
  },
  PREMIUM_MONTHLY: {
    id: 'premium_monthly',
    name: 'Premium Monthly',
    price: 4.99,
    period: 'month',
    trialDays: 7,
    features: [
      'Unlimited products',
      'Quick Lookup Camera',
      'Upgrade Finder & Wish List',
      'Manual Lookup',
      'Transfer Feature (Carfax for Homes)',
      'CSV Import (Amazon orders)',
      'Push Notifications',
      'PDF Export',
      'Cloud Sync',
      'Family Sharing',
      'Priority Support',
    ],
  },
  PREMIUM_YEARLY: {
    id: 'premium_yearly',
    name: 'Premium Yearly',
    price: 39.99,
    period: 'year',
    trialDays: 7,
    savings: '33% savings',
    features: [
      'Everything in Premium Monthly',
      'Save $20/year',
      'Exclusive beta features',
    ],
  },
};

// Premium feature gates
export const PREMIUM_FEATURES = {
  QUICK_LOOKUP: 'quick_lookup',
  UPGRADE_FINDER: 'upgrade_finder',
  WISH_LIST: 'wish_list',
  MANUAL_LOOKUP: 'manual_lookup',
  TRANSFER: 'transfer',
  CSV_IMPORT: 'csv_import',
  PUSH_NOTIFICATIONS: 'push_notifications',
  PDF_EXPORT: 'pdf_export',
  CLOUD_SYNC: 'cloud_sync',
  FAMILY_SHARING: 'family_sharing',
};

/**
 * Initialize RevenueCat SDK
 * Call this in App.js on app launch
 */
export const initializeRevenueCat = async () => {
  try {
    // Check if react-native-purchases is available
    let Purchases;
    try {
      Purchases = require('react-native-purchases');
    } catch (error) {
      console.warn('RevenueCat not installed, using local premium state');
      return false;
    }

    // Configure RevenueCat
    const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;
    
    if (apiKey.includes('xxxxxxxxxx')) {
      console.warn('RevenueCat API keys not configured, using local premium state');
      return false;
    }

    await Purchases.configure({ apiKey });
    
    console.log('RevenueCat initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize RevenueCat:', error);
    return false;
  }
};

/**
 * Check if user has premium subscription
 */
export const isPremiumUser = async () => {
  try {
    // Try RevenueCat first
    let Purchases;
    try {
      Purchases = require('react-native-purchases');
      
      const purchaserInfo = await Purchases.getCustomerInfo();
      const isPremium = purchaserInfo.entitlements.active.premium !== undefined;
      
      // Cache premium status
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
        isPremium,
        source: 'revenuecat',
        checkedAt: Date.now(),
      }));
      
      return isPremium;
    } catch (error) {
      // Fall back to local storage
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      if (cached) {
        const { isPremium } = JSON.parse(cached);
        return isPremium;
      }
      return false;
    }
  } catch (error) {
    console.error('Failed to check premium status:', error);
    return false;
  }
};

/**
 * Check if specific feature is available
 */
export const hasFeatureAccess = async (featureId) => {
  const isPremium = await isPremiumUser();
  
  // All premium features require subscription
  if (Object.values(PREMIUM_FEATURES).includes(featureId)) {
    return isPremium;
  }
  
  // Unknown feature, grant access
  return true;
};

/**
 * Check if product limit reached
 */
export const canAddProduct = async (currentProductCount) => {
  const isPremium = await isPremiumUser();
  
  if (isPremium) {
    return { allowed: true };
  }
  
  const limit = SUBSCRIPTION_PLANS.FREE.maxProducts;
  
  if (currentProductCount >= limit) {
    return {
      allowed: false,
      reason: `Free plan limited to ${limit} products`,
      action: 'upgrade',
    };
  }
  
  return { allowed: true };
};

/**
 * Purchase premium subscription
 */
export const purchasePremium = async (planId) => {
  try {
    const Purchases = require('react-native-purchases');
    
    const offerings = await Purchases.getOfferings();
    const premium = offerings.current?.availablePackages.find(
      pkg => pkg.identifier === planId
    );
    
    if (!premium) {
      throw new Error('Subscription plan not found');
    }
    
    const purchaseResult = await Purchases.purchasePackage(premium);
    
    // Update local cache
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
      isPremium: true,
      source: 'revenuecat',
      purchasedAt: Date.now(),
      planId,
    }));
    
    return {
      success: true,
      purchaserInfo: purchaseResult.customerInfo,
    };
  } catch (error) {
    if (error.userCancelled) {
      return {
        success: false,
        cancelled: true,
      };
    }
    
    console.error('Purchase failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Restore previous purchases
 */
export const restorePurchases = async () => {
  try {
    const Purchases = require('react-native-purchases');
    
    const purchaserInfo = await Purchases.restorePurchases();
    const isPremium = purchaserInfo.entitlements.active.premium !== undefined;
    
    // Update local cache
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
      isPremium,
      source: 'revenuecat',
      restoredAt: Date.now(),
    }));
    
    return {
      success: true,
      isPremium,
    };
  } catch (error) {
    console.error('Restore failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get subscription info
 */
export const getSubscriptionInfo = async () => {
  try {
    const Purchases = require('react-native-purchases');
    
    const purchaserInfo = await Purchases.getCustomerInfo();
    const premium = purchaserInfo.entitlements.active.premium;
    
    if (!premium) {
      return {
        isPremium: false,
        plan: 'free',
      };
    }
    
    return {
      isPremium: true,
      plan: premium.productIdentifier,
      expiresAt: premium.expirationDate,
      willRenew: premium.willRenew,
      periodType: premium.periodType,
      store: premium.store,
    };
  } catch (error) {
    console.error('Failed to get subscription info:', error);
    return {
      isPremium: false,
      plan: 'free',
    };
  }
};

/**
 * Cancel subscription (user must do this through App Store/Play Store)
 */
export const showManageSubscription = async () => {
  try {
    const Purchases = require('react-native-purchases');
    
    // Open platform-specific subscription management
    await Purchases.showManagementUI();
    
    return { success: true };
  } catch (error) {
    console.error('Failed to show manage UI:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get available subscription offerings
 */
export const getOfferings = async () => {
  try {
    const Purchases = require('react-native-purchases');
    
    const offerings = await Purchases.getOfferings();
    
    if (!offerings.current) {
      return {
        success: false,
        error: 'No offerings available',
      };
    }
    
    return {
      success: true,
      packages: offerings.current.availablePackages,
    };
  } catch (error) {
    console.error('Failed to get offerings:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Set local premium status (for development/testing)
 */
export const setLocalPremiumStatus = async (isPremium) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
      isPremium,
      source: 'local',
      setAt: Date.now(),
    }));
    return true;
  } catch (error) {
    console.error('Failed to set premium status:', error);
    return false;
  }
};

/**
 * Format price for display
 */
export const formatPrice = (price, period) => {
  const formatted = `$${price.toFixed(2)}`;
  if (period) {
    return `${formatted}/${period}`;
  }
  return formatted;
};

/**
 * Calculate savings for yearly plan
 */
export const calculateYearlySavings = () => {
  const monthly = SUBSCRIPTION_PLANS.PREMIUM_MONTHLY.price * 12;
  const yearly = SUBSCRIPTION_PLANS.PREMIUM_YEARLY.price;
  const savings = monthly - yearly;
  const percent = Math.round((savings / monthly) * 100);
  
  return {
    amount: savings,
    percent,
    formatted: `Save $${savings.toFixed(2)} (${percent}%)`,
  };
};
