/**
 * Notification Service - Warranty Expiration Alerts
 * Schedules push notifications for products with warranties expiring soon
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATIONS_KEY = '@warranty_notifications';
const NOTIFICATIONS_ENABLED_KEY = '@notifications_enabled';

// Dynamic import pattern for Jest compatibility
let Notifications;
try {
  Notifications = require('expo-notifications');
  if (Notifications.default) Notifications = Notifications.default;
} catch (e) {
  // Fallback for test environment
  Notifications = null;
}

/**
 * Configure notification handler behavior
 */
export const configureNotifications = async () => {
  if (!Notifications) return;

  // Set notification handler to show alerts even when app is in foreground
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
};

/**
 * Request notification permissions from user
 * @returns {Promise<boolean>} true if permission granted
 */
export const requestNotificationPermissions = async () => {
  if (!Notifications) return false;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

/**
 * Check if notifications are enabled in app settings
 * @returns {Promise<boolean>}
 */
export const areNotificationsEnabled = async () => {
  try {
    const enabled = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
    return enabled !== 'false'; // Default to true
  } catch (error) {
    console.error('Error checking notification settings:', error);
    return true;
  }
};

/**
 * Enable or disable warranty notifications
 * @param {boolean} enabled
 */
export const setNotificationsEnabled = async (enabled) => {
  try {
    await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, enabled.toString());
    if (!enabled) {
      // Cancel all notifications if disabled
      await cancelAllNotifications();
    }
  } catch (error) {
    console.error('Error saving notification settings:', error);
  }
};

/**
 * Calculate notification dates for a warranty
 * @param {string} warrantyDate - YYYY-MM-DD format
 * @returns {Array<{date: Date, daysRemaining: number}>}
 */
const getNotificationDates = (warrantyDate) => {
  if (!warrantyDate) return [];

  const warranty = new Date(warrantyDate);
  const now = new Date();
  
  // Calculate dates for 90, 60, and 30 days before expiration
  const notifications = [
    { daysRemaining: 90, date: new Date(warranty.getTime() - 90 * 24 * 60 * 60 * 1000) },
    { daysRemaining: 60, date: new Date(warranty.getTime() - 60 * 24 * 60 * 60 * 1000) },
    { daysRemaining: 30, date: new Date(warranty.getTime() - 30 * 24 * 60 * 60 * 1000) },
    { daysRemaining: 7, date: new Date(warranty.getTime() - 7 * 24 * 60 * 60 * 1000) },
  ];

  // Only schedule notifications for future dates
  return notifications.filter(n => n.date > now);
};

/**
 * Schedule warranty expiration notifications for a product
 * @param {Object} product - Product with id, name, and warranty
 * @returns {Promise<string[]>} Array of notification IDs
 */
export const scheduleWarrantyNotifications = async (product) => {
  if (!Notifications || !product.warranty) return [];

  try {
    const enabled = await areNotificationsEnabled();
    if (!enabled) return [];

    const notificationDates = getNotificationDates(product.warranty);
    const notificationIds = [];

    for (const { date, daysRemaining } of notificationDates) {
      const trigger = {
        date,
        channelId: 'warranty-alerts',
      };

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '⚠️ Warranty Expiring Soon',
          body: `${product.name} warranty expires in ${daysRemaining} days`,
          data: { productId: product.id, daysRemaining },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger,
      });

      notificationIds.push(notificationId);
    }

    // Store notification IDs for this product
    await saveProductNotifications(product.id, notificationIds);

    return notificationIds;
  } catch (error) {
    console.error('Error scheduling notifications:', error);
    return [];
  }
};

/**
 * Save notification IDs for a product
 */
const saveProductNotifications = async (productId, notificationIds) => {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
    const notifications = stored ? JSON.parse(stored) : {};
    notifications[productId] = notificationIds;
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  } catch (error) {
    console.error('Error saving notification IDs:', error);
  }
};

/**
 * Cancel all notifications for a specific product
 * @param {string} productId
 */
export const cancelProductNotifications = async (productId) => {
  if (!Notifications) return;

  try {
    const stored = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
    if (!stored) return;

    const notifications = JSON.parse(stored);
    const productNotifications = notifications[productId] || [];

    // Cancel each notification
    for (const notificationId of productNotifications) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    }

    // Remove from storage
    delete notifications[productId];
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  } catch (error) {
    console.error('Error canceling product notifications:', error);
  }
};

/**
 * Cancel all scheduled notifications
 */
export const cancelAllNotifications = async () => {
  if (!Notifications) return;

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.removeItem(NOTIFICATIONS_KEY);
  } catch (error) {
    console.error('Error canceling all notifications:', error);
  }
};

/**
 * Reschedule notifications for a product (cancel old, schedule new)
 * @param {Object} product
 */
export const rescheduleProductNotifications = async (product) => {
  await cancelProductNotifications(product.id);
  return await scheduleWarrantyNotifications(product);
};

/**
 * Get all scheduled notification IDs for debugging
 */
export const getAllScheduledNotifications = async () => {
  if (!Notifications) return [];

  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
};
