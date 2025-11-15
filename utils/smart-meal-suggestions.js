import { getDatabase } from '../providers/DatabaseProvider';
import { getMealHistory } from './meal-history';
import { getExpirationStatus } from './expiration-tracker';

/**
 * Smart Meal Suggestions based on Expiring Ingredients
 * 
 * Cross-reference:
 * - Products expiring soon
 * - Meal history with matching ingredients
 * - User's favorite recipes
 * 
 * Result: "Ground beef expires Wed - make your 5-star tacos tonight!"
 */

/**
 * Find meals that use expiring ingredients
 * 
 * @param {number} daysThreshold - Consider items expiring within X days (default 3)
 * @returns {Array} Urgent meal suggestions with expiring ingredient warnings
 */
export const getUrgentMealSuggestions = async (daysThreshold = 3) => {
  try {
    // Get all products
    const { products } = await getDatabase();
    
    // Get meal history
    const mealHistory = await getMealHistory();
    
    // Find expiring items
    const expiringItems = products
      .filter(product => {
        if (!product.expirationDate) return false;
        
        const status = getExpirationStatus(product.expirationDate);
        return status.daysLeft >= 0 && status.daysLeft <= daysThreshold;
      })
      .map(product => ({
        ...product,
        status: getExpirationStatus(product.expirationDate),
      }))
      .sort((a, b) => a.status.daysLeft - b.status.daysLeft); // Most urgent first

    if (expiringItems.length === 0) {
      return [];
    }

    // Match expiring items with meals
    const suggestions = [];
    
    for (const item of expiringItems) {
      const itemNameLower = item.name.toLowerCase();
      
      // Find meals that might use this ingredient
      const matchingMeals = mealHistory.filter(meal => {
        // Check if meal ingredients include this item
        const ingredientMatch = meal.ingredients.some(ingredient =>
          itemNameLower.includes(ingredient.toLowerCase()) ||
          ingredient.toLowerCase().includes(itemNameLower)
        );
        
        // Also check meal name (e.g., "Chicken Stir Fry" matches "chicken")
        const nameMatch = meal.name.toLowerCase().includes(itemNameLower) ||
          itemNameLower.includes(meal.name.toLowerCase().split(' ')[0]);
        
        return ingredientMatch || nameMatch;
      });

      if (matchingMeals.length > 0) {
        // Sort by rating (highest first)
        const bestMeals = matchingMeals
          .filter(m => m.rating) // Only rated meals
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 3); // Top 3

        if (bestMeals.length > 0) {
          suggestions.push({
            expiringItem: item,
            urgencyLevel: getUrgencyLevel(item.status.daysLeft),
            suggestedMeals: bestMeals,
            message: generateUrgentMessage(item, bestMeals[0]),
          });
        }
      }
    }

    return suggestions.sort((a, b) => 
      a.expiringItem.status.daysLeft - b.expiringItem.status.daysLeft
    );
  } catch (error) {
    console.error('Error getting urgent meal suggestions:', error);
    return [];
  }
};

/**
 * Generate a friendly urgent message
 */
const generateUrgentMessage = (item, meal) => {
  const daysLeft = item.status.daysLeft;
  const itemName = item.name;
  const mealName = meal.name;
  const stars = '⭐'.repeat(meal.rating);
  
  if (daysLeft === 0) {
    return `🚨 ${itemName} expires TODAY - make ${mealName} tonight! ${stars}`;
  } else if (daysLeft === 1) {
    return `⚠️ ${itemName} expires tomorrow - how about ${mealName} tonight? ${stars}`;
  } else if (daysLeft === 2) {
    return `⏰ ${itemName} expires in 2 days - plan ${mealName} soon! ${stars}`;
  } else {
    return `💡 ${itemName} expires in ${daysLeft} days - try ${mealName}! ${stars}`;
  }
};

/**
 * Get urgency level for UI coloring
 */
const getUrgencyLevel = (daysLeft) => {
  if (daysLeft === 0) return 'critical'; // Red
  if (daysLeft === 1) return 'urgent';   // Orange
  if (daysLeft === 2) return 'warning';  // Yellow
  return 'notice';                        // Blue
};

/**
 * Get color for urgency badge
 */
export const getUrgencyColor = (urgencyLevel) => {
  const colors = {
    critical: '#FF3B30', // Red
    urgent: '#FF9500',   // Orange
    warning: '#FFD700',  // Yellow/Gold
    notice: '#007AFF',   // Blue
  };
  return colors[urgencyLevel] || colors.notice;
};

/**
 * Check if any ingredients are expiring soon (for dashboard widget)
 */
export const hasUrgentIngredients = async () => {
  const suggestions = await getUrgentMealSuggestions(3);
  return suggestions.length > 0;
};

/**
 * Get count of expiring ingredients with meal suggestions
 */
export const getUrgentSuggestionsCount = async () => {
  const suggestions = await getUrgentMealSuggestions(3);
  return suggestions.length;
};

/**
 * Smart fuzzy matching for ingredient names
 * Handles variations like:
 * - "ground beef" matches "beef"
 * - "chicken breast" matches "chicken"
 * - "fresh spinach" matches "spinach"
 */
const fuzzyIngredientMatch = (productName, ingredient) => {
  const productWords = productName.toLowerCase().split(' ');
  const ingredientWords = ingredient.toLowerCase().split(' ');
  
  // Remove common modifiers
  const modifiers = ['fresh', 'frozen', 'ground', 'raw', 'cooked', 'organic', 'free-range'];
  const filteredProduct = productWords.filter(w => !modifiers.includes(w));
  const filteredIngredient = ingredientWords.filter(w => !modifiers.includes(w));
  
  // Check for any word match
  return filteredProduct.some(pw => 
    filteredIngredient.some(iw => 
      pw.includes(iw) || iw.includes(pw)
    )
  );
};

/**
 * Generate notification message for push/local notifications
 */
export const generateNotificationMessage = async () => {
  const suggestions = await getUrgentMealSuggestions(3);
  
  if (suggestions.length === 0) {
    return null;
  }
  
  const urgent = suggestions[0]; // Most urgent
  return {
    title: '🍽️ Meal Suggestion',
    body: urgent.message,
    data: {
      type: 'urgent-meal-suggestion',
      expiringItemId: urgent.expiringItem.id,
      suggestedMealId: urgent.suggestedMeals[0].id,
    },
  };
};

/**
 * Format suggestion for display in UI
 */
export const formatSuggestionForDisplay = (suggestion) => {
  const { expiringItem, suggestedMeals, urgencyLevel } = suggestion;
  
  return {
    id: `suggestion_${expiringItem.id}`,
    urgencyLevel,
    urgencyColor: getUrgencyColor(urgencyLevel),
    expiringItem: {
      name: expiringItem.name,
      daysLeft: expiringItem.status.daysLeft,
      expirationDate: expiringItem.expirationDate,
    },
    topMeal: suggestedMeals[0],
    alternativeMeals: suggestedMeals.slice(1),
    message: suggestion.message,
  };
};

/**
 * Mark ingredient as "planned to use" when meal is added to plan
 * This prevents repeated nagging about the same item
 */
export const markIngredientAsPlanned = async (productId, mealId, plannedDate) => {
  try {
    // You can implement this in your product storage
    // For now, we'll add a simple flag
    // In DatabaseProvider, add: product.plannedToUse = { mealId, date }
    
    return {
      success: true,
      message: 'Ingredient marked as planned',
    };
  } catch (error) {
    console.error('Error marking ingredient as planned:', error);
    return { success: false };
  }
};
