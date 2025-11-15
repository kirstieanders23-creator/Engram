import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../providers/ThemeProvider';
import { useFocusEffect } from '@react-navigation/native';
import {
  getCurrentWeekStart,
  getWeekDates,
  formatWeekRange,
  getMealPlanForWeek,
  updateMeal,
  deleteMeal,
  getMealPlanStats,
  getHousehold,
  generateIngredientsFromMeal,
  addSharedShoppingItem,
} from '../utils/meal-planning';

/**
 * Meal Planning Screen - Weekly meal planner with household coordination
 * 
 * Solves: "What are we eating this week?"
 *         "Who's cooking tonight?"
 *         "What ingredients do we need?"
 */

export const MealPlanningScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const [weekStartDate, setWeekStartDate] = useState(getCurrentWeekStart());
  const [mealPlan, setMealPlan] = useState(null);
  const [weekDates, setWeekDates] = useState([]);
  const [stats, setStats] = useState(null);
  const [household, setHousehold] = useState(null);
  
  // Modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingMeal, setEditingMeal] = useState(null); // { dayIndex, mealType }
  const [mealName, setMealName] = useState('');
  const [mealNotes, setMealNotes] = useState('');
  const [assignedTo, setAssignedTo] = useState(null);

  // Handle auto-add from urgent meal suggestion
  useEffect(() => {
    if (route?.params?.suggestedMeal && route?.params?.expiringItem) {
      const { suggestedMeal, expiringItem } = route.params;
      
      // Auto-open modal for today's dinner with suggested meal pre-filled
      const today = new Date().getDay(); // 0 = Sunday
      const dayIndex = today === 0 ? 6 : today - 1; // Convert to 0 = Monday
      
      setEditingMeal({ dayIndex, mealType: 'dinner' });
      setMealName(suggestedMeal.name);
      setMealNotes(`Uses ${expiringItem.name} (expires in ${expiringItem.daysLeft} days)`);
      setAssignedTo(null);
      setEditModalVisible(true);
      
      // Clear params to prevent re-triggering
      navigation.setParams({ suggestedMeal: null, expiringItem: null });
    }
  }, [route?.params]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [weekStartDate])
  );

  const loadData = async () => {
    const plan = await getMealPlanForWeek(weekStartDate);
    const dates = getWeekDates(weekStartDate);
    const householdData = await getHousehold();
    const statistics = getMealPlanStats(plan);
    
    setMealPlan(plan);
    setWeekDates(dates);
    setHousehold(householdData);
    setStats(statistics);
  };

  const handlePreviousWeek = () => {
    const date = new Date(weekStartDate);
    date.setDate(date.getDate() - 7);
    setWeekStartDate(date.toISOString().split('T')[0]);
  };

  const handleNextWeek = () => {
    const date = new Date(weekStartDate);
    date.setDate(date.getDate() + 7);
    setWeekStartDate(date.toISOString().split('T')[0]);
  };

  const handleAddMeal = (dayIndex, mealType) => {
    setEditingMeal({ dayIndex, mealType });
    setMealName('');
    setMealNotes('');
    setAssignedTo(null);
    setEditModalVisible(true);
  };

  const handleEditMeal = (dayIndex, mealType, meal) => {
    setEditingMeal({ dayIndex, mealType });
    setMealName(meal.name || '');
    setMealNotes(meal.notes || '');
    setAssignedTo(meal.assignedTo || null);
    setEditModalVisible(true);
  };

  const handleSaveMeal = async () => {
    if (!mealName.trim()) {
      Alert.alert('Error', 'Please enter a meal name');
      return;
    }

    const mealData = {
      name: mealName.trim(),
      notes: mealNotes.trim(),
      assignedTo: assignedTo,
      assignedToName: household?.members.find(m => m.id === assignedTo)?.name || null,
      addedAt: new Date().toISOString(),
    };

    const result = await updateMeal(weekStartDate, editingMeal.dayIndex, editingMeal.mealType, mealData);
    
    if (result.success) {
      setEditModalVisible(false);
      await loadData();
    } else {
      Alert.alert('Error', 'Failed to save meal');
    }
  };

  const handleDeleteMeal = async (dayIndex, mealType) => {
    Alert.alert(
      'Delete Meal',
      'Remove this meal from your plan?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteMeal(weekStartDate, dayIndex, mealType);
            await loadData();
          },
        },
      ]
    );
  };

  const handleAddIngredientsToShopping = async (dayIndex, mealType) => {
    const meal = mealPlan?.meals[dayIndex][mealType];
    if (!meal) return;

    const ingredients = generateIngredientsFromMeal(meal.name);
    
    if (ingredients.length === 0) {
      Alert.alert('No Suggestions', 'No ingredient suggestions available for this meal');
      return;
    }

    Alert.alert(
      'Add to Shopping List',
      `Add ingredients for "${meal.name}"?\n\nSuggested items:\n${ingredients.map(i => `• ${i}`).join('\n')}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: async () => {
            const currentUser = household?.members[0]; // TODO: Get actual current user
            
            for (const ingredient of ingredients) {
              await addSharedShoppingItem({
                name: ingredient,
                quantity: 1,
                category: 'Groceries',
                forMeal: { weekStartDate, dayIndex, mealType },
                addedBy: currentUser?.id,
                addedByName: currentUser?.name,
                priority: 'normal',
              });
            }
            
            Alert.alert('Success', `${ingredients.length} items added to shopping list`);
          },
        },
      ]
    );
  };

  const getMealTypeIcon = (type) => {
    switch (type) {
      case 'breakfast': return 'cafe';
      case 'lunch': return 'fast-food';
      case 'dinner': return 'restaurant';
      default: return 'nutrition';
    }
  };

  const renderMealCard = (dayIndex, mealType, meal) => {
    const dayDate = weekDates[dayIndex];
    
    if (!meal) {
      return (
        <TouchableOpacity
          key={mealType}
          style={[styles.emptyMealCard, { backgroundColor: colors.background, borderColor: colors.border }]}
          onPress={() => handleAddMeal(dayIndex, mealType)}
        >
          <Ionicons name={getMealTypeIcon(mealType)} size={20} color={colors.secondaryText} />
          <Text style={[styles.emptyMealText, { color: colors.secondaryText }]}>
            Add {mealType}
          </Text>
        </TouchableOpacity>
      );
    }

    const assignedMember = household?.members.find(m => m.id === meal.assignedTo);

    return (
      <TouchableOpacity
        key={mealType}
        style={[styles.mealCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => handleEditMeal(dayIndex, mealType, meal)}
        onLongPress={() => handleDeleteMeal(dayIndex, mealType)}
      >
        <View style={styles.mealCardHeader}>
          <View style={styles.mealCardLeft}>
            <Ionicons name={getMealTypeIcon(mealType)} size={20} color={colors.primary} />
            <Text style={[styles.mealType, { color: colors.secondaryText }]}>
              {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
            </Text>
          </View>
          <TouchableOpacity onPress={() => handleAddIngredientsToShopping(dayIndex, mealType)}>
            <Ionicons name="cart-outline" size={20} color={colors.accent} />
          </TouchableOpacity>
        </View>
        
        <Text style={[styles.mealName, { color: colors.text }]} numberOfLines={2}>
          {meal.name}
        </Text>
        
        {assignedMember && (
          <View style={styles.assignedBadge}>
            <View style={[styles.assignedDot, { backgroundColor: assignedMember.color }]} />
            <Text style={[styles.assignedText, { color: colors.secondaryText }]}>
              {assignedMember.name}
            </Text>
          </View>
        )}
        
        {meal.notes && (
          <Text style={[styles.mealNotes, { color: colors.secondaryText }]} numberOfLines={1}>
            {meal.notes}
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Meal Plan</Text>
        <TouchableOpacity onPress={() => navigation.navigate('SharedShopping')} style={styles.cartButton}>
          <Ionicons name="cart" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Week Navigation */}
      <View style={[styles.weekNav, { backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={handlePreviousWeek} style={styles.weekNavButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <View style={styles.weekNavCenter}>
          <Text style={[styles.weekRange, { color: colors.text }]}>
            {formatWeekRange(weekStartDate)}
          </Text>
          {stats && (
            <Text style={[styles.weekStats, { color: colors.secondaryText }]}>
              {stats.plannedMeals} of {stats.totalMeals} meals planned ({stats.percentPlanned}%)
            </Text>
          )}
        </View>
        
        <TouchableOpacity onPress={handleNextWeek} style={styles.weekNavButton}>
          <Ionicons name="chevron-forward" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {weekDates.map((dateInfo, dayIndex) => {
          const dayMeals = mealPlan?.meals[dayIndex] || { breakfast: null, lunch: null, dinner: null };
          
          return (
            <View key={dayIndex} style={styles.daySection}>
              <View style={[styles.dayHeader, dateInfo.isToday && { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.dayName, { color: dateInfo.isToday ? colors.primary : colors.text }]}>
                  {dateInfo.dayName}
                </Text>
                <Text style={[styles.dayDate, { color: colors.secondaryText }]}>
                  {dateInfo.dayShort} {dateInfo.dayOfMonth}
                </Text>
              </View>
              
              <View style={styles.mealsContainer}>
                {renderMealCard(dayIndex, 'breakfast', dayMeals.breakfast)}
                {renderMealCard(dayIndex, 'lunch', dayMeals.lunch)}
                {renderMealCard(dayIndex, 'dinner', dayMeals.dinner)}
              </View>
            </View>
          );
        })}
        
        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Edit Meal Modal */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingMeal?.mealType && `${editingMeal.mealType.charAt(0).toUpperCase()}${editingMeal.mealType.slice(1)}`}
            </Text>
            
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Meal name (e.g., Spaghetti Bolognese)"
              placeholderTextColor={colors.secondaryText}
              value={mealName}
              onChangeText={setMealName}
              autoFocus
            />
            
            <TextInput
              style={[styles.input, styles.notesInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Notes (optional)"
              placeholderTextColor={colors.secondaryText}
              value={mealNotes}
              onChangeText={setMealNotes}
              multiline
            />
            
            {household && household.members.length > 0 && (
              <View style={styles.assignSection}>
                <Text style={[styles.assignLabel, { color: colors.text }]}>Assign to:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <TouchableOpacity
                    style={[
                      styles.memberChip,
                      !assignedTo && styles.memberChipSelected,
                      { borderColor: colors.border },
                    ]}
                    onPress={() => setAssignedTo(null)}
                  >
                    <Text style={[styles.memberChipText, { color: colors.text }]}>Anyone</Text>
                  </TouchableOpacity>
                  {household.members.map(member => (
                    <TouchableOpacity
                      key={member.id}
                      style={[
                        styles.memberChip,
                        assignedTo === member.id && styles.memberChipSelected,
                        { borderColor: member.color },
                      ]}
                      onPress={() => setAssignedTo(member.id)}
                    >
                      <View style={[styles.memberDot, { backgroundColor: member.color }]} />
                      <Text style={[styles.memberChipText, { color: colors.text }]}>{member.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.border }]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleSaveMeal}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>Save</Text>
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
  cartButton: {
    padding: 8,
  },
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  weekNavButton: {
    padding: 4,
  },
  weekNavCenter: {
    flex: 1,
    alignItems: 'center',
  },
  weekRange: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  weekStats: {
    fontSize: 12,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  daySection: {
    marginBottom: 24,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  dayName: {
    fontSize: 16,
    fontWeight: '700',
  },
  dayDate: {
    fontSize: 14,
  },
  mealsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 8,
  },
  emptyMealCard: {
    flex: 1,
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  emptyMealText: {
    fontSize: 12,
  },
  mealCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 80,
  },
  mealCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  mealCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mealType: {
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  mealName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  assignedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  assignedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  assignedText: {
    fontSize: 11,
  },
  mealNotes: {
    fontSize: 11,
    marginTop: 4,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '90%',
    maxHeight: '80%',
    padding: 24,
    borderRadius: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  assignSection: {
    marginBottom: 20,
  },
  assignLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  memberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    marginRight: 8,
    gap: 6,
  },
  memberChipSelected: {
    borderWidth: 3,
  },
  memberDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  memberChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
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
