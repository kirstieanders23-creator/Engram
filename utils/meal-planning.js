import AsyncStorage from '@react-native-async-storage/async-storage';

const MEAL_PLAN_KEY = '@engram_meal_plans';
const HOUSEHOLD_KEY = '@engram_household';

/**
 * Meal Planning + Household Coordination
 * 
 * Solves: "I'm at the store, did someone already buy chicken?"
 *         "What are we making this week?"
 *         "Who's cooking tonight?"
 * 
 * Features:
 * - Weekly meal planning (breakfast/lunch/dinner)
 * - Shared shopping list with "Who's getting this?" status
 * - Ingredient tracking tied to meals
 * - Household member coordination
 * - "Already got it" marking to prevent duplicates
 */

// ==================== HOUSEHOLD MANAGEMENT ====================

export const createHousehold = async (householdData) => {
  try {
    const household = {
      id: Date.now().toString(),
      name: householdData.name || 'My Household',
      createdAt: new Date().toISOString(),
      createdBy: householdData.createdBy,
      members: [
        {
          id: householdData.createdBy,
          name: householdData.creatorName,
          role: 'owner',
          color: '#6B8E7D', // Sage green
          joinedAt: new Date().toISOString(),
        },
      ],
      inviteCode: generateInviteCode(),
    };

    await AsyncStorage.setItem(HOUSEHOLD_KEY, JSON.stringify(household));
    return { success: true, household };
  } catch (error) {
    console.error('Failed to create household:', error);
    return { success: false, error: error.message };
  }
};

export const getHousehold = async () => {
  try {
    const data = await AsyncStorage.getItem(HOUSEHOLD_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to get household:', error);
    return null;
  }
};

export const addHouseholdMember = async (memberData) => {
  try {
    const household = await getHousehold();
    if (!household) {
      return { success: false, error: 'No household found' };
    }

    const colors = ['#6B8E7D', '#D4AF37', '#FF6B6B', '#4ECDC4', '#95E1D3', '#3D84A8'];
    const usedColors = household.members.map(m => m.color);
    const availableColor = colors.find(c => !usedColors.includes(c)) || colors[0];

    const newMember = {
      id: Date.now().toString(),
      name: memberData.name,
      role: 'member',
      color: availableColor,
      joinedAt: new Date().toISOString(),
    };

    household.members.push(newMember);
    await AsyncStorage.setItem(HOUSEHOLD_KEY, JSON.stringify(household));

    return { success: true, member: newMember };
  } catch (error) {
    console.error('Failed to add member:', error);
    return { success: false, error: error.message };
  }
};

export const removeHouseholdMember = async (memberId) => {
  try {
    const household = await getHousehold();
    if (!household) {
      return { success: false, error: 'No household found' };
    }

    household.members = household.members.filter(m => m.id !== memberId);
    await AsyncStorage.setItem(HOUSEHOLD_KEY, JSON.stringify(household));

    return { success: true };
  } catch (error) {
    console.error('Failed to remove member:', error);
    return { success: false, error: error.message };
  }
};

const generateInviteCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// ==================== MEAL PLANNING ====================

export const createMealPlan = async (mealPlanData) => {
  try {
    const mealPlan = {
      id: Date.now().toString(),
      weekStartDate: mealPlanData.weekStartDate, // YYYY-MM-DD (Monday)
      meals: mealPlanData.meals || initializeWeekMeals(),
      createdBy: mealPlanData.createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const existingPlans = await getMealPlans();
    const updated = [...existingPlans, mealPlan];
    await AsyncStorage.setItem(MEAL_PLAN_KEY, JSON.stringify(updated));

    return { success: true, mealPlan };
  } catch (error) {
    console.error('Failed to create meal plan:', error);
    return { success: false, error: error.message };
  }
};

export const getMealPlans = async () => {
  try {
    const data = await AsyncStorage.getItem(MEAL_PLAN_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to get meal plans:', error);
    return [];
  }
};

export const getMealPlanForWeek = async (weekStartDate) => {
  try {
    const plans = await getMealPlans();
    return plans.find(p => p.weekStartDate === weekStartDate) || null;
  } catch (error) {
    console.error('Failed to get meal plan for week:', error);
    return null;
  }
};

export const updateMeal = async (weekStartDate, dayIndex, mealType, mealData) => {
  try {
    const plans = await getMealPlans();
    const planIndex = plans.findIndex(p => p.weekStartDate === weekStartDate);

    if (planIndex === -1) {
      // Create new plan if it doesn't exist
      const newPlan = {
        id: Date.now().toString(),
        weekStartDate,
        meals: initializeWeekMeals(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      newPlan.meals[dayIndex][mealType] = mealData;
      plans.push(newPlan);
    } else {
      plans[planIndex].meals[dayIndex][mealType] = mealData;
      plans[planIndex].updatedAt = new Date().toISOString();
    }

    await AsyncStorage.setItem(MEAL_PLAN_KEY, JSON.stringify(plans));
    return { success: true };
  } catch (error) {
    console.error('Failed to update meal:', error);
    return { success: false, error: error.message };
  }
};

export const deleteMeal = async (weekStartDate, dayIndex, mealType) => {
  try {
    const plans = await getMealPlans();
    const planIndex = plans.findIndex(p => p.weekStartDate === weekStartDate);

    if (planIndex !== -1) {
      plans[planIndex].meals[dayIndex][mealType] = null;
      plans[planIndex].updatedAt = new Date().toISOString();
      await AsyncStorage.setItem(MEAL_PLAN_KEY, JSON.stringify(plans));
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to delete meal:', error);
    return { success: false, error: error.message };
  }
};

const initializeWeekMeals = () => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return days.map(day => ({
    day,
    breakfast: null,
    lunch: null,
    dinner: null,
  }));
};

// ==================== SHARED SHOPPING WITH COORDINATION ====================

export const addSharedShoppingItem = async (itemData) => {
  try {
    const item = {
      id: Date.now().toString(),
      name: itemData.name,
      quantity: itemData.quantity || 1,
      category: itemData.category || 'Other',
      forMeal: itemData.forMeal || null, // { weekStartDate, dayIndex, mealType }
      addedBy: itemData.addedBy, // Member ID
      addedByName: itemData.addedByName,
      addedAt: new Date().toISOString(),
      
      // Coordination fields
      claimedBy: null, // Member ID of who's getting it
      claimedByName: null,
      claimedAt: null,
      purchased: false,
      purchasedBy: null,
      purchasedByName: null,
      purchasedAt: null,
      
      priority: itemData.priority || 'normal',
      notes: itemData.notes || '',
    };

    // Import shopping list functions
    const { getShoppingList } = await import('./expiration-tracker');
    const existingList = await getShoppingList();
    
    // Add to shared shopping list storage
    const SHARED_SHOPPING_KEY = '@engram_shared_shopping';
    const sharedData = await AsyncStorage.getItem(SHARED_SHOPPING_KEY);
    const sharedList = sharedData ? JSON.parse(sharedData) : [];
    
    sharedList.push(item);
    await AsyncStorage.setItem(SHARED_SHOPPING_KEY, JSON.stringify(sharedList));

    return { success: true, item };
  } catch (error) {
    console.error('Failed to add shared shopping item:', error);
    return { success: false, error: error.message };
  }
};

export const getSharedShoppingList = async () => {
  try {
    const SHARED_SHOPPING_KEY = '@engram_shared_shopping';
    const data = await AsyncStorage.getItem(SHARED_SHOPPING_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to get shared shopping list:', error);
    return [];
  }
};

export const claimShoppingItem = async (itemId, memberId, memberName) => {
  try {
    const SHARED_SHOPPING_KEY = '@engram_shared_shopping';
    const list = await getSharedShoppingList();
    
    const updated = list.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          claimedBy: memberId,
          claimedByName: memberName,
          claimedAt: new Date().toISOString(),
        };
      }
      return item;
    });

    await AsyncStorage.setItem(SHARED_SHOPPING_KEY, JSON.stringify(updated));
    return { success: true };
  } catch (error) {
    console.error('Failed to claim item:', error);
    return { success: false, error: error.message };
  }
};

export const unclaimShoppingItem = async (itemId) => {
  try {
    const SHARED_SHOPPING_KEY = '@engram_shared_shopping';
    const list = await getSharedShoppingList();
    
    const updated = list.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          claimedBy: null,
          claimedByName: null,
          claimedAt: null,
        };
      }
      return item;
    });

    await AsyncStorage.setItem(SHARED_SHOPPING_KEY, JSON.stringify(updated));
    return { success: true };
  } catch (error) {
    console.error('Failed to unclaim item:', error);
    return { success: false, error: error.message };
  }
};

export const markItemPurchased = async (itemId, memberId, memberName) => {
  try {
    const SHARED_SHOPPING_KEY = '@engram_shared_shopping';
    const list = await getSharedShoppingList();
    
    const updated = list.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          purchased: true,
          purchasedBy: memberId,
          purchasedByName: memberName,
          purchasedAt: new Date().toISOString(),
        };
      }
      return item;
    });

    await AsyncStorage.setItem(SHARED_SHOPPING_KEY, JSON.stringify(updated));
    return { success: true };
  } catch (error) {
    console.error('Failed to mark purchased:', error);
    return { success: false, error: error.message };
  }
};

export const removeSharedShoppingItem = async (itemId) => {
  try {
    const SHARED_SHOPPING_KEY = '@engram_shared_shopping';
    const list = await getSharedShoppingList();
    const updated = list.filter(item => item.id !== itemId);
    await AsyncStorage.setItem(SHARED_SHOPPING_KEY, JSON.stringify(updated));
    return { success: true };
  } catch (error) {
    console.error('Failed to remove item:', error);
    return { success: false, error: error.message };
  }
};

export const clearPurchasedItems = async () => {
  try {
    const SHARED_SHOPPING_KEY = '@engram_shared_shopping';
    const list = await getSharedShoppingList();
    const updated = list.filter(item => !item.purchased);
    await AsyncStorage.setItem(SHARED_SHOPPING_KEY, JSON.stringify(updated));
    return { success: true };
  } catch (error) {
    console.error('Failed to clear purchased items:', error);
    return { success: false, error: error.message };
  }
};

// ==================== MEAL -> INGREDIENTS GENERATION ====================

export const generateIngredientsFromMeal = (mealName) => {
  // Simple keyword-based ingredient suggestions
  const mealLower = mealName.toLowerCase();
  const ingredients = [];

  // Common ingredient patterns
  const patterns = {
    'pasta': ['pasta', 'tomato sauce', 'garlic', 'olive oil', 'parmesan'],
    'spaghetti': ['spaghetti', 'ground beef', 'tomato sauce', 'onion', 'garlic'],
    'chicken': ['chicken breast', 'olive oil', 'salt', 'pepper'],
    'salad': ['lettuce', 'tomato', 'cucumber', 'salad dressing'],
    'taco': ['ground beef', 'taco shells', 'cheese', 'lettuce', 'tomato', 'sour cream'],
    'burger': ['ground beef', 'hamburger buns', 'cheese', 'lettuce', 'tomato', 'onion'],
    'pizza': ['pizza dough', 'tomato sauce', 'mozzarella', 'toppings'],
    'stir fry': ['rice', 'soy sauce', 'vegetables', 'oil'],
    'soup': ['broth', 'vegetables', 'seasonings'],
    'sandwich': ['bread', 'meat', 'cheese', 'lettuce', 'mayo'],
  };

  // Check for matching patterns
  for (const [keyword, items] of Object.entries(patterns)) {
    if (mealLower.includes(keyword)) {
      ingredients.push(...items);
      break;
    }
  }

  // If no match, return generic suggestions
  if (ingredients.length === 0) {
    ingredients.push('ingredients for ' + mealName);
  }

  return ingredients;
};

// ==================== WEEKLY NAVIGATION ====================

export const getCurrentWeekStart = () => {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  const monday = new Date(today.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0];
};

export const getWeekDates = (weekStartDate) => {
  const start = new Date(weekStartDate);
  const dates = [];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    dates.push({
      date: date.toISOString().split('T')[0],
      dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
      dayShort: date.toLocaleDateString('en-US', { weekday: 'short' }),
      dayOfMonth: date.getDate(),
      isToday: date.toISOString().split('T')[0] === new Date().toISOString().split('T')[0],
    });
  }
  
  return dates;
};

export const formatWeekRange = (weekStartDate) => {
  const start = new Date(weekStartDate);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  
  const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
  const startDay = start.getDate();
  const endDay = end.getDate();
  
  if (startMonth === endMonth) {
    return `${startMonth} ${startDay}-${endDay}`;
  } else {
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
  }
};

// ==================== STATISTICS ====================

export const getMealPlanStats = (mealPlan) => {
  if (!mealPlan) return null;
  
  let totalMeals = 0;
  let plannedMeals = 0;
  
  mealPlan.meals.forEach(day => {
    ['breakfast', 'lunch', 'dinner'].forEach(mealType => {
      totalMeals++;
      if (day[mealType]) {
        plannedMeals++;
      }
    });
  });
  
  return {
    totalMeals,
    plannedMeals,
    unplannedMeals: totalMeals - plannedMeals,
    percentPlanned: Math.round((plannedMeals / totalMeals) * 100),
  };
};

export const getSharedShoppingStats = (shoppingList, household) => {
  const stats = {
    total: shoppingList.length,
    claimed: shoppingList.filter(i => i.claimedBy).length,
    unclaimed: shoppingList.filter(i => !i.claimedBy && !i.purchased).length,
    purchased: shoppingList.filter(i => i.purchased).length,
    byMember: {},
  };
  
  if (household) {
    household.members.forEach(member => {
      stats.byMember[member.id] = {
        name: member.name,
        color: member.color,
        claimed: shoppingList.filter(i => i.claimedBy === member.id && !i.purchased).length,
        purchased: shoppingList.filter(i => i.purchasedBy === member.id).length,
      };
    });
  }
  
  return stats;
};
