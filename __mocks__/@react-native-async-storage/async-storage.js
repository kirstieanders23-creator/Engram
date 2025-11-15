const storage = new Map();

const mockStorage = {
  setItem: jest.fn(async (key, value) => {
    storage.set(key, value);
  }),
  getItem: jest.fn(async (key) => {
    return storage.get(key);
  }),
  removeItem: jest.fn(async (key) => {
    storage.delete(key);
  }),
  clear: jest.fn(async () => {
    storage.clear();
  }),
  getAllKeys: jest.fn(async () => {
    return Array.from(storage.keys());
  }),
  multiGet: jest.fn(async (keys) => {
    return keys.map(key => [key, storage.get(key)]);
  }),
  multiSet: jest.fn(async (keyValuePairs) => {
    keyValuePairs.forEach(([key, value]) => {
      storage.set(key, value);
    });
  }),
  multiRemove: jest.fn(async (keys) => {
    keys.forEach(key => {
      storage.delete(key);
    });
  }),
};

export default mockStorage;