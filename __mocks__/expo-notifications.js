export const scheduleNotificationAsync = jest.fn();
export const getPermissionsAsync = jest.fn(() => Promise.resolve({ status: 'granted' }));
export const getExpoPushTokenAsync = jest.fn(() => Promise.resolve({ data: 'mock-token' }));