import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants';

export const storage = {
  // User Management
  async getUser() {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    return data ? JSON.parse(data) : null;
  },

  async setUser(user) {
    if (user) {
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER);
    }
  },

  // Rooms Management
  async getRooms() {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.ROOMS);
    return data ? JSON.parse(data) : [];
  },

  async setRooms(rooms) {
    await AsyncStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
  },

  // Products Management
  async getProducts() {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return data ? JSON.parse(data) : [];
  },

  async setProducts(products) {
    await AsyncStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  },

  async addProduct(product) {
    const products = await this.getProducts();
    const newProduct = {
      ...product,
      id: product.id || `product-${Date.now()}`,
      createdAt: product.createdAt || new Date().toISOString(),
    };
    products.push(newProduct);
    await this.setProducts(products);
    return newProduct;
  },

  async updateProduct(id, updates) {
    const products = await this.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Product not found');
    
    products[index] = {
      ...products[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await this.setProducts(products);
    return products[index];
  },

  async deleteProduct(id) {
    const products = await this.getProducts();
    const filtered = products.filter(p => p.id !== id);
    await this.setProducts(filtered);
  },

  async getProductById(id) {
    const products = await this.getProducts();
    return products.find(p => p.id === id);
  },

  // Settings
  async getSettings() {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? JSON.parse(data) : { dark: false };
  },

  async setSettings(settings) {
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },
};