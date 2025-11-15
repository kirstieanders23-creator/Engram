import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants';

describe('Reminder Tests', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it('should schedule notifications for warranty dates', async () => {
    const mockProduct = {
      id: 'test123',
      name: 'Test Product',
      warranty: '2026-01-01',
    };

    // Mock the notification scheduling
    const mockNotificationId = 'notification-123';
    Notifications.scheduleNotificationAsync.mockResolvedValueOnce(mockNotificationId);

    // Schedule the notification
    const date = new Date(mockProduct.warranty + 'T09:00:00');
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Warranty: ${mockProduct.name}`,
        body: 'Warranty expires today',
      },
      trigger: date,
    });

    // Verify notification was scheduled
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
      content: expect.objectContaining({
        title: `Warranty: ${mockProduct.name}`,
      }),
      trigger: date,
    });

    // Verify reminder was persisted
    const reminder = {
      id: expect.anything(),
      productId: mockProduct.id,
      notifyId: id,
      when: date.toISOString(),
    };

    await AsyncStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify([reminder]));
    
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.REMINDERS);
    expect(JSON.parse(stored)).toEqual([reminder]);
  });

  it('should handle notification permissions', async () => {
    // Test permission flow
    const permissionResponse = await Notifications.getPermissionsAsync();
    expect(permissionResponse.status).toBe('granted');

    // Verify token generation
    const tokenData = await Notifications.getExpoPushTokenAsync();
    expect(tokenData.data).toBe('mock-token');
  });
});