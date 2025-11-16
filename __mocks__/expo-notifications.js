export const scheduleNotificationAsync = jest.fn();
export const getPermissionsAsync = jest.fn(() => Promise.resolve({ status: 'granted' }));
export const getExpoPushTokenAsync = jest.fn(() => Promise.resolve({ data: 'mock-token' }));
export const setNotificationHandler = jest.fn();
export const cancelScheduledNotificationAsync = jest.fn();
export const cancelAllScheduledNotificationsAsync = jest.fn();
export const getAllScheduledNotificationsAsync = jest.fn(() => Promise.resolve([]));
export const AndroidNotificationPriority = { HIGH: 'high' };