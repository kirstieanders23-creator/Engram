import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Time-Based Reminders Utility
 * 
 * Event-driven reminders for coordination & planning
 * 
 * Use cases:
 * - "Mom gets home at 5pm - finish chores before then"
 * - "Package delivery between 2-4pm - be home"
 * - "It's been 11 months since you cleaned the oven - schedule this month"
 * - "Trash pickup tomorrow at 7am - take out tonight"
 * 
 * Features:
 * - Time-based (before/at/after event)
 * - Duration-based (last cleaned X days ago)
 * - One-time or recurring
 * - Advance notifications (30min, 1hr, etc)
 * - Completion tracking
 */

const STORAGE_KEY = '@engram_time_reminders';
const RECURRING_KEY = '@engram_recurring_reminders';

/**
 * Time Reminder Structure:
 * {
 *   id: 'unique-id',
 *   title: 'Mom gets home',
 *   type: 'event' | 'duration' | 'recurring',
 *   
 *   // For 'event' type:
 *   eventTime: '17:00',  // 24hr format
 *   eventDate: 'YYYY-MM-DD',  // null for recurring
 *   advanceNotice: 30,  // Minutes before to notify
 *   reminderText: 'Finish chores before Mom gets home',
 *   
 *   // For 'duration' type:
 *   lastDone: 'YYYY-MM-DD',
 *   intervalDays: 330,  // 11 months
 *   dueSoon: 14,  // Warn X days before due
 *   taskName: 'Clean oven',
 *   
 *   // For 'recurring' type:
 *   frequency: 'daily' | 'weekly' | 'monthly',
 *   daysOfWeek: [0,1,2,3,4,5,6],  // For weekly
 *   
 *   // Common fields:
 *   category: 'chores' | 'coordination' | 'maintenance' | 'events' | 'other',
 *   priority: 'low' | 'medium' | 'high',
 *   enabled: true,
 *   notifyEnabled: true,
 *   completedAt: null,  // For one-time events
 *   createdAt: timestamp,
 *   updatedAt: timestamp,
 * }
 */

// ==================== CRUD Operations ====================

export const createTimeReminder = async (reminderData) => {
  try {
    const reminders = await getTimeReminders();
    
    const newReminder = {
      id: `reminder_${crypto.randomUUID()}`,
      title: reminderData.title,
      type: reminderData.type || 'event',
      
      // Event fields
      eventTime: reminderData.eventTime || null,
      eventDate: reminderData.eventDate || null,
      advanceNotice: reminderData.advanceNotice || 30,
      reminderText: reminderData.reminderText || '',
      
      // Duration fields
      lastDone: reminderData.lastDone || null,
      intervalDays: reminderData.intervalDays || 0,
      dueSoon: reminderData.dueSoon || 14,
      taskName: reminderData.taskName || '',
      
      // Recurring fields
      frequency: reminderData.frequency || null,
      daysOfWeek: reminderData.daysOfWeek || [],
      
      // Common fields
      category: reminderData.category || 'other',
      priority: reminderData.priority || 'medium',
      enabled: reminderData.enabled !== false,
      notifyEnabled: reminderData.notifyEnabled !== false,
      completedAt: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    reminders.push(newReminder);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
    
    return { success: true, reminder: newReminder };
  } catch (error) {
    console.error('Error creating time reminder:', error);
    return { success: false, error: error.message };
  }
};

export const getTimeReminders = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading time reminders:', error);
    return [];
  }
};

export const updateTimeReminder = async (reminderId, updates) => {
  try {
    const reminders = await getTimeReminders();
    const index = reminders.findIndex(r => r.id === reminderId);
    
    if (index === -1) {
      return { success: false, error: 'Reminder not found' };
    }
    
    reminders[index] = {
      ...reminders[index],
      ...updates,
      updatedAt: Date.now(),
    };
    
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
    return { success: true, reminder: reminders[index] };
  } catch (error) {
    console.error('Error updating time reminder:', error);
    return { success: false, error: error.message };
  }
};

export const deleteTimeReminder = async (reminderId) => {
  try {
    const reminders = await getTimeReminders();
    const filtered = reminders.filter(r => r.id !== reminderId);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting time reminder:', error);
    return { success: false, error: error.message };
  }
};

export const completeReminder = async (reminderId) => {
  try {
    const reminder = await updateTimeReminder(reminderId, {
      completedAt: Date.now(),
    });
    
    // If duration type, update lastDone date
    if (reminder.reminder && reminder.reminder.type === 'duration') {
      await updateTimeReminder(reminderId, {
        lastDone: new Date().toISOString().split('T')[0],
      });
    }
    
    return reminder;
  } catch (error) {
    console.error('Error completing reminder:', error);
    return { success: false, error: error.message };
  }
};

// ==================== Status Checking ====================

export const getReminderStatus = (reminder) => {
  const now = new Date();
  
  if (reminder.type === 'event') {
    if (!reminder.eventDate || !reminder.eventTime) {
      return { status: 'pending', message: 'Event time not set' };
    }
    
    const eventDateTime = new Date(`${reminder.eventDate}T${reminder.eventTime}`);
    const timeDiff = eventDateTime - now;
    const minutesUntil = Math.floor(timeDiff / 1000 / 60);
    const hoursUntil = Math.floor(minutesUntil / 60);
    const daysUntil = Math.floor(hoursUntil / 24);
    
    if (timeDiff < 0) {
      return { status: 'past', message: 'Event has passed', color: '#999' };
    }
    
    if (minutesUntil <= reminder.advanceNotice) {
      return { 
        status: 'urgent', 
        message: `NOW - ${minutesUntil}min until event`,
        color: '#FF6B6B',
        urgent: true,
      };
    }
    
    if (hoursUntil < 2) {
      return { 
        status: 'soon', 
        message: `${hoursUntil}hr ${minutesUntil % 60}min`,
        color: '#FFB347',
      };
    }
    
    if (daysUntil === 0) {
      return { 
        status: 'today', 
        message: `Today at ${formatTime12Hour(reminder.eventTime)}`,
        color: '#4ECDC4',
      };
    }
    
    if (daysUntil === 1) {
      return { 
        status: 'tomorrow', 
        message: `Tomorrow at ${formatTime12Hour(reminder.eventTime)}`,
        color: '#95E1D3',
      };
    }
    
    return { 
      status: 'upcoming', 
      message: `In ${daysUntil} days`,
      color: '#A8DADC',
    };
  }
  
  if (reminder.type === 'duration') {
    if (!reminder.lastDone) {
      return { status: 'never', message: 'Never done', color: '#999' };
    }
    
    const lastDoneDate = new Date(reminder.lastDone);
    const daysSince = Math.floor((now - lastDoneDate) / 1000 / 60 / 60 / 24);
    const daysUntilDue = reminder.intervalDays - daysSince;
    
    if (daysUntilDue < 0) {
      return { 
        status: 'overdue', 
        message: `${Math.abs(daysUntilDue)} days overdue`,
        color: '#FF6B6B',
        urgent: true,
      };
    }
    
    if (daysUntilDue <= reminder.dueSoon) {
      return { 
        status: 'due-soon', 
        message: `Due in ${daysUntilDue} days`,
        color: '#FFB347',
      };
    }
    
    const monthsSince = Math.floor(daysSince / 30);
    return { 
      status: 'ok', 
      message: `Last done ${monthsSince} months ago`,
      color: '#95E1D3',
    };
  }
  
  return { status: 'unknown', message: 'Unknown status', color: '#999' };
};

export const getUpcomingReminders = async (hours = 24) => {
  try {
    const reminders = await getTimeReminders();
    const now = new Date();
    const cutoff = new Date(now.getTime() + hours * 60 * 60 * 1000);
    
    return reminders.filter(reminder => {
      if (!reminder.enabled || reminder.completedAt) return false;
      
      if (reminder.type === 'event' && reminder.eventDate && reminder.eventTime) {
        const eventDateTime = new Date(`${reminder.eventDate}T${reminder.eventTime}`);
        return eventDateTime >= now && eventDateTime <= cutoff;
      }
      
      if (reminder.type === 'duration' && reminder.lastDone) {
        const lastDoneDate = new Date(reminder.lastDone);
        const daysSince = Math.floor((now - lastDoneDate) / 1000 / 60 / 60 / 24);
        const daysUntilDue = reminder.intervalDays - daysSince;
        return daysUntilDue <= reminder.dueSoon;
      }
      
      return false;
    }).sort((a, b) => {
      const statusA = getReminderStatus(a);
      const statusB = getReminderStatus(b);
      if (statusA.urgent && !statusB.urgent) return -1;
      if (!statusA.urgent && statusB.urgent) return 1;
      return 0;
    });
  } catch (error) {
    console.error('Error getting upcoming reminders:', error);
    return [];
  }
};

export const getOverdueMaintenanceTasks = async () => {
  try {
    const reminders = await getTimeReminders();
    const now = new Date();
    
    return reminders.filter(reminder => {
      if (reminder.type !== 'duration' || !reminder.lastDone) return false;
      
      const lastDoneDate = new Date(reminder.lastDone);
      const daysSince = Math.floor((now - lastDoneDate) / 1000 / 60 / 60 / 24);
      return daysSince > reminder.intervalDays;
    });
  } catch (error) {
    console.error('Error getting overdue tasks:', error);
    return [];
  }
};

// ==================== Statistics ====================

export const getReminderStats = async () => {
  try {
    const reminders = await getTimeReminders();
    const upcoming = await getUpcomingReminders(24);
    const overdue = await getOverdueMaintenanceTasks();
    
    const byCategory = reminders.reduce((acc, r) => {
      acc[r.category] = (acc[r.category] || 0) + 1;
      return acc;
    }, {});
    
    const urgent = reminders.filter(r => {
      const status = getReminderStatus(r);
      return status.urgent;
    });
    
    return {
      total: reminders.length,
      upcomingToday: upcoming.length,
      overdue: overdue.length,
      urgent: urgent.length,
      byCategory,
    };
  } catch (error) {
    console.error('Error calculating stats:', error);
    return {
      total: 0,
      upcomingToday: 0,
      overdue: 0,
      urgent: 0,
      byCategory: {},
    };
  }
};

// ==================== Utilities ====================

export const formatTime12Hour = (time24) => {
  if (!time24) return '';
  
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  
  return `${hour12}:${minutes} ${ampm}`;
};

export const getCategoryIcon = (category) => {
  const icons = {
    chores: 'home',
    coordination: 'people',
    maintenance: 'construct',
    events: 'calendar',
    other: 'time',
  };
  return icons[category] || icons.other;
};

export const getPriorityColor = (priority) => {
  const colors = {
    low: '#95E1D3',
    medium: '#FFE66D',
    high: '#FF6B6B',
  };
  return colors[priority] || colors.medium;
};

// ==================== Sample Data ====================

export const createSampleReminders = async () => {
  const samples = [
    {
      title: 'Mom gets home',
      type: 'event',
      eventTime: '17:00',
      eventDate: new Date().toISOString().split('T')[0],
      advanceNotice: 30,
      reminderText: 'Finish chores before Mom gets home',
      category: 'coordination',
      priority: 'high',
    },
    {
      title: 'Package delivery',
      type: 'event',
      eventTime: '14:00',
      eventDate: new Date().toISOString().split('T')[0],
      advanceNotice: 15,
      reminderText: 'Be home for package delivery (2-4pm window)',
      category: 'events',
      priority: 'medium',
    },
    {
      title: 'Clean oven',
      type: 'duration',
      lastDone: '2024-01-01',
      intervalDays: 330,  // ~11 months
      dueSoon: 14,
      taskName: 'Deep clean oven',
      category: 'maintenance',
      priority: 'medium',
    },
    {
      title: 'Trash pickup',
      type: 'event',
      eventTime: '07:00',
      eventDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
      advanceNotice: 720,  // 12 hours
      reminderText: 'Take trash out tonight for morning pickup',
      category: 'chores',
      priority: 'medium',
    },
  ];
  
  for (const sample of samples) {
    await createTimeReminder(sample);
  }
  
  return { success: true, count: samples.length };
};
