import { exportData, importData } from '../utils/backup';

jest.mock('../utils/storage', () => ({
  storage: {
    getProducts: jest.fn(async () => []),
    getRooms: jest.fn(async () => []),
    getSettings: jest.fn(async () => ({})),
    getUser: jest.fn(async () => null),
    setProducts: jest.fn(async () => {}),
    setRooms: jest.fn(async () => {}),
    setSettings: jest.fn(async () => {}),
    setUser: jest.fn(async () => {}),
  },
}));

jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///tmp/',
  readAsStringAsync: jest.fn(async () => JSON.stringify({ products: [], rooms: [], settings: {}, user: null, exportedAt: Date.now() })),
  writeAsStringAsync: jest.fn(async () => {}),
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(async () => true),
  shareAsync: jest.fn(async () => {}),
}));

describe('backup', () => {
  it('exportData writes and shares file', async () => {
    const path = await exportData();
    expect(path).toContain('engram-backup-');
  });

  it('importData reads and restores storage', async () => {
    const result = await importData('file:///backup.json');
    expect(result.success).toBe(true);
  });
});
