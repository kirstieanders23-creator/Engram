import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../providers/ThemeProvider';
import { useFocusEffect } from '@react-navigation/native';
import {
  getTodaysItems,
  toggleItemCompletion,
  isItemCompletedToday,
  createChecklistItem,
  deleteChecklistItem,
  getChecklistStats,
  formatTime12Hour,
  getCategoryIcon,
  getCategoryColor,
  createSampleChecklist,
} from '../utils/daily-checklist';

/**
 * Daily Checklist Screen
 * 
 * "Should I / Did You" reminders for executive function support
 * 
 * Perfect for ADHD/chronic illness:
 * - "Did you take your meds?"
 * - "Should I start dinner?"
 * - Track completion
 * - Build healthy habits
 */

export const DailyChecklistScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [items, setItems] = useState([]);
  const [completedItems, setCompletedItems] = useState(new Set());
  const [stats, setStats] = useState(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [newItemText, setNewItemText] = useState('');
  const [newItemType, setNewItemType] = useState('did-you');
  const [newItemCategory, setNewItemCategory] = useState('routine');
  const [newItemTime, setNewItemTime] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    setLoading(true);
    const todaysItems = await getTodaysItems();
    const statistics = await getChecklistStats();
    
    // Check completion status for each item
    const completed = new Set();
    for (const item of todaysItems) {
      const isCompleted = await isItemCompletedToday(item.id);
      if (isCompleted) {
        completed.add(item.id);
      }
    }
    
    setItems(todaysItems);
    setCompletedItems(completed);
    setStats(statistics);
    setLoading(false);
  };

  const handleToggleItem = async (item) => {
    const result = await toggleItemCompletion(item.id);
    if (result.success) {
      const newCompleted = new Set(completedItems);
      if (result.isCompleted) {
        newCompleted.add(item.id);
      } else {
        newCompleted.delete(item.id);
      }
      setCompletedItems(newCompleted);
      await loadData(); // Refresh to update stats
    }
  };

  const handleAddItem = async () => {
    if (!newItemText.trim()) {
      Alert.alert('Error', 'Please enter a reminder');
      return;
    }

    const result = await createChecklistItem({
      text: newItemText.trim(),
      type: newItemType,
      category: newItemCategory,
      time: newItemTime || null,
      frequency: 'daily',
    });

    if (result.success) {
      setNewItemText('');
      setNewItemTime('');
      setAddModalVisible(false);
      await loadData();
    } else {
      Alert.alert('Error', result.error || 'Failed to add item');
    }
  };

  const handleDeleteItem = (item) => {
    Alert.alert(
      'Delete Reminder',
      `Remove "${item.text}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteChecklistItem(item.id);
            await loadData();
          },
        },
      ]
    );
  };

  const handleCreateSamples = async () => {
    Alert.alert(
      'Add Sample Items',
      'Add example reminders to get started?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add Samples',
          onPress: async () => {
            await createSampleChecklist();
            await loadData();
          },
        },
      ]
    );
  };

  const renderItem = (item) => {
    const isCompleted = completedItems.has(item.id);
    const categoryColor = getCategoryColor(item.category);
    const categoryIcon = getCategoryIcon(item.category);

    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => handleToggleItem(item)}
        onLongPress={() => handleDeleteItem(item)}
      >
        <View style={styles.itemLeft}>
          <Ionicons
            name={isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
            size={32}
            color={isCompleted ? colors.primary : colors.secondaryText}
          />
          
          <View style={styles.itemDetails}>
            <View style={styles.itemHeader}>
              <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
                <Ionicons name={categoryIcon} size={12} color="#fff" />
              </View>
              <Text style={[styles.itemType, { color: colors.secondaryText }]}>
                {item.type === 'did-you' ? 'Did you...' : 'Should I...'}
              </Text>
            </View>
            
            <Text style={[styles.itemText, isCompleted && styles.completedText, { color: colors.text }]}>
              {item.text}
            </Text>
            
            <View style={styles.itemMeta}>
              {item.time && (
                <View style={styles.timeChip}>
                  <Ionicons name="time-outline" size={12} color={colors.secondaryText} />
                  <Text style={[styles.timeText, { color: colors.secondaryText }]}>
                    {formatTime12Hour(item.time)}
                  </Text>
                </View>
              )}
              {item.streakCount > 0 && (
                <View style={styles.streakChip}>
                  <Ionicons name="flame" size={12} color="#FFB347" />
                  <Text style={[styles.streakText, { color: colors.secondaryText }]}>
                    {item.streakCount} day{item.streakCount !== 1 ? 's' : ''}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const pendingItems = items.filter(item => !completedItems.has(item.id));
  const doneItems = items.filter(item => completedItems.has(item.id));

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}
      accessible accessibilityLabel="Daily Checklist Screen">
      <View style={styles.header} accessible accessibilityRole="header">
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} allowFontScaling accessibilityLabel="Daily Checklist">Daily Checklist</Text>
        <TouchableOpacity onPress={() => setAddModalVisible(true)} style={styles.addButton} accessibilityLabel="Add checklist item">
          <Ionicons name="add-circle" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {stats && (
        <View style={[styles.statsCard, { backgroundColor: colors.card }]}> 
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.primary }]} allowFontScaling accessibilityLabel={`Completed: ${stats.completedToday} of ${stats.totalToday}`}> 
              {stats.completedToday}/{stats.totalToday}
            </Text>
            <Text style={[styles.statLabel, { color: colors.secondaryText }]} allowFontScaling accessibilityLabel="Completed">Completed</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.accent }]} allowFontScaling accessibilityLabel={`Progress: ${stats.percentComplete}%`}> 
              {stats.percentComplete}%
            </Text>
            <Text style={[styles.statLabel, { color: colors.secondaryText }]} allowFontScaling accessibilityLabel="Progress">Progress</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="flame" size={20} color="#FFB347" />
            <Text style={[styles.statNumber, { color: colors.text }]} allowFontScaling accessibilityLabel={`Best Streak: ${stats.longestStreak}`}>{stats.longestStreak}</Text>
            <Text style={[styles.statLabel, { color: colors.secondaryText }]} allowFontScaling accessibilityLabel="Best Streak">Best Streak</Text>
          </View>
        </View>
      )}

      <ScrollView style={styles.scrollView}>
        {pendingItems.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              TO DO ({pendingItems.length})
            </Text>
            {pendingItems.map(renderItem)}
          </View>
        )}

        {doneItems.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              DONE TODAY ({doneItems.length})
            </Text>
            {doneItems.map(renderItem)}
          </View>
        )}

        {items.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="checkbox-outline" size={80} color={colors.secondaryText} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Reminders Yet</Text>
            <Text style={[styles.emptyDescription, { color: colors.secondaryText }]}>
              Add daily reminders to help you remember important tasks
            </Text>
            <TouchableOpacity
              style={[styles.sampleButton, { backgroundColor: colors.primary }]}
              onPress={handleCreateSamples}
            >
              <Text style={styles.sampleButtonText}>Add Sample Reminders</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add Item Modal */}
      <Modal visible={addModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Reminder</Text>
            
            {/* Type Selection */}
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  newItemType === 'did-you' && { backgroundColor: colors.primary },
                  { borderColor: colors.border },
                ]}
                onPress={() => setNewItemType('did-you')}
              >
                <Text style={[styles.typeButtonText, newItemType === 'did-you' && { color: '#fff' }, { color: colors.text }]}>
                  Did you...
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  newItemType === 'should-i' && { backgroundColor: colors.primary },
                  { borderColor: colors.border },
                ]}
                onPress={() => setNewItemType('should-i')}
              >
                <Text style={[styles.typeButtonText, newItemType === 'should-i' && { color: '#fff' }, { color: colors.text }]}>
                  Should I...
                </Text>
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="take your morning meds?"
              placeholderTextColor={colors.secondaryText}
              value={newItemText}
              onChangeText={setNewItemText}
              autoFocus
              multiline
            />
            
            {/* Category Selection */}
            <Text style={[styles.inputLabel, { color: colors.secondaryText }]}>Category</Text>
            <View style={styles.categoryGrid}>
              {['health', 'chores', 'self-care', 'routine', 'other'].map(cat => (
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
            
            <Text style={[styles.inputLabel, { color: colors.secondaryText }]}>Time (optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="08:00 (24hr format)"
              placeholderTextColor={colors.secondaryText}
              value={newItemTime}
              onChangeText={setNewItemTime}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.border }]}
                onPress={() => {
                  setAddModalVisible(false);
                  setNewItemText('');
                  setNewItemTime('');
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
    fontSize: 24,
    fontWeight: 'bold',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
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
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  categoryBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemType: {
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  itemText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  completedText: {
    opacity: 0.6,
  },
  itemMeta: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
  },
  streakChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakText: {
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
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
    justifyContent: 'flex-end',
  },
  modal: {
    padding: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
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
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
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
