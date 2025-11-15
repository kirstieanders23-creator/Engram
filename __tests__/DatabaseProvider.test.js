import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react-native';
import { DatabaseProvider, useDatabase } from '../providers/DatabaseProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants';

describe('DatabaseProvider', () => {
  const testRoom = {
    id: 'living',
    name: 'Living Room',
    icon: '🛋️',
  };

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

  it('provides initial empty state', async () => {
    const wrapper = ({ children }) => <DatabaseProvider>{children}</DatabaseProvider>;
    const { result } = renderHook(() => useDatabase(), { wrapper });

    // Wait for load to finish
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 2000 });

    expect(result.current.rooms).toEqual([]);
    expect(result.current.products).toEqual([]);
  });

  it('loads saved data from storage', async () => {
    // Save some initial data
    await AsyncStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify([testRoom]));
    await AsyncStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify([testProduct]));

    const wrapper = ({ children }) => <DatabaseProvider>{children}</DatabaseProvider>;
    const { result } = renderHook(() => useDatabase(), { wrapper });

    // Wait for loaded data to appear
    await waitFor(() => {
      expect(result.current.rooms).toEqual([testRoom]);
      expect(result.current.products).toEqual([testProduct]);
    }, { timeout: 2000 });
  });

  it('manages rooms CRUD operations', async () => {
    const wrapper = ({ children }) => <DatabaseProvider>{children}</DatabaseProvider>;
    const { result } = renderHook(() => useDatabase(), { wrapper });

    // Wait for load to finish
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 2000 });

    // Add room
    await act(async () => {
      await result.current.addRoom(testRoom);
    });

    // Wait for room to appear
    await waitFor(() => {
      expect(result.current.rooms).toEqual([testRoom]);
    });

    // Update room
    const updates = { name: 'Updated Room' };
    await act(async () => {
      await result.current.updateRoom(testRoom.id, updates);
    });

    await waitFor(() => {
      expect(result.current.rooms[0].name).toBe('Updated Room');
    });

    // Delete room
    await act(async () => {
      await result.current.deleteRoom(testRoom.id);
    });

    await waitFor(() => {
      expect(result.current.rooms).toEqual([]);
    });
  });

  it('manages products CRUD operations', async () => {
    const wrapper = ({ children }) => <DatabaseProvider>{children}</DatabaseProvider>;
    const { result } = renderHook(() => useDatabase(), { wrapper });

    // Wait for load to finish
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 2000 });

    // Add product
    await act(async () => {
      await result.current.addProduct(testProduct);
    });

    await waitFor(() => {
      expect(result.current.products).toHaveLength(1);
      expect(result.current.products[0].id).toBe(testProduct.id);
      expect(result.current.products[0].name).toBe(testProduct.name);
    });

    // Update product
    const updates = { name: 'Updated Product' };
    await act(async () => {
      await result.current.updateProduct(testProduct.id, updates);
    });

    await waitFor(() => {
      expect(result.current.products[0].name).toBe('Updated Product');
    });

    // Delete product
    await act(async () => {
      await result.current.deleteProduct(testProduct.id);
    });

    await waitFor(() => {
      expect(result.current.products).toEqual([]);
    });
  });
});