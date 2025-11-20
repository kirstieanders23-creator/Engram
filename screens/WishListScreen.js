import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, RefreshControl, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../providers/ThemeProvider';
import { useFocusEffect } from '@react-navigation/native';
import { usePremium } from '../providers/PremiumProvider';
import { PREMIUM_FEATURES } from '../utils/monetization';

/**
 * Wish List - Manage saved upgrade items with price tracking
 * Shows items sorted by priority with quick actions
 */

export const WishListScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { checkFeatureAccess } = usePremium();
  const [wishlist, setWishlist] = useState([]);
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [targetPrice, setTargetPrice] = useState('');

  // Check premium access on mount
  useEffect(() => {
    const verifyAccess = async () => {
      const hasAccess = await checkFeatureAccess(PREMIUM_FEATURES.WISH_LIST, navigation);
      if (!hasAccess) return;
    };
    verifyAccess();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadWishList();
    }, [])
  );

  const loadWishList = async () => {
    try {
      const { getWishListSorted, getWishListStats } = await import('../utils/wishlist-storage');
      const items = await getWishListSorted();
      const statistics = await getWishListStats();
      
      setWishlist(items);
      setStats(statistics);
    } catch (error) {
      console.error('Failed to load wish list:', error);
      Alert.alert('Error', 'Failed to load wish list');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadWishList();
    setRefreshing(false);
  };

  const handleRemove = async (itemId) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this from your wish list?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const { removeFromWishList } = await import('../utils/wishlist-storage');
              await removeFromWishList(itemId);
              await loadWishList();
            } catch (error) {
              Alert.alert('Error', 'Failed to remove item');
            }
          },
        },
      ]
    );
  };

  const handleSetPriceAlert = async (item) => {
    setEditingItem(item);
    setTargetPrice(item.targetPrice?.toString() || '');
  };

  const handleSavePriceAlert = async () => {
    if (!editingItem) return;
    
    try {
      const { updateWishListItem } = await import('../utils/wishlist-storage');
      const price = parseFloat(targetPrice);
      
      if (isNaN(price) || price <= 0) {
        Alert.alert('Invalid Price', 'Please enter a valid price');
        return;
      }
      
      await updateWishListItem(editingItem.id, {
        targetPrice: price,
      });
      
      Alert.alert('Price Alert Set! 📉', `You'll be notified if the price drops to $${price.toFixed(2)} or lower.`);
      setEditingItem(null);
      setTargetPrice('');
      await loadWishList();
    } catch (error) {
      Alert.alert('Error', 'Failed to set price alert');
    }
  };

  const handleChangePriority = async (item, newPriority) => {
    try {
      const { updateWishListItem } = await import('../utils/wishlist-storage');
      await updateWishListItem(item.id, { priority: newPriority });
      await loadWishList();
    } catch (error) {
      Alert.alert('Error', 'Failed to update priority');
    }
  };

  const handleViewProduct = (currentProductId) => {
    if (currentProductId) {
      navigation.navigate('ProductDetail', { productId: currentProductId });
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#FF5252';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return 'flash';
      case 'medium': return 'star';
      case 'low': return 'time';
      default: return 'ellipse';
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} accessible accessibilityLabel="Wish List Screen">
      {/* Header */}
      <View style={styles.header} accessible accessibilityRole="header">
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} allowFontScaling accessibilityLabel="Wish List">Wish List</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Stats Card */}
      {stats && (
        <View style={[styles.statsCard, { backgroundColor: colors.card }]} accessible accessibilityLabel="Wish List Stats">
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.accent }]} allowFontScaling accessibilityLabel={`Total items: ${stats.totalItems}`}>{stats.totalItems}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]} allowFontScaling accessibilityLabel="Items">Items</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.primary }]} allowFontScaling accessibilityLabel={`Total value: $${stats.totalValue.toFixed(0)}`}>${stats.totalValue.toFixed(0)}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]} allowFontScaling accessibilityLabel="Total Value">Total Value</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#FF5252' }]} allowFontScaling accessibilityLabel={`High Priority: ${stats.highPriority}`}>{stats.highPriority}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]} allowFontScaling accessibilityLabel="High Priority">High Priority</Text>
          </View>
        </View>
      )}

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {wishlist.length > 0 ? (
          <View style={styles.wishlistContainer} accessible accessibilityLabel="Wish List Items">
            {wishlist.map((item) => (
              <View key={item.id} style={[styles.wishCard, { backgroundColor: colors.card }]} accessible accessibilityLabel={`Wish: ${item.model}, for ${item.productName}, price $${item.price}`}> 
                {/* Priority Badge */}
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]} accessibilityLabel={`Priority: ${item.priority}`}> 
                  <Ionicons name={getPriorityIcon(item.priority)} size={12} color="#fff" />
                </View>

                {/* Item Info */}
                <View style={styles.wishHeader}>
                  <View style={styles.wishInfo}>
                    <Text style={[styles.wishName, { color: colors.text }]} allowFontScaling accessibilityLabel={`Model: ${item.model}`}>{item.model}</Text>
                    <Text style={[styles.wishProduct, { color: colors.textSecondary }]} allowFontScaling accessibilityLabel={`For: ${item.productName}`}>For: {item.productName}</Text>
                  </View>
                  <Text style={[styles.wishPrice, { color: colors.accent }]} allowFontScaling accessibilityLabel={`Price: $${item.price}`}>${item.price}</Text>
                </View>

                {/* Features */}
                {item.features && item.features.length > 0 && (
                  <View style={styles.featuresList} accessible accessibilityLabel="Features">
                    {item.features.slice(0, 2).map((feature, index) => (
                      <View key={index} style={[styles.featureChip, { backgroundColor: colors.background }]}>
                        <Text style={[styles.featureText, { color: colors.text }]} numberOfLines={1} allowFontScaling accessibilityLabel={`Feature: ${feature}`}>{feature}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Price Alert */}
                {item.targetPrice && (
                  <View style={[styles.priceAlert, { backgroundColor: colors.background }]} accessible accessibilityLabel={`Price alert at $${item.targetPrice}`}>
                    <Ionicons name="notifications" size={16} color={colors.primary} />
                    <Text style={[styles.priceAlertText, { color: colors.text }]} allowFontScaling accessibilityLabel={`Alert at $${item.targetPrice}`}>Alert at ${item.targetPrice}</Text>
                  </View>
                )}

                {/* Actions */}
                <View style={styles.wishActions} accessible accessibilityLabel="Actions">
                  <TouchableOpacity
                    style={styles.actionIcon}
                    onPress={() => handleSetPriceAlert(item)}
                    accessibilityLabel="Set price alert"
                  >
                    <Ionicons name="notifications-outline" size={22} color={colors.primary} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.actionIcon}
                    onPress={() => {
                      Alert.alert(
                        'Set Priority',
                        'Choose priority level',
                        [
                          {
                            text: 'Low',
                            onPress: () => handleChangePriority(item, 'low'),
                          },
                          {
                            text: 'Medium',
                            onPress: () => handleChangePriority(item, 'medium'),
                          },
                          {
                            text: 'High',
                            onPress: () => handleChangePriority(item, 'high'),
                          },
                          { text: 'Cancel', style: 'cancel' },
                        ]
                      );
                    }}
                    accessibilityLabel="Set priority"
                  >
                    <Ionicons name="flag-outline" size={22} color={getPriorityColor(item.priority)} />
                  </TouchableOpacity>

                  {item.currentProductId && (
                    <TouchableOpacity
                      style={styles.actionIcon}
                      onPress={() => handleViewProduct(item.currentProductId)}
                      accessibilityLabel="View product"
                    >
                      <Ionicons name="eye-outline" size={22} color={colors.text} />
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity
                    style={styles.actionIcon}
                    onPress={() => handleRemove(item.id)}
                    accessibilityLabel="Remove from wish list"
                  >
                    <Ionicons name="trash-outline" size={22} color="#FF5252" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState} accessible accessibilityLabel="No items in wish list">
            <Ionicons name="heart-outline" size={64} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.text }]} allowFontScaling accessibilityLabel="No Items Yet">No Items Yet</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]} allowFontScaling accessibilityLabel="Find upgrades from your product details to add items to your wish list">Find upgrades from your product details to add items to your wish list</Text>
          </View>
        )}
      </ScrollView>

      {/* Price Alert Modal */}
      {editingItem && (
        <View style={[styles.modal, { backgroundColor: 'rgba(0,0,0,0.5)' }]} accessible accessibilityLabel="Set Price Alert Modal"> 
          <View style={[styles.modalContent, { backgroundColor: colors.card }]} accessible accessibilityRole="dialog">
            <Text style={[styles.modalTitle, { color: colors.text }]} allowFontScaling accessibilityLabel="Set Price Alert">Set Price Alert</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]} allowFontScaling accessibilityLabel={editingItem.model}>{editingItem.model}</Text>
            <Text style={[styles.modalLabel, { color: colors.text }]} allowFontScaling accessibilityLabel={`Current Price: $${editingItem.price}`}>Current Price: ${editingItem.price}</Text>
            
            <View style={styles.priceInput} accessible accessibilityLabel="Target Price Input">
              <Text style={[styles.dollarSign, { color: colors.text }]} allowFontScaling accessibilityLabel="Dollar Sign">$</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                value={targetPrice}
                onChangeText={setTargetPrice}
                keyboardType="decimal-pad"
                placeholder="Enter target price"
                placeholderTextColor={colors.textSecondary}
                accessibilityLabel="Enter target price"
                allowFontScaling
              />
            </View>

            <View style={styles.modalActions} accessible accessibilityLabel="Modal Actions">
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.background }]}
                onPress={() => {
                  setEditingItem(null);
                  setTargetPrice('');
                }}
                accessibilityLabel="Cancel"
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]} allowFontScaling accessibilityLabel="Cancel">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.accent }]}
                onPress={handleSavePriceAlert}
                accessibilityLabel="Save Alert"
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]} allowFontScaling accessibilityLabel="Save Alert">Save Alert</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  statsCard: {
    flexDirection: 'row',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 12,
  },
  wishlistContainer: {
    padding: 16,
    gap: 16,
  },
  wishCard: {
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    gap: 12,
  },
  priorityBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wishHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingRight: 32,
  },
  wishInfo: {
    flex: 1,
  },
  wishName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  wishProduct: {
    fontSize: 12,
  },
  wishPrice: {
    fontSize: 20,
    fontWeight: '700',
  },
  featuresList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  featureText: {
    fontSize: 11,
  },
  priceAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  priceAlertText: {
    fontSize: 12,
    fontWeight: '600',
  },
  wishActions: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  actionIcon: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  modal: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    padding: 24,
    borderRadius: 16,
    gap: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 14,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  priceInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dollarSign: {
    fontSize: 24,
    fontWeight: '700',
  },
  input: {
    flex: 1,
    fontSize: 18,
    padding: 12,
    borderWidth: 2,
    borderRadius: 8,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
