import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

/**
 * "Don't Buy Again" List Utility
 * 
 * Track products that didn't work out - prevent repeat purchases
 * 
 * Use cases:
 * - "This medication gave me headaches"
 * - "This brand of coffee tastes terrible"
 * - "This detergent made my skin itch"
 * - "This food upset my stomach"
 * 
 * Features:
 * - Track why it didn't work
 * - When you tried it
 * - Search/scan warnings
 * - Category filtering
 * - Export for sharing with caregivers
 */

const STORAGE_KEY = '@engram_dont_buy_again';

/**
 * Don't Buy Item Structure:
 * {
 *   id: 'unique-id',
 *   name: 'Advil PM',
 *   brand: 'Advil',
 *   category: 'medication' | 'food' | 'beauty' | 'household' | 'other',
 *   reason: 'Gave me terrible headaches',
 *   reaction: 'headache' | 'rash' | 'stomach' | 'allergy' | 'ineffective' | 'other',
 *   severity: 'mild' | 'moderate' | 'severe',
 *   triedDate: 'YYYY-MM-DD',
 *   barcode: null,  // Optional: for scan warnings
 *   photo: null,    // Optional: product photo
 *   notes: 'Tried for 3 days, headache every time',
 *   alternatives: ['Tylenol PM worked better'],  // What to try instead
 *   createdAt: timestamp,
 *   updatedAt: timestamp,
 * }
 */

// ==================== CRUD Operations ====================

export const addDontBuyItem = async (itemData) => {
  try {
    const items = await getDontBuyList();
    
    // Generate secure unique ID
    const randomBytes = await Crypto.getRandomBytesAsync(8);
    const randomHex = Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    const newItem = {
      id: `dontbuy_${randomHex}`,
      name: itemData.name,
      brand: itemData.brand || '',
      category: itemData.category || 'other',
      reason: itemData.reason || '',
      reaction: itemData.reaction || 'other',
      severity: itemData.severity || 'moderate',
      triedDate: itemData.triedDate || new Date().toISOString().split('T')[0],
      barcode: itemData.barcode || null,
      photo: itemData.photo || null,
      notes: itemData.notes || '',
      alternatives: itemData.alternatives || [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    items.push(newItem);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    
    return { success: true, item: newItem };
  } catch (error) {
    console.error('Error adding dont-buy item:', error);
    return { success: false, error: error.message };
  }
};

export const getDontBuyList = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading dont-buy list:', error);
    return [];
  }
};

export const updateDontBuyItem = async (itemId, updates) => {
  try {
    const items = await getDontBuyList();
    const index = items.findIndex(item => item.id === itemId);
    
    if (index === -1) {
      return { success: false, error: 'Item not found' };
    }
    
    items[index] = {
      ...items[index],
      ...updates,
      updatedAt: Date.now(),
    };
    
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    return { success: true, item: items[index] };
  } catch (error) {
    console.error('Error updating dont-buy item:', error);
    return { success: false, error: error.message };
  }
};

export const deleteDontBuyItem = async (itemId) => {
  try {
    const items = await getDontBuyList();
    const filtered = items.filter(item => item.id !== itemId);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting dont-buy item:', error);
    return { success: false, error: error.message };
  }
};

// ==================== Search & Warnings ====================

export const checkIfShouldAvoid = async (productName, barcode = null) => {
  try {
    const items = await getDontBuyList();
    
    const matches = items.filter(item => {
      // Exact barcode match
      if (barcode && item.barcode && item.barcode === barcode) {
        return true;
      }
      
      // Name fuzzy match
      const itemNameLower = item.name.toLowerCase();
      const productNameLower = productName.toLowerCase();
      const brandLower = item.brand.toLowerCase();
      
      // Check if product name contains the don't-buy item name or brand
      if (productNameLower.includes(itemNameLower) || 
          productNameLower.includes(brandLower)) {
        return true;
      }
      
      return false;
    });
    
    return {
      shouldAvoid: matches.length > 0,
      matches,
      warning: matches.length > 0 ? 
        `⚠️ You marked this as "Don't Buy Again" - ${matches[0].reason}` : null,
    };
  } catch (error) {
    console.error('Error checking avoid list:', error);
    return { shouldAvoid: false, matches: [], warning: null };
  }
};

export const searchDontBuyList = async (query) => {
  try {
    const items = await getDontBuyList();
    
    if (!query || query.trim() === '') {
      return items;
    }
    
    const queryLower = query.toLowerCase();
    return items.filter(item => {
      return (
        item.name.toLowerCase().includes(queryLower) ||
        item.brand.toLowerCase().includes(queryLower) ||
        item.reason.toLowerCase().includes(queryLower) ||
        item.notes.toLowerCase().includes(queryLower)
      );
    });
  } catch (error) {
    console.error('Error searching dont-buy list:', error);
    return [];
  }
};

// ==================== Filtering ====================

export const getItemsByCategory = async (category) => {
  const items = await getDontBuyList();
  return items.filter(item => item.category === category);
};

export const getItemsBySeverity = async (severity) => {
  const items = await getDontBuyList();
  return items.filter(item => item.severity === severity);
};

export const getRecentItems = async (days = 30) => {
  const items = await getDontBuyList();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return items.filter(item => {
    const itemDate = new Date(item.triedDate);
    return itemDate >= cutoffDate;
  }).sort((a, b) => new Date(b.triedDate) - new Date(a.triedDate));
};

// ==================== Statistics ====================

export const getDontBuyStats = async () => {
  try {
    const items = await getDontBuyList();
    
    const byCategory = items.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {});
    
    const bySeverity = items.reduce((acc, item) => {
      acc[item.severity] = (acc[item.severity] || 0) + 1;
      return acc;
    }, {});
    
    const byReaction = items.reduce((acc, item) => {
      acc[item.reaction] = (acc[item.reaction] || 0) + 1;
      return acc;
    }, {});
    
    return {
      total: items.length,
      byCategory,
      bySeverity,
      byReaction,
      mostCommonReaction: Object.entries(byReaction).sort((a, b) => b[1] - a[1])[0]?.[0] || 'none',
    };
  } catch (error) {
    console.error('Error calculating stats:', error);
    return {
      total: 0,
      byCategory: {},
      bySeverity: {},
      byReaction: {},
      mostCommonReaction: 'none',
    };
  }
};

// ==================== Display Utilities ====================

export const getCategoryIcon = (category) => {
  const icons = {
    medication: 'medkit',
    food: 'fast-food',
    beauty: 'sparkles',
    household: 'home',
    other: 'warning',
  };
  return icons[category] || icons.other;
};

export const getCategoryColor = (category) => {
  const colors = {
    medication: '#FF6B6B',
    food: '#FFE66D',
    beauty: '#95E1D3',
    household: '#4ECDC4',
    other: '#A8DADC',
  };
  return colors[category] || colors.other;
};

export const getSeverityColor = (severity) => {
  const colors = {
    mild: '#FFE66D',
    moderate: '#FFB347',
    severe: '#FF6B6B',
  };
  return colors[severity] || colors.moderate;
};

export const getSeverityIcon = (severity) => {
  const icons = {
    mild: 'alert-circle-outline',
    moderate: 'alert-circle',
    severe: 'warning',
  };
  return icons[severity] || icons.moderate;
};

export const getReactionLabel = (reaction) => {
  const labels = {
    headache: 'Headache',
    rash: 'Skin Rash',
    stomach: 'Stomach Issues',
    allergy: 'Allergic Reaction',
    ineffective: 'Didn\'t Work',
    other: 'Other Issue',
  };
  return labels[reaction] || 'Other';
};

// ==================== Export for Sharing ====================

export const exportDontBuyList = async () => {
  try {
    const items = await getDontBuyList();
    
    const exportData = {
      exportDate: new Date().toISOString(),
      totalItems: items.length,
      items: items.map(item => ({
        name: item.name,
        brand: item.brand,
        category: item.category,
        reason: item.reason,
        reaction: getReactionLabel(item.reaction),
        severity: item.severity,
        triedDate: item.triedDate,
        notes: item.notes,
        alternatives: item.alternatives,
      })),
    };
    
    return {
      success: true,
      data: exportData,
      text: formatAsText(exportData),
    };
  } catch (error) {
    console.error('Error exporting dont-buy list:', error);
    return { success: false, error: error.message };
  }
};

const formatAsText = (exportData) => {
  let text = `DON'T BUY AGAIN LIST\n`;
  text += `Exported: ${new Date(exportData.exportDate).toLocaleDateString()}\n`;
  text += `Total Items: ${exportData.totalItems}\n\n`;
  text += `${'='.repeat(50)}\n\n`;
  
  exportData.items.forEach((item, index) => {
    text += `${index + 1}. ${item.name}${item.brand ? ` (${item.brand})` : ''}\n`;
    text += `   Category: ${item.category}\n`;
    text += `   Reason: ${item.reason}\n`;
    text += `   Reaction: ${item.reaction}\n`;
    text += `   Severity: ${item.severity.toUpperCase()}\n`;
    text += `   Tried: ${new Date(item.triedDate).toLocaleDateString()}\n`;
    if (item.notes) {
      text += `   Notes: ${item.notes}\n`;
    }
    if (item.alternatives && item.alternatives.length > 0) {
      text += `   Alternatives: ${item.alternatives.join(', ')}\n`;
    }
    text += `\n`;
  });
  
  return text;
};

// ==================== Sample Data ====================

export const createSampleDontBuyList = async () => {
  const samples = [
    {
      name: 'Advil PM',
      brand: 'Advil',
      category: 'medication',
      reason: 'Gave me terrible headaches the next day',
      reaction: 'headache',
      severity: 'moderate',
      triedDate: '2024-11-01',
      notes: 'Tried for 3 nights, headache every morning',
      alternatives: ['Tylenol PM worked better'],
    },
    {
      name: 'Spicy Ramen Brand X',
      brand: 'Brand X',
      category: 'food',
      reason: 'Upset my stomach badly',
      reaction: 'stomach',
      severity: 'severe',
      triedDate: '2024-10-15',
      notes: 'Too spicy, felt sick for hours',
      alternatives: ['Milder ramen brands'],
    },
    {
      name: 'Coconut Shampoo',
      brand: 'Beauty Co',
      category: 'beauty',
      reason: 'Made my scalp itchy',
      reaction: 'rash',
      severity: 'mild',
      triedDate: '2024-09-20',
      notes: 'Used for a week, constant itching',
      alternatives: ['Fragrance-free shampoo'],
    },
  ];
  
  for (const sample of samples) {
    await addDontBuyItem(sample);
  }
  
  return { success: true, count: samples.length };
};
