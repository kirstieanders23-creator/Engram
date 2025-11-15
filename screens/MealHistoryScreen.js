import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../providers/ThemeProvider';
import { useFocusEffect } from '@react-navigation/native';
import {
  getMealHistory,
  getForgottenFavorites,
  getSuggestedMeals,
  rateMeal,
  deleteMeal,
  getMealStats,
  getDaysSinceLastMade,
  getRatingColor,
  getDifficultyIcon,
  getDifficultyColor,
  createSampleMealHistory,
} from '../utils/meal-history';

/**
 * Meal History & Suggestions Screen
 * 
 * "What should I make tonight?"
 * 
 * Shows:
 * - Forgotten favorites (loved but haven't made recently)
 * - Smart suggestions based on ratings + time since last made
 * - Full meal history with ratings & notes
 * - Quick filters (favorites, quick meals, etc.)
 */

export const MealHistoryScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [meals, setMeals] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [forgottenFavorites, setForgottenFavorites] = useState([]);
  const [stats, setStats] = useState(null);
  const [viewMode, setViewMode] = useState('suggestions'); // suggestions | all | favorites
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [tempRating, setTempRating] = useState(0);
  const [tempNotes, setTempNotes] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const history = await getMealHistory();
    const suggested = await getSuggestedMeals();
    const forgotten = await getForgottenFavorites(30);
    const statistics = await getMealStats();
    
    setMeals(history);
    setSuggestions(suggested);
    setForgottenFavorites(forgotten);
    setStats(statistics);
  };

  const handleRateMeal = (meal) => {
    setSelectedMeal(meal);
    setTempRating(meal.rating || 0);
    setTempNotes(meal.notes || '');
    setRatingModalVisible(true);
  };

  const handleSaveRating = async () => {
    if (!selectedMeal) return;
    
    await rateMeal(selectedMeal.id, tempRating, tempNotes);
    setRatingModalVisible(false);
    setSelectedMeal(null);
    await loadData();
  };

  const handleDeleteMeal = (meal) => {
    Alert.alert(
      'Delete Meal',
      `Remove "${meal.name}" from history?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteMeal(meal.id);
            await loadData();
          },
        },
      ]
    );
  };

  const handleAddToMealPlan = (meal) => {
    Alert.alert(
      'Add to Meal Plan',
      `Add "${meal.name}" to this week's meal plan?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: () => {
            // TODO: Navigate to meal planning with pre-filled meal
            navigation.navigate('MealPlanning', { preFillMeal: meal.name });
          },
        },
      ]
    );
  };

  const renderMealCard = (meal, showSuggestionReason = false) => {
    const difficultyIcon = getDifficultyIcon(meal.difficulty);
    const difficultyColor = getDifficultyColor(meal.difficulty);

    return (
      <TouchableOpacity
        key={meal.id}
        style={[styles.mealCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => handleRateMeal(meal)}
        onLongPress={() => handleDeleteMeal(meal)}
      >
        <View style={styles.mealHeader}>
          <View style={styles.mealTitleContainer}>
            <Text style={[styles.mealName, { color: colors.text }]}>
              {meal.name}
            </Text>
            <View style={styles.mealMeta}>
              <Text style={[styles.metaText, { color: colors.secondaryText }]}>
                {getDaysSinceLastMade(meal.lastMade)}
              </Text>
              <Text style={[styles.metaText, { color: colors.secondaryText }]}>
                • Made {meal.timesMade}x
              </Text>
            </View>
          </View>
          
          {meal.rating ? (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={[styles.ratingText, { color: colors.text }]}>
                {meal.rating}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.rateButton, { borderColor: colors.border }]}
              onPress={() => handleRateMeal(meal)}
            >
              <Text style={[styles.rateButtonText, { color: colors.secondaryText }]}>
                Rate
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {showSuggestionReason && meal.suggestionReason && (
          <View style={[styles.suggestionReason, { backgroundColor: colors.background }]}>
            <Ionicons name="bulb" size={14} color={colors.primary} />
            <Text style={[styles.suggestionReasonText, { color: colors.text }]}>
              {meal.suggestionReason}
            </Text>
          </View>
        )}

        {meal.notes && (
          <Text style={[styles.mealNotes, { color: colors.secondaryText }]}>
            💭 {meal.notes}
          </Text>
        )}

        <View style={styles.mealDetails}>
          {meal.prepTime && (
            <View style={styles.detailChip}>
              <Ionicons name="time-outline" size={12} color={colors.secondaryText} />
              <Text style={[styles.detailText, { color: colors.secondaryText }]}>
                {meal.prepTime} min
              </Text>
            </View>
          )}
          <View style={styles.detailChip}>
            <Ionicons name={difficultyIcon} size={12} color={difficultyColor} />
            <Text style={[styles.detailText, { color: colors.secondaryText }]}>
              {meal.difficulty}
            </Text>
          </View>
          {meal.tags.slice(0, 2).map(tag => (
            <View key={tag} style={[styles.tagChip, { backgroundColor: colors.background }]}>
              <Text style={[styles.tagText, { color: colors.secondaryText }]}>
                {tag}
              </Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.addToPlanButton, { backgroundColor: colors.primary }]}
          onPress={() => handleAddToMealPlan(meal)}
        >
          <Ionicons name="calendar-outline" size={16} color="#fff" />
          <Text style={styles.addToPlanText}>Add to Meal Plan</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const displayedMeals = viewMode === 'suggestions' ? suggestions :
                        viewMode === 'favorites' ? meals.filter(m => m.rating >= 4) :
                        meals;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Meal History</Text>
        <TouchableOpacity onPress={loadData} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Stats Card */}
      {stats && (
        <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>{stats.totalMeals}</Text>
            <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Recipes</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="star" size={20} color="#FFD700" />
            <Text style={[styles.statNumber, { color: colors.text }]}>{stats.favorites}</Text>
            <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Favorites</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.accent }]}>{stats.rotationScore}%</Text>
            <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Rotation</Text>
          </View>
        </View>
      )}

      {/* View Mode Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, viewMode === 'suggestions' && { borderBottomColor: colors.primary, borderBottomWidth: 3 }]}
          onPress={() => setViewMode('suggestions')}
        >
          <Text style={[styles.tabText, viewMode === 'suggestions' && { color: colors.primary }, { color: colors.secondaryText }]}>
            Suggestions
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, viewMode === 'favorites' && { borderBottomColor: colors.primary, borderBottomWidth: 3 }]}
          onPress={() => setViewMode('favorites')}
        >
          <Text style={[styles.tabText, viewMode === 'favorites' && { color: colors.primary }, { color: colors.secondaryText }]}>
            Favorites
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, viewMode === 'all' && { borderBottomColor: colors.primary, borderBottomWidth: 3 }]}
          onPress={() => setViewMode('all')}
        >
          <Text style={[styles.tabText, viewMode === 'all' && { color: colors.primary }, { color: colors.secondaryText }]}>
            All
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Forgotten Favorites Alert */}
        {forgottenFavorites.length > 0 && viewMode === 'suggestions' && (
          <View style={[styles.alertCard, { backgroundColor: '#FFE66D' }]}>
            <Ionicons name="alert-circle" size={24} color="#000" />
            <View style={styles.alertText}>
              <Text style={styles.alertTitle}>Forgotten Favorites!</Text>
              <Text style={styles.alertDescription}>
                {forgottenFavorites.length} loved {forgottenFavorites.length === 1 ? 'meal' : 'meals'} you haven't made in a while
              </Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          {displayedMeals.length > 0 ? (
            displayedMeals.map(meal => renderMealCard(meal, viewMode === 'suggestions'))
          ) : meals.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="restaurant-outline" size={80} color={colors.secondaryText} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Meal History Yet</Text>
              <Text style={[styles.emptyDescription, { color: colors.secondaryText }]}>
                Meals you add to your weekly plan will appear here with ratings and suggestions
              </Text>
              <TouchableOpacity
                style={[styles.sampleButton, { backgroundColor: colors.primary }]}
                onPress={async () => {
                  await createSampleMealHistory();
                  await loadData();
                }}
              >
                <Text style={styles.sampleButtonText}>Add Sample Meals</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={80} color={colors.secondaryText} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No {viewMode === 'favorites' ? 'Favorites' : 'Results'}</Text>
              <Text style={[styles.emptyDescription, { color: colors.secondaryText }]}>
                {viewMode === 'favorites' ? 'Rate meals 4-5 stars to add them here' : 'Try a different view'}
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Rating Modal */}
      <Modal visible={ratingModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Rate: {selectedMeal?.name}
            </Text>
            
            {/* Star Rating */}
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setTempRating(star)}
                >
                  <Ionicons
                    name={star <= tempRating ? 'star' : 'star-outline'}
                    size={48}
                    color="#FFD700"
                  />
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={[styles.inputLabel, { color: colors.secondaryText }]}>Notes (optional)</Text>
            <TextInput
              style={[styles.notesInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Kids loved it, easy weeknight meal"
              placeholderTextColor={colors.secondaryText}
              value={tempNotes}
              onChangeText={setTempNotes}
              multiline
              numberOfLines={3}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.border }]}
                onPress={() => {
                  setRatingModalVisible(false);
                  setSelectedMeal(null);
                }}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleSaveRating}
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
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  refreshButton: { padding: 8 },
  statsCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginHorizontal: 16, marginBottom: 16, padding: 16, borderRadius: 12 },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: 'bold' },
  statLabel: { fontSize: 11, marginTop: 4 },
  statDivider: { width: 1, height: 40, backgroundColor: '#ddd' },
  tabBar: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabText: { fontSize: 14, fontWeight: '600' },
  scrollView: { flex: 1 },
  alertCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, marginBottom: 16, padding: 16, borderRadius: 12 },
  alertText: { flex: 1 },
  alertTitle: { fontSize: 16, fontWeight: 'bold', color: '#000', marginBottom: 4 },
  alertDescription: { fontSize: 13, color: '#000' },
  section: { marginHorizontal: 16 },
  mealCard: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  mealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  mealTitleContainer: { flex: 1 },
  mealName: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  mealMeta: { flexDirection: 'row', gap: 4 },
  metaText: { fontSize: 12 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: 'rgba(255, 215, 0, 0.1)' },
  ratingText: { fontSize: 14, fontWeight: 'bold' },
  rateButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  rateButtonText: { fontSize: 12, fontWeight: '600' },
  suggestionReason: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 8, marginBottom: 12 },
  suggestionReasonText: { fontSize: 13, flex: 1 },
  mealNotes: { fontSize: 14, marginBottom: 12, lineHeight: 20 },
  mealDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  detailChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.05)' },
  detailText: { fontSize: 11, fontWeight: '600' },
  tagChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  tagText: { fontSize: 11, fontWeight: '600' },
  addToPlanButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, borderRadius: 8 },
  addToPlanText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 24, fontWeight: 'bold', marginTop: 20, marginBottom: 12 },
  emptyDescription: { fontSize: 15, textAlign: 'center', marginBottom: 24 },
  sampleButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  sampleButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', paddingHorizontal: 24 },
  modal: { padding: 24, borderRadius: 16 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  starRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 },
  inputLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  notesInput: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16, minHeight: 80, textAlignVertical: 'top', marginBottom: 20 },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalButton: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  modalButtonText: { fontSize: 16, fontWeight: '600' },
});
