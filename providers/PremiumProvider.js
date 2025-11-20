import React, { createContext, useState, useContext, useEffect } from 'react';
import { Alert } from 'react-native';
import PropTypes from 'prop-types';
import {
  isPremiumUser,
  hasFeatureAccess,
  canAddProduct,
  initializeRevenueCat,
  PREMIUM_FEATURES,
} from '../utils/monetization';

const PremiumContext = createContext();


export const PremiumProvider = ({ children }) => {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    console.log('PremiumProvider: mounting');
  }, []);

  useEffect(() => {
    initializePremium();
  }, []);

  const initializePremium = async () => {
    console.log('PremiumProvider: initializing premium');
    try {
      // Initialize RevenueCat
      await initializeRevenueCat();
      
      // Check premium status
      const premium = await isPremiumUser();
      console.log('PremiumProvider: isPremiumUser', premium);
      setIsPremium(premium);
      setIsLoading(false);
    } catch (error) {
      console.error('PremiumProvider: Failed to initialize premium:', error);
      setIsLoading(false);
    }
  };

  const refreshPremiumStatus = async () => {
    const premium = await isPremiumUser();
    setIsPremium(premium);
    return premium;
  };

  const checkFeatureAccess = async (featureId, navigation) => {
    const hasAccess = await hasFeatureAccess(featureId);
    
    if (!hasAccess) {
      // Show paywall
      navigation?.navigate('Paywall', { feature: featureId });
      return false;
    }
    
    return true;
  };

  const checkProductLimit = async (currentCount, navigation) => {
    const result = await canAddProduct(currentCount);
    
    if (!result.allowed) {
      Alert.alert(
        'Upgrade to Premium',
        result.reason,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Upgrade',
            onPress: () => navigation?.navigate('Paywall', { feature: 'unlimited' }),
          },
        ]
      );
      return false;
    }
    
    return true;
  };

  const value = {
    isPremium,
    isLoading,
    refreshPremiumStatus,
    checkFeatureAccess,
    checkProductLimit,
    features: PREMIUM_FEATURES,
  };
  console.log('PremiumProvider: value', value);

  return (
    <PremiumContext.Provider value={value}>
      {children}
    </PremiumContext.Provider>
  );
};

PremiumProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const usePremium = () => {
  const context = useContext(PremiumContext);
  if (!context) {
    throw new Error('usePremium must be used within PremiumProvider');
  }
  return context;
};
