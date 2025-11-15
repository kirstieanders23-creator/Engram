import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../providers/ThemeProvider';
import { useFocusEffect } from '@react-navigation/native';
import {
  getDontBuyList,
  addDontBuyItem,
  deleteDontBuyItem,
  checkIfShouldAvoid,
  searchDontBuyList,
  getDontBuyStats,
  getCategoryIcon,
  getCategoryColor,
  getSeverityColor,
  getSeverityIcon,
  getReactionLabel,
  createSampleDontBuyList,
} from '../utils/dont-buy-again';

/**
 * Don't Buy Again Screen
 * 
 * Track products that didn't work - prevent repeat mistakes
 * 
 * Perfect for:
 * - "This med gave me headaches"
 * - "This brand tastes terrible"
 * - "This detergent made me itch"
 * - Medication trials
 * - Food sensitivities
 */

export const DontBuyAgainScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [addModalVisible, setAddModalVisible] = useState(false);
  
  // Form state
  const [newItemName, setNewItemName] = useState('');
  const [newItemBrand, setNewItemBrand] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('other');
  const [newItemReason, setNewItemReason] = useState('');
  const [newItemReaction, setNewItemReaction] = useState('other');
  const [newItemSeverity, setNewItemSeverity] = useState('moderate');
  const [newItemNotes, setNewItemNotes] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadData();
      
      // If coming from barcode scan with product name
      if (route.params?.productName) {
        checkProduct(route.params.productName);
      }
    }, [route.params])
  );

  const loadData = async () => {
    const list = await getDontBuyList();
    const statistics = await getDontBuyStats();
    setItems(list);
    setFilteredItems(list);
    setStats(statistics);
  };

  const checkProduct = async (productName) => {
    const result = await checkIfShouldAvoid(productName);
    if (result.shouldAvoid) {
      Alert.alert(
        '⚠️ Don\'t Buy This!',
        result.warning,
        [{ text: 'OK' }]
      );
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredItems(items);
      return;
    }
    
    const results = await searchDontBuyList(query);
    setFilteredItems(results);
  };

  const handleAddItem = async () => {
    if (!newItemName.trim()) {
      Alert.alert('Error', 'Please enter a product name');
      return;
    }

    if (!newItemReason.trim()) {
      Alert.alert('Error', 'Please enter why you don\'t want to buy this again');
      return;
    }

    const result = await addDontBuyItem({
      name: newItemName.trim(),
      brand: newItemBrand.trim(),
      category: newItemCategory,
      reason: newItemReason.trim(),
      reaction: newItemReaction,
      severity: newItemSeverity,
      notes: newItemNotes.trim(),
    });

    if (result.success) {
      setNewItemName('');
      setNewItemBrand('');
      setNewItemReason('');
      setNewItemNotes('');
      setNewItemCategory('other');
      setNewItemReaction('other');
      setNewItemSeverity('moderate');
      setAddModalVisible(false);
      await loadData();
      Alert.alert('Added', 'You won\'t accidentally buy this again!');
    } else {
      Alert.alert('Error', result.error || 'Failed to add item');
    }
  };

  const handleDeleteItem = (item) => {
    Alert.alert(
      'Remove Item',
      `Remove "${item.name}" from list?\n\nYou'll be able to buy this again without warnings.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await deleteDontBuyItem(item.id);
            await loadData();
          },
        },
      ]
    );
  };

  const handleCreateSamples = async () => {
    Alert.alert(
      'Add Sample Items',
      'Add example items to see how it works?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add Samples',
          onPress: async () => {
            await createSampleDontBuyList();
            await loadData();
          },
        },
      ]
    );
  };

  const renderItem = (item) => {
    const categoryColor = getCategoryColor(item.category);
    const categoryIcon = getCategoryIcon(item.category);
    const severityColor = getSeverityColor(item.severity);
    const severityIcon = getSeverityIcon(item.severity);

    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: severityColor, borderLeftWidth: 4 }]}
        onLongPress={() => handleDeleteItem(item)}
      >
        <View style={styles.itemHeader}>
          <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
            <Ionicons name={categoryIcon} size={16} color="#fff" />
          </View>
          <View style={styles.itemTitleContainer}>
            <Text style={[styles.itemName, { color: colors.text }]}>
              {item.name}
            </Text>
            {item.brand && (
              <Text style={[styles.itemBrand, { color: colors.secondaryText }]}>
                {item.brand}
              </Text>
            )}
          </View>
          <Ionicons name={severityIcon} size={24} color={severityColor} />
        </View>

        <View style={[styles.reasonBox, { backgroundColor: colors.background }]}>
          <Ionicons name="warning" size={16} color={severityColor} />
          <Text style={[styles.reasonText, { color: colors.text }]}>
            {item.reason}
          </Text>
        </View>

        <View style={styles.itemMeta}>
          <View style={styles.metaChip}>
            <Text style={[styles.metaText, { color: colors.secondaryText }]}>
              {getReactionLabel(item.reaction)}
            </Text>
          </View>
          <View style={styles.metaChip}>
            <Text style={[styles.metaText, { color: colors.secondaryText }]}>
              {item.severity}
            </Text>
          </View>
          <View style={styles.metaChip}>
            <Text style={[styles.metaText, { color: colors.secondaryText }]}>
              {new Date(item.triedDate).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {item.notes && (
          <Text style={[styles.notesText, { color: colors.secondaryText }]}>
            Note: {item.notes}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Don't Buy Again</Text>
        <TouchableOpacity onPress={() => setAddModalVisible(true)} style={styles.addButton}>
          <Ionicons name="add-circle" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchBar, { backgroundColor: colors.card }]}>
        <Ionicons name="search" size={20} color={colors.secondaryText} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search products..."
          placeholderTextColor={colors.secondaryText}
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Ionicons name="close-circle" size={20} color={colors.secondaryText} />
          </TouchableOpacity>
        )}
      </View>

      {stats && (
        <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
          <View style={styles.statItem}>
            <Ionicons name="warning" size={20} color="#FF6B6B" />
            <Text style={[styles.statNumber, { color: colors.text }]}>{stats.total}</Text>
            <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Items</Text>
          </View>
          {stats.bySeverity.severe > 0 && (
            <>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: '#FF6B6B' }]}>{stats.bySeverity.severe}</Text>
                <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Severe</Text>
              </View>
            </>
          )}
        </View>
      )}

      <ScrollView style={styles.scrollView}>
        {filteredItems.length > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {searchQuery ? `SEARCH RESULTS (${filteredItems.length})` : `ALL ITEMS (${filteredItems.length})`}
            </Text>
            {filteredItems.map(renderItem)}
          </View>
        ) : items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle-outline" size={80} color={colors.secondaryText} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Nothing to Avoid Yet</Text>
            <Text style={[styles.emptyDescription, { color: colors.secondaryText }]}>
              Track products that didn't work so you don't buy them again
            </Text>
            <TouchableOpacity
              style={[styles.sampleButton, { backgroundColor: colors.primary }]}
              onPress={handleCreateSamples}
            >
              <Text style={styles.sampleButtonText}>Add Sample Items</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={80} color={colors.secondaryText} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Results</Text>
            <Text style={[styles.emptyDescription, { color: colors.secondaryText }]}>
              No items match "{searchQuery}"
            </Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add Item Modal */}
      <Modal visible={addModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalScroll}>
            <View style={[styles.modal, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Don't Buy Again</Text>
              
              <Text style={[styles.inputLabel, { color: colors.secondaryText }]}>Product Name *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="Advil PM"
                placeholderTextColor={colors.secondaryText}
                value={newItemName}
                onChangeText={setNewItemName}
                autoFocus
              />
              
              <Text style={[styles.inputLabel, { color: colors.secondaryText }]}>Brand (optional)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="Advil"
                placeholderTextColor={colors.secondaryText}
                value={newItemBrand}
                onChangeText={setNewItemBrand}
              />
              
              <Text style={[styles.inputLabel, { color: colors.secondaryText }]}>Why not buy again? *</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="Gave me terrible headaches"
                placeholderTextColor={colors.secondaryText}
                value={newItemReason}
                onChangeText={setNewItemReason}
                multiline
                numberOfLines={2}
              />
              
              <Text style={[styles.inputLabel, { color: colors.secondaryText }]}>Category</Text>
              <View style={styles.categoryGrid}>
                {['medication', 'food', 'beauty', 'household', 'other'].map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      newItemCategory === cat && { backgroundColor: getCategoryColor(cat) },
                      { borderColor: colors.border },
                    ]}
                    onPress={() => setNewItemCategory(cat)}
                  >
                    <Ionicons
                      name={getCategoryIcon(cat)}
                      size={16}
                      color={newItemCategory === cat ? '#fff' : colors.text}
                    />
                    <Text style={[styles.categoryChipText, newItemCategory === cat && { color: '#fff' }, { color: colors.text }]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <Text style={[styles.inputLabel, { color: colors.secondaryText }]}>Reaction Type</Text>
              <View style={styles.categoryGrid}>
                {['headache', 'rash', 'stomach', 'allergy', 'ineffective', 'other'].map(reaction => (
                  <TouchableOpacity
                    key={reaction}
                    style={[
                      styles.categoryChip,
                      newItemReaction === reaction && { backgroundColor: colors.primary },
                      { borderColor: colors.border },
                    ]}
                    onPress={() => setNewItemReaction(reaction)}
                  >
                    <Text style={[styles.categoryChipText, newItemReaction === reaction && { color: '#fff' }, { color: colors.text }]}>
                      {getReactionLabel(reaction)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <Text style={[styles.inputLabel, { color: colors.secondaryText }]}>Severity</Text>
              <View style={styles.severityButtons}>
                {['mild', 'moderate', 'severe'].map(severity => (
                  <TouchableOpacity
                    key={severity}
                    style={[
                      styles.severityButton,
                      newItemSeverity === severity && { backgroundColor: getSeverityColor(severity) },
                      { borderColor: colors.border },
                    ]}
                    onPress={() => setNewItemSeverity(severity)}
                  >
                    <Text style={[styles.severityButtonText, newItemSeverity === severity && { color: '#fff' }, { color: colors.text }]}>
                      {severity}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <Text style={[styles.inputLabel, { color: colors.secondaryText }]}>Additional Notes (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="Tried for 3 days, headache every time"
                placeholderTextColor={colors.secondaryText}
                value={newItemNotes}
                onChangeText={setNewItemNotes}
                multiline
                numberOfLines={3}
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.border }]}
                  onPress={() => {
                    setAddModalVisible(false);
                    setNewItemName('');
                    setNewItemBrand('');
                    setNewItemReason('');
                    setNewItemNotes('');
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
          </ScrollView>
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#ddd',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  itemCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  categoryBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitleContainer: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  itemBrand: {
    fontSize: 14,
    marginTop: 2,
  },
  reasonBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  reasonText: {
    fontSize: 15,
    flex: 1,
    lineHeight: 20,
  },
  itemMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
  },
  notesText: {
    fontSize: 13,
    marginTop: 8,
    fontStyle: 'italic',
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
    marginBottom: 24,
  },
  sampleButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  sampleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalScroll: {
    flex: 1,
  },
  modal: {
    margin: 16,
    marginTop: 60,
    marginBottom: 40,
    padding: 24,
    borderRadius: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  severityButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  severityButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  severityButtonText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
