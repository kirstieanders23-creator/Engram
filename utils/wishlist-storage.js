import AsyncStorage from '@react-native-async-storage/async-storage';

const WISHLIST_KEY = '@engram_wishlist';
const PRICE_ALERTS_KEY = '@engram_price_alerts';

/**
 * Wish List Item Structure:
 * {
 *   id: string (unique),
 *   productName: string,
 *   currentProductId: string (optional - if upgrading existing),
 *   model: string,
 *   price: number,
 *   targetPrice: number (optional - for price alerts),
 *   features: string[],
 *   url: string,
 *   addedDate: timestamp,
 *   priority: 'high' | 'medium' | 'low',
 *   notes: string,
 * }
 */

/**
 * Get all wish list items
 */
export async function getWishList() {
  try {
    const data = await AsyncStorage.getItem(WISHLIST_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load wish list:', error);
    return [];
  }
}

/**
 * Add item to wish list
 */
export async function addToWishList(item) {
  try {
    const wishlist = await getWishList();
    
    const newItem = {
      id: crypto.randomUUID(),
      addedDate: new Date().toISOString(),
      priority: 'medium',
      notes: '',
      ...item,
    };
    
    wishlist.push(newItem);
    await AsyncStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
    
    // Set up price alert if target price specified
    if (newItem.targetPrice) {
      await addPriceAlert(newItem.id, newItem.model, newItem.targetPrice);
    }
    
    return newItem;
  } catch (error) {
    console.error('Failed to add to wish list:', error);
    throw error;
  }
}

/**
 * Remove item from wish list
 */
export async function removeFromWishList(itemId) {
  try {
    const wishlist = await getWishList();
    const filtered = wishlist.filter(item => item.id !== itemId);
    await AsyncStorage.setItem(WISHLIST_KEY, JSON.stringify(filtered));
    
    // Remove associated price alert
    await removePriceAlert(itemId);
    
    return true;
  } catch (error) {
    console.error('Failed to remove from wish list:', error);
    throw error;
  }
}

/**
 * Update wish list item
 */
export async function updateWishListItem(itemId, updates) {
  try {
    const wishlist = await getWishList();
    const index = wishlist.findIndex(item => item.id === itemId);
    
    if (index === -1) {
      throw new Error('Wish list item not found');
    }
    
    wishlist[index] = {
      ...wishlist[index],
      ...updates,
      id: itemId, // Prevent ID from being overwritten
    };
    
    await AsyncStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
    
    // Update price alert if target price changed
    if (updates.targetPrice) {
      await addPriceAlert(itemId, wishlist[index].model, updates.targetPrice);
    }
    
    return wishlist[index];
  } catch (error) {
    console.error('Failed to update wish list item:', error);
    throw error;
  }
}

/**
 * Check if item is in wish list
 */
export async function isInWishList(productName) {
  try {
    const wishlist = await getWishList();
    return wishlist.some(item => 
      item.productName.toLowerCase() === productName.toLowerCase() ||
      item.model.toLowerCase().includes(productName.toLowerCase())
    );
  } catch (error) {
    console.error('Failed to check wish list:', error);
    return false;
  }
}

/**
 * Get wish list items sorted by priority
 */
export async function getWishListSorted() {
  try {
    const wishlist = await getWishList();
    
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    
    return wishlist.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // If same priority, sort by added date (newest first)
      return new Date(b.addedDate) - new Date(a.addedDate);
    });
  } catch (error) {
    console.error('Failed to sort wish list:', error);
    return [];
  }
}

/**
 * Price Alert Management
 */

async function getPriceAlerts() {
  try {
    const data = await AsyncStorage.getItem(PRICE_ALERTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load price alerts:', error);
    return [];
  }
}

async function addPriceAlert(wishlistItemId, productModel, targetPrice) {
  try {
    const alerts = await getPriceAlerts();
    
    // Remove existing alert for this item
    const filtered = alerts.filter(alert => alert.wishlistItemId !== wishlistItemId);
    
    filtered.push({
      wishlistItemId,
      productModel,
      targetPrice,
      createdAt: new Date().toISOString(),
      lastChecked: null,
    });
    
    await AsyncStorage.setItem(PRICE_ALERTS_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Failed to add price alert:', error);
    return false;
  }
}

async function removePriceAlert(wishlistItemId) {
  try {
    const alerts = await getPriceAlerts();
    const filtered = alerts.filter(alert => alert.wishlistItemId !== wishlistItemId);
    await AsyncStorage.setItem(PRICE_ALERTS_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Failed to remove price alert:', error);
    return false;
  }
}

/**
 * Check if any prices have dropped below target
 * (Would be called periodically by background task)
 */
export async function checkPriceAlerts() {
  try {
    const alerts = await getPriceAlerts();
    const triggered = [];
    
    for (const alert of alerts) {
      // In production, this would call real price checking APIs
      // For now, return structure for future implementation
      
      const currentPrice = await checkCurrentPrice(alert.productModel);
      
      if (currentPrice && currentPrice <= alert.targetPrice) {
        triggered.push({
          ...alert,
          currentPrice,
          savings: alert.targetPrice - currentPrice,
        });
      }
      
      // Update last checked time
      alert.lastChecked = new Date().toISOString();
    }
    
    // Save updated check times
    await AsyncStorage.setItem(PRICE_ALERTS_KEY, JSON.stringify(alerts));
    
    return triggered;
  } catch (error) {
    console.error('Failed to check price alerts:', error);
    return [];
  }
}

async function checkCurrentPrice(productModel) {
  // Placeholder for real price checking API
  // Could integrate with:
  // - CamelCamelCamel (Amazon price history)
  // - Google Shopping
  // - Manufacturer sites
  return null;
}

/**
 * Get wish list statistics
 */
export async function getWishListStats() {
  try {
    const wishlist = await getWishList();
    
    const totalValue = wishlist.reduce((sum, item) => sum + (item.price || 0), 0);
    const withPriceAlerts = wishlist.filter(item => item.targetPrice).length;
    const highPriority = wishlist.filter(item => item.priority === 'high').length;
    
    return {
      totalItems: wishlist.length,
      totalValue,
      withPriceAlerts,
      highPriority,
      averagePrice: wishlist.length > 0 ? totalValue / wishlist.length : 0,
    };
  } catch (error) {
    console.error('Failed to get wish list stats:', error);
    return {
      totalItems: 0,
      totalValue: 0,
      withPriceAlerts: 0,
      highPriority: 0,
      averagePrice: 0,
    };
  }
}
