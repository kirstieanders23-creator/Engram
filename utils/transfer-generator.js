import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

/**
 * Transfer System - Generate shareable product links for home sales
 * "Carfax for Homes" feature
 */

const STORAGE_KEY = '@engram_transfers';
const TRANSFER_EXPIRATION_HOURS = 48; // Links expire after 48 hours

/**
 * Generate a secure transfer link for a product
 */
export const generateTransferLink = async (product, options = {}) => {
  try {
    const {
      expirationHours = TRANSFER_EXPIRATION_HOURS,
      includePrice = false, // Privacy: don't share price by default
      includeNotes = false, // Privacy: don't share personal notes
    } = options;

    // Generate unique transfer ID
    const transferId = await generateTransferId();
    
    // Create transfer payload (selective data sharing)
    const transferData = {
      id: transferId,
      productId: product.id,
      // Basic product info
      name: product.name,
      category: product.category,
      room: product.room,
      
      // Purchase & warranty (for buyer to track)
      purchaseDate: product.purchaseDate,
      warrantyDate: product.warrantyDate,
      
      // Care instructions (helpful for new owner)
      careInstructions: product.careInstructions,
      isDishwasherSafe: product.isDishwasherSafe,
      cleaningTips: product.cleaningTips,
      usageNotes: includeNotes ? product.usageNotes : null,
      
      // Manual & specs
      manualUrl: product.manualUrl,
      specifications: product.specifications,
      
      // Photos (first 3 only to save bandwidth)
      photos: product.photos ? product.photos.slice(0, 3) : [],
      
      // Optional data
      purchasePrice: includePrice ? product.purchasePrice : null,
      purchaseLocation: includePrice ? product.purchaseLocation : null,
      
      // Transfer metadata
      createdAt: Date.now(),
      expiresAt: Date.now() + (expirationHours * 60 * 60 * 1000),
      viewed: false,
      viewedAt: null,
      claimed: false,
      claimedAt: null,
    };
    
    // Store transfer locally (for seller to track)
    await saveTransfer(transferData);
    
    // Generate shareable link
    const link = `https://engram.app/transfer/${transferId}`;
    
    return {
      success: true,
      transferId,
      link,
      expiresAt: transferData.expiresAt,
    };
  } catch (error) {
    console.error('Failed to generate transfer link:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Generate QR code data for transfer link
 */
export const generateTransferQRData = (transferId) => {
  return `https://engram.app/transfer/${transferId}`;
};

/**
 * Retrieve transfer data by ID (for buyer)
 */
export const getTransferData = async (transferId) => {
  try {
    const transfers = await getAllTransfers();
    const transfer = transfers.find(t => t.id === transferId);
    
    if (!transfer) {
      return {
        success: false,
        error: 'Transfer not found',
      };
    }
    
    // Check expiration
    if (Date.now() > transfer.expiresAt) {
      return {
        success: false,
        error: 'Transfer link has expired',
      };
    }
    
    // Mark as viewed
    if (!transfer.viewed) {
      transfer.viewed = true;
      transfer.viewedAt = Date.now();
      await saveTransfer(transfer);
    }
    
    return {
      success: true,
      data: transfer,
    };
  } catch (error) {
    console.error('Failed to get transfer data:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Claim a transfer (buyer accepts and adds to their inventory)
 */
export const claimTransfer = async (transferId, buyerUserId) => {
  try {
    const transfers = await getAllTransfers();
    const transfer = transfers.find(t => t.id === transferId);
    
    if (!transfer) {
      return {
        success: false,
        error: 'Transfer not found',
      };
    }
    
    if (transfer.claimed) {
      return {
        success: false,
        error: 'Transfer already claimed',
      };
    }
    
    if (Date.now() > transfer.expiresAt) {
      return {
        success: false,
        error: 'Transfer link has expired',
      };
    }
    
    // Mark as claimed
    transfer.claimed = true;
    transfer.claimedAt = Date.now();
    transfer.claimedBy = buyerUserId;
    await saveTransfer(transfer);
    
    // Return product data for buyer to add to their inventory
    const productData = {
      name: transfer.name,
      category: transfer.category,
      room: transfer.room,
      purchaseDate: transfer.purchaseDate,
      warrantyDate: transfer.warrantyDate,
      careInstructions: transfer.careInstructions,
      isDishwasherSafe: transfer.isDishwasherSafe,
      cleaningTips: transfer.cleaningTips,
      usageNotes: transfer.usageNotes,
      manualUrl: transfer.manualUrl,
      specifications: transfer.specifications,
      photos: transfer.photos,
      purchasePrice: transfer.purchasePrice,
      purchaseLocation: transfer.purchaseLocation,
      
      // Mark as transferred
      isTransferred: true,
      transferredFrom: transfer.productId,
      transferredAt: Date.now(),
    };
    
    return {
      success: true,
      productData,
    };
  } catch (error) {
    console.error('Failed to claim transfer:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get all active transfers for current user (seller view)
 */
export const getMyTransfers = async () => {
  try {
    const transfers = await getAllTransfers();
    
    // Filter out expired transfers
    const activeTransfers = transfers.filter(t => Date.now() <= t.expiresAt);
    
    // Sort by creation date (newest first)
    activeTransfers.sort((a, b) => b.createdAt - a.createdAt);
    
    return activeTransfers;
  } catch (error) {
    console.error('Failed to get transfers:', error);
    return [];
  }
};

/**
 * Delete/revoke a transfer
 */
export const deleteTransfer = async (transferId) => {
  try {
    const transfers = await getAllTransfers();
    const filtered = transfers.filter(t => t.id !== transferId);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Failed to delete transfer:', error);
    return false;
  }
};

/**
 * Get transfer statistics
 */
export const getTransferStats = async () => {
  try {
    const transfers = await getAllTransfers();
    const now = Date.now();
    
    const active = transfers.filter(t => !t.claimed && now <= t.expiresAt);
    const viewed = transfers.filter(t => t.viewed && !t.claimed);
    const claimed = transfers.filter(t => t.claimed);
    const expired = transfers.filter(t => now > t.expiresAt && !t.claimed);
    
    return {
      total: transfers.length,
      active: active.length,
      viewed: viewed.length,
      claimed: claimed.length,
      expired: expired.length,
    };
  } catch (error) {
    console.error('Failed to get transfer stats:', error);
    return {
      total: 0,
      active: 0,
      viewed: 0,
      claimed: 0,
      expired: 0,
    };
  }
};

// ===== Helper Functions =====

/**
 * Generate a unique transfer ID
 */
const generateTransferId = async () => {
  const randomBytes = await Crypto.getRandomBytesAsync(16);
  const hex = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return `tr_${hex}`;
};

/**
 * Save a transfer to storage
 */
const saveTransfer = async (transfer) => {
  try {
    const transfers = await getAllTransfers();
    const index = transfers.findIndex(t => t.id === transfer.id);
    
    if (index >= 0) {
      transfers[index] = transfer;
    } else {
      transfers.push(transfer);
    }
    
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(transfers));
  } catch (error) {
    console.error('Failed to save transfer:', error);
    throw error;
  }
};

/**
 * Get all transfers from storage
 */
const getAllTransfers = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to get transfers:', error);
    return [];
  }
};

/**
 * Clean up expired transfers (call periodically)
 */
export const cleanupExpiredTransfers = async () => {
  try {
    const transfers = await getAllTransfers();
    const now = Date.now();
    
    // Keep only non-expired transfers or claimed transfers (for history)
    const filtered = transfers.filter(t => 
      now <= t.expiresAt || t.claimed
    );
    
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    
    return {
      removed: transfers.length - filtered.length,
      remaining: filtered.length,
    };
  } catch (error) {
    console.error('Failed to cleanup transfers:', error);
    return {
      removed: 0,
      remaining: 0,
    };
  }
};

/**
 * Format transfer link for sharing
 */
export const formatTransferMessage = (product, link, expiresAt) => {
  const expiryDate = new Date(expiresAt);
  const dateStr = expiryDate.toLocaleDateString();
  
  return `Check out this product I'm including with the home:\n\n` +
    `${product.name}\n` +
    `${product.category}${product.room ? ` • ${product.room}` : ''}\n\n` +
    `View care instructions, warranty info, and manual:\n` +
    `${link}\n\n` +
    `(Link expires ${dateStr})`;
};
