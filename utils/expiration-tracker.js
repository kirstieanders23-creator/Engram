import AsyncStorage from '@react-native-async-storage/async-storage';

const EXPIRATION_STORAGE_KEY = '@engram_expirations';
const SHOPPING_LIST_KEY = '@engram_shopping_list';

/**
 * Expiration Tracker - Track expiring items (food, spices, medicine, batteries)
 * Smart shopping list integration - knows what you need based on what's running low
 */

// Common product lifespans (in months)
const DEFAULT_LIFESPANS = {
  // Pantry items
  'spices': 12,
  'canned goods': 24,
  'oil': 12,
  'vinegar': 24,
  'flour': 8,
  'sugar': 24,
  'baking powder': 18,
  'baking soda': 18,
  
  // Cleaning supplies
  'dish soap': 18,
  'laundry detergent': 18,
  'all-purpose cleaner': 24,
  'disinfectant': 24,
  
  // Personal care
  'shampoo': 18,
  'conditioner': 18,
  'toothpaste': 24,
  'sunscreen': 12,
  'lotion': 12,
  
  // Household
  'batteries': 60,
  'light bulbs': 60,
  'air filters': 3,
  'water filters': 6,
  'smoke detector batteries': 12,
  
  // Medicine (always check actual expiration)
  'medicine': 24,
  'vitamins': 24,
  'first aid supplies': 36,
};

/**
 * Calculate expiration date based on purchase date and category
 */
export const calculateExpirationDate = (purchaseDate, category, customMonths = null) => {
  if (!purchaseDate) return null;
  
  const months = customMonths || DEFAULT_LIFESPANS[category.toLowerCase()] || 12;
  const date = new Date(purchaseDate);
  date.setMonth(date.getMonth() + months);
  
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
};

/**
 * Get expiration status (expired, expiring soon, warning, good)
 */
export const getExpirationStatus = (expirationDate) => {
  if (!expirationDate) return { status: 'unknown', daysLeft: null, color: '#666' };
  
  const now = new Date();
  const expDate = new Date(expirationDate);
  const daysLeft = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));
  
  if (daysLeft < 0) {
    return { status: 'expired', daysLeft: Math.abs(daysLeft), color: '#FF3B30', urgent: true };
  } else if (daysLeft <= 7) {
    return { status: 'expires_soon', daysLeft, color: '#FF9500', urgent: true };
  } else if (daysLeft <= 30) {
    return { status: 'warning', daysLeft, color: '#FFCC00', urgent: false };
  } else {
    return { status: 'good', daysLeft, color: '#34C759', urgent: false };
  }
};

/**
 * Get human-readable expiration message
 */
export const getExpirationMessage = (expirationDate) => {
  const { status, daysLeft } = getExpirationStatus(expirationDate);
  
  switch (status) {
    case 'expired':
      return `Expired ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} ago`;
    case 'expires_soon':
      return `Expires in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}!`;
    case 'warning':
      return `Expires in ${daysLeft} days`;
    case 'good':
      return `Good for ${daysLeft} days`;
    default:
      return 'No expiration set';
  }
};

/**
 * Get all products expiring soon (within 30 days)
 */
export const getExpiringSoon = (products) => {
  return products
    .filter(p => p.expirationDate)
    .map(p => ({
      ...p,
      expirationStatus: getExpirationStatus(p.expirationDate),
    }))
    .filter(p => p.expirationStatus.urgent)
    .sort((a, b) => {
      // Sort by days left (ascending)
      return a.expirationStatus.daysLeft - b.expirationStatus.daysLeft;
    });
};

/**
 * Check if product needs replenishment based on last purchase
 */
export const needsReplenishment = (product) => {
  if (!product.purchaseDate) return false;
  
  const lifespan = DEFAULT_LIFESPANS[product.category.toLowerCase()] || 12;
  const purchaseDate = new Date(product.purchaseDate);
  const now = new Date();
  const monthsSincePurchase = (now - purchaseDate) / (1000 * 60 * 60 * 24 * 30);
  
  // If 80% through lifespan, suggest replenishment
  return monthsSincePurchase >= (lifespan * 0.8);
};

/**
 * Smart Shopping List - Items you need to buy
 */

export const addToShoppingList = async (item) => {
  try {
    const existing = await getShoppingList();
    const newItem = {
      id: Date.now().toString(),
      productId: item.productId || null,
      name: item.name,
      category: item.category || 'Other',
      reason: item.reason || 'manual', // 'expired', 'low', 'manual', 'routine'
      priority: item.priority || 'normal', // 'urgent', 'normal', 'low'
      addedAt: new Date().toISOString(),
      checked: false,
    };
    
    // Don't add duplicates
    const isDuplicate = existing.some(i => 
      i.name.toLowerCase() === newItem.name.toLowerCase() && !i.checked
    );
    
    if (isDuplicate) {
      return { success: false, message: 'Already on shopping list' };
    }
    
    const updated = [...existing, newItem];
    await AsyncStorage.setItem(SHOPPING_LIST_KEY, JSON.stringify(updated));
    
    return { success: true, item: newItem };
  } catch (error) {
    console.error('Failed to add to shopping list:', error);
    return { success: false, error: error.message };
  }
};

export const getShoppingList = async () => {
  try {
    const data = await AsyncStorage.getItem(SHOPPING_LIST_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to get shopping list:', error);
    return [];
  }
};

export const removeFromShoppingList = async (itemId) => {
  try {
    const existing = await getShoppingList();
    const updated = existing.filter(i => i.id !== itemId);
    await AsyncStorage.setItem(SHOPPING_LIST_KEY, JSON.stringify(updated));
    return { success: true };
  } catch (error) {
    console.error('Failed to remove from shopping list:', error);
    return { success: false, error: error.message };
  }
};

export const toggleShoppingListItem = async (itemId) => {
  try {
    const existing = await getShoppingList();
    const updated = existing.map(i => 
      i.id === itemId ? { ...i, checked: !i.checked } : i
    );
    await AsyncStorage.setItem(SHOPPING_LIST_KEY, JSON.stringify(updated));
    return { success: true };
  } catch (error) {
    console.error('Failed to toggle item:', error);
    return { success: false, error: error.message };
  }
};

export const clearCheckedItems = async () => {
  try {
    const existing = await getShoppingList();
    const updated = existing.filter(i => !i.checked);
    await AsyncStorage.setItem(SHOPPING_LIST_KEY, JSON.stringify(updated));
    return { success: true };
  } catch (error) {
    console.error('Failed to clear checked items:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Generate smart shopping suggestions based on products
 */
export const generateShoppingSuggestions = (products) => {
  const suggestions = [];
  
  products.forEach(product => {
    // Check expiration
    if (product.expirationDate) {
      const status = getExpirationStatus(product.expirationDate);
      if (status.urgent) {
        suggestions.push({
          productId: product.id,
          name: product.name,
          category: product.category,
          reason: status.status === 'expired' ? 'expired' : 'expiring',
          priority: 'urgent',
          message: `${product.name} ${getExpirationMessage(product.expirationDate)}`,
        });
      }
    }
    
    // Check if needs replenishment based on purchase date
    if (needsReplenishment(product)) {
      suggestions.push({
        productId: product.id,
        name: product.name,
        category: product.category,
        reason: 'routine',
        priority: 'normal',
        message: `${product.name} likely running low (purchased ${new Date(product.purchaseDate).toLocaleDateString()})`,
      });
    }
  });
  
  // Sort by priority
  const priorityOrder = { urgent: 0, normal: 1, low: 2 };
  return suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
};

/**
 * Get shopping list stats
 */
export const getShoppingListStats = (shoppingList) => {
  const unchecked = shoppingList.filter(i => !i.checked);
  const urgent = unchecked.filter(i => i.priority === 'urgent');
  const byCategory = unchecked.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});
  
  return {
    total: shoppingList.length,
    unchecked: unchecked.length,
    checked: shoppingList.length - unchecked.length,
    urgent: urgent.length,
    byCategory,
  };
};

/**
 * Get default lifespan for a category (for UI hints)
 */
export const getDefaultLifespan = (category) => {
  return DEFAULT_LIFESPANS[category.toLowerCase()] || 12;
};
