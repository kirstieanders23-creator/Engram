import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, RefreshControl, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../providers/ThemeProvider';
import { useFocusEffect } from '@react-navigation/native';
import {
  getShoppingList,
  removeFromShoppingList,
  toggleShoppingListItem,
  clearCheckedItems,
  addToShoppingList,
  getShoppingListStats,
} from '../utils/expiration-tracker';

/**
 * Shopping List Screen - Smart grocery list with expiration-based suggestions
 * Knows what you have, what's expired, and what you need
 */

export const ShoppingListScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [shoppingList, setShoppingList] = useState([]);
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}
      accessible accessibilityLabel="Shopping List Screen">
      <View style={styles.header} accessible accessibilityRole="header">
        <Text style={[styles.title, { color: colors.text }]} allowFontScaling accessibilityLabel="Shopping List">Shopping List</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.accent }]}
          onPress={openAddModal}
          accessibilityLabel="Add shopping item"
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer} accessible accessibilityLabel="No shopping items">
          <Text style={[styles.emptyText, { color: colors.textSecondary }]} allowFontScaling>No items yet</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          accessibilityLabel="Shopping list items"
        />
      )}

      <ShoppingItemModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={editingItem ? handleUpdateItem : handleAddItem}
        onDelete={editingItem ? handleDeleteItem : null}
        isEditing={!!editingItem}
        colors={colors}
        item={editingItem}
      />
    </SafeAreaView>
  );
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const result = await removeFromShoppingList(itemId);
            if (result.success) {
              await loadShoppingList();
            }
          },
        },
      ]
    );
  };

  const handleClearChecked = async () => {
    if (stats?.checked === 0) {
      Alert.alert('No Items', 'No checked items to clear');
      return;
    }

    Alert.alert(
      'Clear Checked Items',
      `Remove ${stats.checked} checked ${stats.checked === 1 ? 'item' : 'items'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          onPress: async () => {
            const result = await clearCheckedItems();
            if (result.success) {
              await loadShoppingList();
            }
          },
        },
      ]
    );
  };

  const handleAddItem = async () => {
    if (!newItemName.trim()) {
      Alert.alert('Error', 'Please enter an item name');
      return;
    }

    const result = await addToShoppingList({
      name: newItemName.trim(),
      reason: 'manual',
      priority: 'normal',
    });

    if (result.success) {
      setNewItemName('');
      setShowAddModal(false);
      await loadShoppingList();
    } else {
      Alert.alert('Error', result.message || 'Failed to add item');
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent':
        return { name: 'alert-circle', color: '#FF3B30' };
      case 'normal':
        return { name: 'ellipse', color: colors.primary };
      case 'low':
        return { name: 'ellipse-outline', color: colors.secondaryText };
      default:
        return { name: 'ellipse', color: colors.secondaryText };
    }
  };

  const getReasonText = (reason) => {
    switch (reason) {
      case 'expired':
        return '(Expired)';
      case 'expiring':
        return '(Expiring soon)';
      case 'low':
        return '(Running low)';
      case 'routine':
        return '(Suggested)';
      default:
        return '';
    }
  };

  const uncheckedItems = shoppingList.filter(i => !i.checked);
  const checkedItems = shoppingList.filter(i => i.checked);

  if (shoppingList.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Shopping List</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={80} color={colors.secondaryText} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Shopping List Empty
          </Text>
          <Text style={[styles.emptyDescription, { color: colors.secondaryText }]}>
            Items will appear here when:
            {'\n'}• Products expire or run low
            {'\n'}• You manually add items
            {'\n'}• Smart suggestions detect needs
          </Text>

          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="add" size={24} color="#fff" />
            <Text style={styles.addButtonText}>Add Item</Text>
          </TouchableOpacity>
        </View>

        {showAddModal && (
          <View style={[styles.modal, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add to Shopping List</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Item name"
              placeholderTextColor={colors.secondaryText}
              value={newItemName}
              onChangeText={setNewItemName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.border }]}
                onPress={() => {
                  setShowAddModal(false);
                  setNewItemName('');
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
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Shopping List</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addIconButton}>
          <Ionicons name="add-circle" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {stats && (
        <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.text }]}>{stats.unchecked}</Text>
            <Text style={[styles.statLabel, { color: colors.secondaryText }]}>To Buy</Text>
          </View>
          {stats.urgent > 0 && (
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#FF3B30' }]}>{stats.urgent}</Text>
              <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Urgent</Text>
            </View>
          )}
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.text }]}>{stats.checked}</Text>
            <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Done</Text>
          </View>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        {uncheckedItems.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>TO BUY</Text>
            {uncheckedItems.map((item) => {
              const priorityIcon = getPriorityIcon(item.priority);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => handleToggleItem(item.id)}
                  onLongPress={() => handleRemoveItem(item.id, item.name)}
                >
                  <Ionicons
                    name={priorityIcon.name}
                    size={24}
                    color={priorityIcon.color}
                    style={styles.priorityIcon}
                  />
                  <View style={styles.itemContent}>
                    <Text style={[styles.itemName, { color: colors.text }]}>
                      {item.name}
                    </Text>
                    {item.reason !== 'manual' && (
                      <Text style={[styles.itemReason, { color: colors.secondaryText }]}>
                        {getReasonText(item.reason)}
                      </Text>
                    )}
                  </View>
                  <Ionicons name="ellipse-outline" size={24} color={colors.secondaryText} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {checkedItems.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>COMPLETED</Text>
              <TouchableOpacity onPress={handleClearChecked}>
                <Text style={[styles.clearButton, { color: colors.primary }]}>Clear All</Text>
              </TouchableOpacity>
            </View>
            {checkedItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.itemCard, styles.checkedItemCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => handleToggleItem(item.id)}
                onLongPress={() => handleRemoveItem(item.id, item.name)}
              >
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} style={styles.priorityIcon} />
                <View style={styles.itemContent}>
                  <Text style={[styles.itemName, styles.checkedItemName, { color: colors.secondaryText }]}>
                    {item.name}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {showAddModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add to Shopping List</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Item name (e.g., Eggs, Dish soap)"
              placeholderTextColor={colors.secondaryText}
              value={newItemName}
              onChangeText={setNewItemName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.border }]}
                onPress={() => {
                  setShowAddModal(false);
                  setNewItemName('');
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
  addIconButton: {
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
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
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
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  checkedItemCard: {
    opacity: 0.6,
  },
  priorityIcon: {
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
  },
  checkedItemName: {
    textDecorationLine: 'line-through',
  },
  itemReason: {
    fontSize: 13,
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    lineHeight: 24,
    marginBottom: 32,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
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
