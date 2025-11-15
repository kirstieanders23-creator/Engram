import { storage } from '../utils/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('Storage Tests', () => {
  const testRooms = [
    { id: 'kitchen', name: 'Kitchen', icon: '🍽️' },
    { id: 'living', name: 'Living Room', icon: '🛋️' },
  ];

  const testProduct = {
    id: 'test123',
    name: 'Test Product',
    category: 'Electronics',
    roomId: 'living',
    warranty: '2025-12-31',
    photos: [],
  };

  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  describe('Rooms', () => {
    it('should store and retrieve rooms', async () => {
      await storage.setRooms(testRooms);
      const rooms = await storage.getRooms();
      expect(rooms).toEqual(testRooms);
    });

    it('should return empty array when no rooms exist', async () => {
      const rooms = await storage.getRooms();
      expect(rooms).toEqual([]);
    });
  });

  describe('Products', () => {
    it('should store and retrieve products', async () => {
      await storage.setProducts([testProduct]);
      const products = await storage.getProducts();
      expect(products).toEqual([testProduct]);
    });

    it('should add a new product', async () => {
      await storage.addProduct(testProduct);
      const products = await storage.getProducts();
      // Check that product exists with createdAt added
      expect(products).toHaveLength(1);
      expect(products[0].id).toBe(testProduct.id);
      expect(products[0].name).toBe(testProduct.name);
      expect(products[0].createdAt).toBeDefined();
    });

    it('should update an existing product', async () => {
      await storage.addProduct(testProduct);
      const updates = { name: 'Updated Product' };
      const updated = await storage.updateProduct(testProduct.id, updates);
      expect(updated.name).toBe('Updated Product');
      expect(updated.category).toBe(testProduct.category);
    });

    it('should throw error when updating non-existent product', async () => {
      await expect(storage.updateProduct('fake-id', {}))
        .rejects
        .toThrow('Product not found');
    });

    it('should delete a product', async () => {
      await storage.addProduct(testProduct);
      await storage.deleteProduct(testProduct.id);
      const products = await storage.getProducts();
      expect(products).toEqual([]);
    });
  });

  describe('Settings', () => {
    it('should store and retrieve settings', async () => {
      const settings = { dark: true };
      await storage.setSettings(settings);
      const stored = await storage.getSettings();
      expect(stored).toEqual(settings);
    });

    it('should return default settings when none exist', async () => {
      const settings = await storage.getSettings();
      expect(settings).toEqual({ dark: false });
    });
  });
});