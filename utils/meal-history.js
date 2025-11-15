import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Meal History & Recipe Tracker
 * 
 * Track what you've made, what you loved, what to avoid
 * 
 * Solves:
 * - "What should I make tonight?" (suggests forgotten favorites)
 * - "Have I made this before?" (tracks last made date)
 * - "Did we like this?" (star ratings & notes)
 * - "Why do I keep making the same 3 meals?" (rotation tracking)
 * 
 * Features:
 * - Rate meals (1-5 stars)
 * - Track last made date
 * - Smart suggestions (favorites not made recently)
 * - Notes ("kids loved it", "too spicy", "easy weeknight meal")
 * - Tags (quick, expensive, healthy, comfort food)
 * - Ingredient lists for shopping
 */

const STORAGE_KEY = '@engram_meal_history';

/**
 * Meal History Item Structure:
 * {
 *   id: 'unique-id',
 *   name: 'Chicken Stir Fry',
 *   rating: 5,  // 1-5 stars, null if not rated yet
 *   lastMade: 'YYYY-MM-DD',
 *   timesMade: 3,
 *   
 *   // Details
 *   notes: 'Kids loved it, easy weeknight meal',
 *   prepTime: 30,  // minutes
 *   difficulty: 'easy' | 'medium' | 'hard',
 *   
 *   // Organization
 *   tags: ['quick', 'healthy', 'family-favorite'],
 *   category: 'dinner' | 'lunch' | 'breakfast' | 'dessert' | 'snack',
 *   cuisine: 'Asian' | 'Italian' | 'Mexican' | 'American' | 'Other',
 *   
 *   // Ingredients
 *   ingredients: ['chicken', 'vegetables', 'soy sauce'],
 *   
 *   // History
 *   dateHistory: ['2024-11-01', '2024-10-15', '2024-09-20'],  // All dates made
 *   
 *   createdAt: timestamp,
 *   updatedAt: timestamp,
 * }
 */

// ==================== CRUD Operations ====================

export const addMealToHistory = async (mealData) => {
  try {
    const history = await getMealHistory();
    
    // Check if meal already exists (by name)
    const existingIndex = history.findIndex(
      m => m.name.toLowerCase() === mealData.name.toLowerCase()
    );
    
    if (existingIndex !== -1) {
      // Update existing meal
      const existing = history[existingIndex];
      const today = new Date().toISOString().split('T')[0];
      
      history[existingIndex] = {
        ...existing,
        lastMade: today,
        timesMade: existing.timesMade + 1,
        dateHistory: [today, ...existing.dateHistory],
        updatedAt: Date.now(),
      };
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(history));
      return { success: true, meal: history[existingIndex], existed: true };
    }
    
    // Create new meal
    const today = new Date().toISOString().split('T')[0];
    const newMeal = {
      id: `meal_${crypto.randomUUID()}`,
      name: mealData.name,
      rating: mealData.rating || null,
      lastMade: today,
      timesMade: 1,
      notes: mealData.notes || '',
      prepTime: mealData.prepTime || null,
      difficulty: mealData.difficulty || 'medium',
      tags: mealData.tags || [],
      category: mealData.category || 'dinner',
      cuisine: mealData.cuisine || 'Other',
      ingredients: mealData.ingredients || [],
      dateHistory: [today],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    history.push(newMeal);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    
    return { success: true, meal: newMeal, existed: false };
  } catch (error) {
    console.error('Error adding meal to history:', error);
    return { success: false, error: error.message };
  }
};

export const getMealHistory = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading meal history:', error);
    return [];
  }
};

export const updateMeal = async (mealId, updates) => {
  try {
    const history = await getMealHistory();
    const index = history.findIndex(m => m.id === mealId);
    
    if (index === -1) {
      return { success: false, error: 'Meal not found' };
    }
    
    history[index] = {
      ...history[index],
      ...updates,
      updatedAt: Date.now(),
    };
    
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    return { success: true, meal: history[index] };
  } catch (error) {
    console.error('Error updating meal:', error);
    return { success: false, error: error.message };
  }
};

export const rateMeal = async (mealId, rating, notes = null) => {
  const updates = { rating };
  if (notes) {
    updates.notes = notes;
  }
  return await updateMeal(mealId, updates);
};

export const deleteMeal = async (mealId) => {
  try {
    const history = await getMealHistory();
    const filtered = history.filter(m => m.id !== mealId);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting meal:', error);
    return { success: false, error: error.message };
  }
};

// ==================== Smart Suggestions ====================

export const getForgottenFavorites = async (daysThreshold = 30) => {
  try {
    const history = await getMealHistory();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);
    
    // Find meals with high ratings (4-5 stars) not made recently
    const forgotten = history.filter(meal => {
      if (!meal.rating || meal.rating < 4) return false;
      
      const lastMadeDate = new Date(meal.lastMade);
      return lastMadeDate < cutoffDate;
    });
    
    // Sort by rating (highest first) then by how long it's been
    return forgotten.sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      return new Date(a.lastMade) - new Date(b.lastMade);
    });
  } catch (error) {
    console.error('Error getting forgotten favorites:', error);
    return [];
  }
};

export const getSuggestedMeals = async () => {
  try {
    const history = await getMealHistory();
    const now = new Date();
    
    const suggestions = history.map(meal => {
      const daysSince = meal.lastMade ? 
        Math.floor((now - new Date(meal.lastMade)) / (1000 * 60 * 60 * 24)) : 999;
      
      // Score algorithm: rating + recency + times made
      let score = 0;
      
      // Rating weight (0-50 points)
      if (meal.rating) {
        score += meal.rating * 10;
      }
      
      // Recency weight (0-30 points)
      if (daysSince > 60) {
        score += 30;  // Haven't made in 2+ months
      } else if (daysSince > 30) {
        score += 20;  // Haven't made in 1+ month
      } else if (daysSince > 14) {
        score += 10;  // Haven't made in 2+ weeks
      }
      // Recent meals get 0 points (don't suggest)
      
      // Experience weight (0-20 points for proven meals)
      if (meal.timesMade >= 3) {
        score += 20;
      } else if (meal.timesMade === 2) {
        score += 10;
      }
      
      return {
        ...meal,
        daysSince,
        suggestionScore: score,
        suggestionReason: getSuggestionReason(meal, daysSince),
      };
    });
    
    // Filter out very recent meals (made in last week)
    const filtered = suggestions.filter(s => s.daysSince > 7);
    
    // Sort by score
    return filtered.sort((a, b) => b.suggestionScore - a.suggestionScore);
  } catch (error) {
    console.error('Error getting suggested meals:', error);
    return [];
  }
};

const getSuggestionReason = (meal, daysSince) => {
  const reasons = [];
  
  if (meal.rating >= 5) {
    reasons.push('You loved this!');
  } else if (meal.rating >= 4) {
    reasons.push('You really liked this');
  }
  
  if (daysSince > 60) {
    reasons.push(`Haven't made in ${Math.floor(daysSince / 30)} months`);
  } else if (daysSince > 30) {
    reasons.push('Haven\'t made in over a month');
  } else if (daysSince > 14) {
    reasons.push('Haven\'t made in a while');
  }
  
  if (meal.timesMade >= 5) {
    reasons.push('Family favorite');
  }
  
  if (meal.tags.includes('quick')) {
    reasons.push('Quick & easy');
  }
  
  return reasons.length > 0 ? reasons.join(' • ') : 'Try this again';
};

// ==================== Filtering & Searching ====================

export const searchMeals = async (query) => {
  try {
    const history = await getMealHistory();
    
    if (!query || query.trim() === '') {
      return history;
    }
    
    const queryLower = query.toLowerCase();
    return history.filter(meal => {
      return (
        meal.name.toLowerCase().includes(queryLower) ||
        meal.notes.toLowerCase().includes(queryLower) ||
        meal.tags.some(tag => tag.toLowerCase().includes(queryLower)) ||
        meal.ingredients.some(ing => ing.toLowerCase().includes(queryLower))
      );
    });
  } catch (error) {
    console.error('Error searching meals:', error);
    return [];
  }
};

export const getMealsByRating = async (minRating) => {
  const history = await getMealHistory();
  return history
    .filter(meal => meal.rating && meal.rating >= minRating)
    .sort((a, b) => b.rating - a.rating);
};

export const getMealsByTag = async (tag) => {
  const history = await getMealHistory();
  return history.filter(meal => meal.tags.includes(tag));
};

export const getMealsByCategory = async (category) => {
  const history = await getMealHistory();
  return history.filter(meal => meal.category === category);
};

export const getQuickMeals = async (maxPrepTime = 30) => {
  const history = await getMealHistory();
  return history
    .filter(meal => meal.prepTime && meal.prepTime <= maxPrepTime)
    .sort((a, b) => a.prepTime - b.prepTime);
};

// ==================== Statistics ====================

export const getMealStats = async () => {
  try {
    const history = await getMealHistory();
    
    const totalMeals = history.length;
    const totalTimesMade = history.reduce((sum, m) => sum + m.timesMade, 0);
    const avgRating = history.filter(m => m.rating).length > 0 ?
      history.filter(m => m.rating).reduce((sum, m) => sum + m.rating, 0) / 
      history.filter(m => m.rating).length : 0;
    
    const favorites = history.filter(m => m.rating >= 4).length;
    const needsRating = history.filter(m => !m.rating).length;
    
    // Most made meal
    const mostMade = history.reduce((max, m) => 
      m.timesMade > (max?.timesMade || 0) ? m : max, null);
    
    // Top rated meals
    const topRated = history
      .filter(m => m.rating === 5)
      .sort((a, b) => b.timesMade - a.timesMade);
    
    // Rotation analysis
    const madeThisMonth = history.filter(m => {
      const lastMade = new Date(m.lastMade);
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return lastMade >= monthAgo;
    }).length;
    
    return {
      totalMeals,
      totalTimesMade,
      avgRating: avgRating.toFixed(1),
      favorites,
      needsRating,
      mostMade,
      topRated: topRated.slice(0, 5),
      madeThisMonth,
      rotationScore: totalMeals > 0 ? Math.round((madeThisMonth / totalMeals) * 100) : 0,
    };
  } catch (error) {
    console.error('Error calculating meal stats:', error);
    return {
      totalMeals: 0,
      totalTimesMade: 0,
      avgRating: 0,
      favorites: 0,
      needsRating: 0,
      mostMade: null,
      topRated: [],
      madeThisMonth: 0,
      rotationScore: 0,
    };
  }
};

// ==================== Display Utilities ====================

export const getDaysSinceLastMade = (lastMadeDate) => {
  if (!lastMadeDate) return null;
  
  const now = new Date();
  const lastMade = new Date(lastMadeDate);
  const days = Math.floor((now - lastMade) / (1000 * 60 * 60 * 24));
  
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 60) return '1 month ago';
  return `${Math.floor(days / 30)} months ago`;
};

export const getRatingColor = (rating) => {
  if (!rating) return '#999';
  if (rating >= 4.5) return '#4CAF50';  // Green
  if (rating >= 3.5) return '#8BC34A';  // Light green
  if (rating >= 2.5) return '#FFB347';  // Orange
  return '#FF6B6B';  // Red
};

export const getRatingEmoji = (rating) => {
  if (!rating) return '⭐';
  if (rating === 5) return '⭐⭐⭐⭐⭐';
  if (rating === 4) return '⭐⭐⭐⭐';
  if (rating === 3) return '⭐⭐⭐';
  if (rating === 2) return '⭐⭐';
  return '⭐';
};

export const getDifficultyIcon = (difficulty) => {
  const icons = {
    easy: 'checkmark-circle',
    medium: 'radio-button-on',
    hard: 'alert-circle',
  };
  return icons[difficulty] || icons.medium;
};

export const getDifficultyColor = (difficulty) => {
  const colors = {
    easy: '#4CAF50',
    medium: '#FFB347',
    hard: '#FF6B6B',
  };
  return colors[difficulty] || colors.medium;
};

// ==================== Sample Data ====================

export const createSampleMealHistory = async () => {
  const samples = [
    {
      name: 'Chicken Stir Fry',
      rating: 5,
      notes: 'Kids loved it! Quick and healthy',
      prepTime: 25,
      difficulty: 'easy',
      tags: ['quick', 'healthy', 'family-favorite'],
      category: 'dinner',
      cuisine: 'Asian',
      ingredients: ['chicken', 'vegetables', 'soy sauce', 'rice'],
    },
    {
      name: 'Spaghetti Carbonara',
      rating: 4,
      notes: 'Rich but delicious',
      prepTime: 30,
      difficulty: 'medium',
      tags: ['comfort-food', 'italian'],
      category: 'dinner',
      cuisine: 'Italian',
      ingredients: ['pasta', 'bacon', 'eggs', 'parmesan'],
    },
    {
      name: 'Taco Tuesday',
      rating: 5,
      notes: 'Always a hit, easy to customize',
      prepTime: 20,
      difficulty: 'easy',
      tags: ['quick', 'family-favorite', 'customizable'],
      category: 'dinner',
      cuisine: 'Mexican',
      ingredients: ['ground beef', 'taco shells', 'lettuce', 'cheese', 'salsa'],
    },
    {
      name: 'Homemade Pizza',
      rating: 4,
      notes: 'Fun to make together, takes time',
      prepTime: 60,
      difficulty: 'medium',
      tags: ['family-activity', 'comfort-food'],
      category: 'dinner',
      cuisine: 'Italian',
      ingredients: ['pizza dough', 'sauce', 'cheese', 'toppings'],
    },
    {
      name: 'Grilled Cheese & Soup',
      rating: 3,
      notes: 'Easy comfort food',
      prepTime: 15,
      difficulty: 'easy',
      tags: ['quick', 'comfort-food', 'simple'],
      category: 'lunch',
      cuisine: 'American',
      ingredients: ['bread', 'cheese', 'butter', 'soup'],
    },
  ];
  
  // Add with different last made dates
  const daysAgo = [5, 15, 35, 60, 90];
  
  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i];
    const result = await addMealToHistory(sample);
    
    if (result.success) {
      // Backdate the last made date
      const lastMadeDate = new Date();
      lastMadeDate.setDate(lastMadeDate.getDate() - daysAgo[i]);
      const dateString = lastMadeDate.toISOString().split('T')[0];
      
      await updateMeal(result.meal.id, {
        lastMade: dateString,
        dateHistory: [dateString],
      });
    }
  }
  
  return { success: true, count: samples.length };
};
