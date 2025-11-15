import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Daily Checklist Utility
 * 
 * "Should I / Did You" style reminders for executive function support
 * 
 * Use cases:
 * - "Did you take your morning meds?"
 * - "Should I start dinner prep?"
 * - "Did you feed the cat?"
 * - "Should I move laundry to dryer?"
 * 
 * Features:
 * - Recurring daily/weekly tasks
 * - Check off as completed
 * - Auto-reset at midnight
 * - Time-based notifications (optional)
 * - Streak tracking for consistency
 */

const STORAGE_KEY = '@engram_daily_checklist';
const COMPLETED_KEY = '@engram_completed_today';

/**
 * Checklist Item Structure:
 * {
 *   id: 'unique-id',
 *   text: 'Did you take your morning meds?',
 *   type: 'did-you' | 'should-i',  // Question style
 *   category: 'health' | 'chores' | 'self-care' | 'routine' | 'other',
 *   time: '08:00',  // Optional: when to remind (24hr format)
 *   frequency: 'daily' | 'weekdays' | 'weekends' | 'custom',
 *   daysOfWeek: [0,1,2,3,4,5,6],  // 0=Sunday, used if frequency='custom'
 *   enabled: true,
 *   notifyEnabled: true,  // Push notification
 *   createdAt: timestamp,
 *   streakCount: 0,  // Days in a row completed
 *   lastCompleted: null,  // Date last checked off
 * }
 * 
 * Completed Tracking:
 * {
 *   date: 'YYYY-MM-DD',
 *   completed: ['item-id-1', 'item-id-2'],
 *   timestamp: timestamp
 * }
 */

// ==================== CRUD Operations ====================

export const createChecklistItem = async (itemData) => {
  try {
    const items = await getChecklistItems();
    
    const newItem = {
      id: `checklist_${crypto.randomUUID()}`,
      text: itemData.text,
      type: itemData.type || 'did-you',
      category: itemData.category || 'other',
      time: itemData.time || null,
      frequency: itemData.frequency || 'daily',
      daysOfWeek: itemData.daysOfWeek || [0,1,2,3,4,5,6],
      enabled: itemData.enabled !== false,
      notifyEnabled: itemData.notifyEnabled !== false,
      createdAt: Date.now(),
      streakCount: 0,
      lastCompleted: null,
    };
    
    items.push(newItem);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    
    return { success: true, item: newItem };
  } catch (error) {
    console.error('Error creating checklist item:', error);
    return { success: false, error: error.message };
  }
};

export const getChecklistItems = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading checklist:', error);
    return [];
  }
};

export const updateChecklistItem = async (itemId, updates) => {
  try {
    const items = await getChecklistItems();
    const index = items.findIndex(item => item.id === itemId);
    
    if (index === -1) {
      return { success: false, error: 'Item not found' };
    }
    
    items[index] = { ...items[index], ...updates };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    
    return { success: true, item: items[index] };
  } catch (error) {
    console.error('Error updating checklist item:', error);
    return { success: false, error: error.message };
  }
};

export const deleteChecklistItem = async (itemId) => {
  try {
    const items = await getChecklistItems();
    const filtered = items.filter(item => item.id !== itemId);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting checklist item:', error);
    return { success: false, error: error.message };
  }
};

// ==================== Completion Tracking ====================

export const getCompletedToday = async () => {
  try {
    const today = getTodayDateString();
    const data = await AsyncStorage.getItem(COMPLETED_KEY);
    const completed = data ? JSON.parse(data) : null;
    
    // Reset if date changed
    if (!completed || completed.date !== today) {
      return { date: today, completed: [], timestamp: Date.now() };
    }
    
    return completed;
  } catch (error) {
    console.error('Error loading completed items:', error);
    return { date: getTodayDateString(), completed: [], timestamp: Date.now() };
  }
};

export const toggleItemCompletion = async (itemId) => {
  try {
    const today = getTodayDateString();
    const completedData = await getCompletedToday();
    const items = await getChecklistItems();
    
    const isCompleted = completedData.completed.includes(itemId);
    
    if (isCompleted) {
      // Uncomplete
      completedData.completed = completedData.completed.filter(id => id !== itemId);
    } else {
      // Complete
      completedData.completed.push(itemId);
      
      // Update streak
      const item = items.find(i => i.id === itemId);
      if (item) {
        const yesterday = getYesterdayDateString();
        const lastCompletedDate = item.lastCompleted ? 
          new Date(item.lastCompleted).toISOString().split('T')[0] : null;
        
        if (lastCompletedDate === yesterday) {
          // Continuing streak
          item.streakCount += 1;
        } else if (lastCompletedDate === today) {
          // Already completed today (shouldn't happen, but handle it)
          // Don't change streak
        } else {
          // Streak broken, start new
          item.streakCount = 1;
        }
        
        item.lastCompleted = Date.now();
        await updateChecklistItem(itemId, { 
          streakCount: item.streakCount, 
          lastCompleted: item.lastCompleted 
        });
      }
    }
    
    completedData.timestamp = Date.now();
    await AsyncStorage.setItem(COMPLETED_KEY, JSON.stringify(completedData));
    
    return { success: true, isCompleted: !isCompleted };
  } catch (error) {
    console.error('Error toggling completion:', error);
    return { success: false, error: error.message };
  }
};

export const isItemCompletedToday = async (itemId) => {
  const completed = await getCompletedToday();
  return completed.completed.includes(itemId);
};

// ==================== Filtering & Display ====================

export const getTodaysItems = async () => {
  try {
    const allItems = await getChecklistItems();
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sunday
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    const todaysItems = allItems.filter(item => {
      if (!item.enabled) return false;
      
      switch (item.frequency) {
        case 'daily':
          return true;
        case 'weekdays':
          return isWeekday;
        case 'weekends':
          return isWeekend;
        case 'custom':
          return item.daysOfWeek.includes(dayOfWeek);
        default:
          return true;
      }
    });
    
    // Sort by time (items with time first, then alphabetically)
    todaysItems.sort((a, b) => {
      if (a.time && !b.time) return -1;
      if (!a.time && b.time) return 1;
      if (a.time && b.time) return a.time.localeCompare(b.time);
      return a.text.localeCompare(b.text);
    });
    
    return todaysItems;
  } catch (error) {
    console.error('Error getting today\'s items:', error);
    return [];
  }
};

export const getItemsByCategory = async (category) => {
  const items = await getChecklistItems();
  return items.filter(item => item.category === category);
};

export const getUpcomingItems = async () => {
  const items = await getTodaysItems();
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  return items.filter(item => {
    if (!item.time) return false;
    return item.time > currentTime;
  });
};

// ==================== Statistics ====================

export const getChecklistStats = async () => {
  try {
    const todaysItems = await getTodaysItems();
    const completed = await getCompletedToday();
    const allItems = await getChecklistItems();
    
    const totalToday = todaysItems.length;
    const completedToday = todaysItems.filter(item => 
      completed.completed.includes(item.id)
    ).length;
    const percentComplete = totalToday > 0 ? 
      Math.round((completedToday / totalToday) * 100) : 0;
    
    // Find longest streak
    const longestStreak = Math.max(0, ...allItems.map(item => item.streakCount || 0));
    
    // Count by category
    const byCategory = todaysItems.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {});
    
    return {
      totalToday,
      completedToday,
      remainingToday: totalToday - completedToday,
      percentComplete,
      longestStreak,
      byCategory,
    };
  } catch (error) {
    console.error('Error calculating stats:', error);
    return {
      totalToday: 0,
      completedToday: 0,
      remainingToday: 0,
      percentComplete: 0,
      longestStreak: 0,
      byCategory: {},
    };
  }
};

// ==================== Utilities ====================

export const getTodayDateString = () => {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
};

export const getYesterdayDateString = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
};

export const formatTime12Hour = (time24) => {
  if (!time24) return null;
  
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  
  return `${hour12}:${minutes} ${ampm}`;
};

export const getCategoryIcon = (category) => {
  const icons = {
    health: 'medkit',
    chores: 'home',
    'self-care': 'heart',
    routine: 'time',
    other: 'checkmark-circle',
  };
  return icons[category] || icons.other;
};

export const getCategoryColor = (category) => {
  const colors = {
    health: '#FF6B6B',
    chores: '#4ECDC4',
    'self-care': '#95E1D3',
    routine: '#FFE66D',
    other: '#A8DADC',
  };
  return colors[category] || colors.other;
};

// ==================== Sample Data ====================

export const createSampleChecklist = async () => {
  const samples = [
    {
      text: 'Did you take your morning meds?',
      type: 'did-you',
      category: 'health',
      time: '08:00',
      frequency: 'daily',
    },
    {
      text: 'Should I start dinner prep?',
      type: 'should-i',
      category: 'chores',
      time: '16:30',
      frequency: 'daily',
    },
    {
      text: 'Did you feed the cat?',
      type: 'did-you',
      category: 'routine',
      time: '07:00',
      frequency: 'daily',
    },
    {
      text: 'Should I move laundry to dryer?',
      type: 'should-i',
      category: 'chores',
      frequency: 'daily',
    },
    {
      text: 'Did you drink enough water today?',
      type: 'did-you',
      category: 'self-care',
      time: '20:00',
      frequency: 'daily',
    },
    {
      text: 'Should I take out the trash?',
      type: 'should-i',
      category: 'chores',
      time: '19:00',
      frequency: 'weekdays',
    },
  ];
  
  for (const sample of samples) {
    await createChecklistItem(sample);
  }
  
  return { success: true, count: samples.length };
};
