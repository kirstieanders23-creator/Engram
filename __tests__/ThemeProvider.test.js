import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react-native';
import { ThemeProvider, useTheme } from '../providers/ThemeProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants';

describe('ThemeProvider', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('provides default light theme', async () => {
    const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>;
    const { result } = renderHook(() => useTheme(), { wrapper });

    // Wait for any async init in the provider to finish
    await waitFor(() => {
      expect(result.current.isDark).toBe(false);
    });
    expect(result.current.colors).toBeDefined();
    expect(result.current.colors.background).toBe('#FFFFFF');
  });

  it('toggles theme', async () => {
    const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>;
    const { result } = renderHook(() => useTheme(), { wrapper });
    // Ensure initial async load finished before toggling (otherwise load may overwrite)
    await waitFor(() => {
      expect(result.current.isDark).toBe(false);
    });

    await act(async () => {
      await result.current.toggleTheme();
    });

    // Wait for state to update after toggle
    await waitFor(() => {
      expect(result.current.isDark).toBe(true);
    });
    expect(result.current.colors.background).toBe('#1A1F1D'); // Dark charcoal green

    // Verify theme was saved to storage
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    expect(JSON.parse(stored)).toEqual({ dark: true });
  });

  it('loads saved theme from storage', async () => {
    // Save dark theme preference
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({ dark: true }));

    const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>;
    const { result } = renderHook(() => useTheme(), { wrapper });

    // Wait for async load
    await waitFor(() => {
      expect(result.current.isDark).toBe(true);
    });
    expect(result.current.colors.background).toBe('#1A1F1D'); // Dark charcoal green
  });
});