import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../providers/ThemeProvider';
import { useFocusEffect } from '@react-navigation/native';
import {
  getSharedShoppingList,
  addSharedShoppingItem,
  claimShoppingItem,
  unclaimShoppingItem,
  markItemPurchased,
  removeSharedShoppingItem,
  clearPurchasedItems,
  getSharedShoppingStats,
  getHousehold,
} from '../utils/meal-planning';

/**
 * Shared Shopping Screen - Household shopping coordination
 * 
 * Solves: "I'm at the store, did someone already buy chicken?"
 *         "Who's getting milk?"
 *         "I got it already!"
 * 
 * Features:
 * - Real-time "who's getting this" coordination
 * - Claim items ("I'll get this")
 * - Mark purchased ("Got it!")
 * - See what everyone's buying
 * - Prevent duplicate purchases
 */

export const SharedShoppingScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [shoppingList, setShoppingList] = useState([]);
  const [household, setHousehold] = useState(null);
  const [stats, setStats] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Add item modal
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const list = await getSharedShoppingList();
    const householdData = await getHousehold();
    
    if (householdData) {
      const statistics = getSharedShoppingStats(list, householdData);
      setStats(statistics);
      setCurrentUser(householdData.members[0]); // TODO: Get actual current user
    }
    
    setShoppingList(list);
    setHousehold(householdData);
  };

  const handleAddItem = async () => {
    if (!newItemName.trim()) {
      Alert.alert('Error', 'Please enter an item name');
      return;
    }

    const result = await addSharedShoppingItem({
      name: newItemName.trim(),
      quantity: parseInt(newItemQuantity) || 1,
      category: 'Manual',
      addedBy: currentUser?.id,
      addedByName: currentUser?.name,
      priority: 'normal',
    });

    if (result.success) {
      setNewItemName('');
      setNewItemQuantity('1');
      setAddModalVisible(false);
      await loadData();
    } else {
      Alert.alert('Error', result.message || 'Failed to add item');
    }
  };

  const handleClaimItem = async (item) => {
    if (item.claimedBy && item.claimedBy !== currentUser?.id) {
      // Someone else claimed it
      Alert.alert(
        'Already Claimed',
        `${item.claimedByName} is getting this. Take it from them?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Take It',
            onPress: async () => {
              await claimShoppingItem(item.id, currentUser?.id, currentUser?.name);
              await loadData();
            },
          },
        ]
      );
    } else if (item.claimedBy === currentUser?.id) {
      // Unclaim it
      await unclaimShoppingItem(item.id);
      await loadData();
    } else {
      // Claim it
      await claimShoppingItem(item.id, currentUser?.id, currentUser?.name);
      await loadData();
    }
  };

  const handleMarkPurchased = async (item) => {
    await markItemPurchased(item.id, currentUser?.id, currentUser?.name);
    await loadData();
  };

  const handleRemoveItem = async (item) => {
    Alert.alert(
      'Remove Item',
      `Remove "${item.name}" from shopping list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removeSharedShoppingItem(item.id);
            await loadData();
          },
        },
      ]
    );
  };

  const handleClearPurchased = () => {
    const purchasedCount = shoppingList.filter(i => i.purchased).length;
    
    if (purchasedCount === 0) {
      Alert.alert('No Items', 'No purchased items to clear');
      return;
    }

    Alert.alert(
      'Clear Purchased',
      `Remove ${purchasedCount} purchased ${purchasedCount === 1 ? 'item' : 'items'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          onPress: async () => {
            await clearPurchasedItems();
            await loadData();
          },
        },
      ]
    );
  };

  const renderItem = (item) => {
    const claimedByMe = item.claimedBy === currentUser?.id;
    const claimedByOther = item.claimedBy && !claimedByMe;
    const claimer = household?.members.find(m => m.id === item.claimedBy);
    const purchaser = household?.members.find(m => m.id === item.purchasedBy);

    if (item.purchased) {
      return (
        <View
          key={item.id}
          style={[styles.itemCard, styles.purchasedCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.itemLeft}>
            <Ionicons name="checkmark-circle" size={28} color={colors.primary} />
            <View style={styles.itemDetails}>
              <Text style={[styles.itemName, styles.purchasedText, { color: colors.secondaryText }]}>
                {item.name}
                {item.quantity > 1 && ` (×${item.quantity})`}
              </Text>
              <Text style={[styles.itemMeta, { color: colors.secondaryText }]}>
                Got by {purchaser?.name || item.purchasedByName}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => handleRemoveItem(item)}>
            <Ionicons name="close-circle" size={24} color={colors.secondaryText} />
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View
        key={item.id}
        style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <View style={styles.itemLeft}>
          {/* Claim checkbox */}
          <TouchableOpacity onPress={() => handleClaimItem(item)}>
            <Ionicons
              name={claimedByMe ? 'checkbox' : claimedByOther ? 'checkbox-outline' : 'square-outline'}
              size={28}
              color={claimedByMe ? colors.primary : claimedByOther ? claimer?.color : colors.secondaryText}
            />
          </TouchableOpacity>

          <View style={styles.itemDetails}>
            <Text style={[styles.itemName, { color: colors.text }]}>
              {item.name}
              {item.quantity > 1 && ` (×${item.quantity})`}
            </Text>
            
            {claimedByOther && (
              <View style={styles.claimedBadge}>
                <View style={[styles.claimedDot, { backgroundColor: claimer?.color }]} />
                <Text style={[styles.claimedText, { color: colors.secondaryText }]}>
                  {claimer?.name} is getting this
                </Text>
              </View>
            )}
            
            {claimedByMe && (
              <View style={styles.claimedBadge}>
                <View style={[styles.claimedDot, { backgroundColor: currentUser?.color }]} />
                <Text style={[styles.claimedText, { color: colors.secondaryText }]}>
                  You're getting this
                </Text>
              </View>
            )}
            
            {item.forMeal && (
              <Text style={[styles.itemMeta, { color: colors.secondaryText }]}>
                For meal plan
              </Text>
            )}
          </View>
        </View>

        <View style={styles.itemActions}>
          {claimedByMe && (
            <TouchableOpacity
              style={[styles.gotItButton, { backgroundColor: colors.primary }]}
              onPress={() => handleMarkPurchased(item)}
            >
              <Text style={styles.gotItText}>Got it!</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => handleRemoveItem(item)}>
            <Ionicons name="trash-outline" size={20} color={colors.secondaryText} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const needItems = shoppingList.filter(i => !i.purchased);
  const purchasedItems = shoppingList.filter(i => i.purchased);

  if (!household) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Shared Shopping</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.setupContainer}>
          <Ionicons name="people-outline" size={80} color={colors.secondaryText} />
          <Text style={[styles.setupTitle, { color: colors.text }]}>Setup Household First</Text>
          <Text style={[styles.setupDescription, { color: colors.secondaryText }]}>
            Create a household to share shopping lists with family or roommates
          </Text>
          <TouchableOpacity
            style={[styles.setupButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('HouseholdSetup')}
          >
            <Text style={styles.setupButtonText}>Setup Household</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Shared Shopping</Text>
        <TouchableOpacity onPress={() => setAddModalVisible(true)} style={styles.addButton}>
          <Ionicons name="add-circle" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Stats Card */}
      {stats && (
        <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.text }]}>{stats.unclaimed}</Text>
            <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Unclaimed</Text>
          </View>
          
          {household.members.map(member => {
            const memberStats = stats.byMember[member.id];
            if (memberStats.claimed === 0) return null;
            
            return (
              <View key={member.id} style={styles.statItem}>
                <View style={styles.statWithDot}>
                  <View style={[styles.statDot, { backgroundColor: member.color }]} />
                  <Text style={[styles.statNumber, { color: colors.text }]}>{memberStats.claimed}</Text>
                </View>
                <Text style={[styles.statLabel, { color: colors.secondaryText }]}>{member.name}</Text>
              </View>
            );
          })}
        </View>
      )}

      <ScrollView style={styles.scrollView}>
        {needItems.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              NEED TO BUY ({needItems.length})
            </Text>
            {needItems.map(renderItem)}
          </View>
        )}

        {purchasedItems.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                PURCHASED ({purchasedItems.length})
              </Text>
              <TouchableOpacity onPress={handleClearPurchased}>
                <Text style={[styles.clearButton, { color: colors.primary }]}>Clear</Text>
              </TouchableOpacity>
            </View>
            {purchasedItems.map(renderItem)}
          </View>
        )}

        {shoppingList.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="cart-outline" size={80} color={colors.secondaryText} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Items Yet</Text>
            <Text style={[styles.emptyDescription, { color: colors.secondaryText }]}>
              Add items manually or from your meal plan
            </Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add Item Modal */}
      <Modal visible={addModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Item</Text>
            
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Item name"
              placeholderTextColor={colors.secondaryText}
              value={newItemName}
              onChangeText={setNewItemName}
              autoFocus
            />
            
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Quantity"
              placeholderTextColor={colors.secondaryText}
              value={newItemQuantity}
              onChangeText={setNewItemQuantity}
              keyboardType="number-pad"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.border }]}
                onPress={() => {
                  setAddModalVisible(false);
                  setNewItemName('');
                  setNewItemQuantity('1');
                }}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleAddItem}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  addButton: {
    padding: 4,
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statWithDot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  clearButton: {
    fontSize: 14,
    fontWeight: '600',
  },
  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  purchasedCard: {
    opacity: 0.6,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
  },
  purchasedText: {
    textDecorationLine: 'line-through',
  },
  claimedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  claimedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  claimedText: {
    fontSize: 12,
  },
  itemMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  gotItButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  gotItText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  setupContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  setupTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 12,
  },
  setupDescription: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  setupButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  setupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 12,
  },
  emptyDescription: {
    fontSize: 15,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '85%',
    padding: 24,
    borderRadius: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
