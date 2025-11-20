import React, { createContext, useContext, useEffect, useState } from 'react';
import { storage } from '../utils/storage';

const ThemeContext = createContext(null);

// Light theme colors - Beautiful Sage & Gold Palette
const lightColors = {
  primary: '#8A9A5B',      // Classic sage green
  secondary: '#588157',    // Deep sage for text
  accent: '#C9A961',       // Rich, bold gold - more elegant
  background: '#DFE3E0',   // Darker sage for better card contrast (was #E8EBE9)
  card: '#FFFFFF',         // White card background
  text: '#1A1A1A',         // Soft premium black
  textSecondary: '#6B7280', // Neutral gray (was sage - more professional)
  border: '#E5E7EB',       // Light neutral border (was sage-tinted)
  error: '#E53E3E',
  success: '#8A9A5B',
  warning: '#DD6B20',
  goldGradient: 'linear-gradient(45deg, #B8860B, #DAA520, #B8860B)', // Deeper gold gradient
};

// Dark theme colors - Elegant Sage & Gold (dark mode)
const darkColors = {
  primary: '#8A9A5B',      // Sage green for dark
  secondary: '#6B8372',    // Medium forest green
  accent: '#D4B56F',       // Brighter gold
  background: '#1A1F1D',   // Deep charcoal green
  card: '#252C28',         // Dark sage card
  text: '#F5F3ED',         // Cream text
  textSecondary: '#A3B0A7', // Light sage
  border: '#3A4440',       // Subtle green border
  error: '#D47772',
  success: '#8A9A5B',
  warning: '#E0B884',
};


export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    console.log('ThemeProvider: mounting');
    const loadTheme = async () => {
      try {
        const settings = await storage.getSettings();
        console.log('ThemeProvider: loaded settings', settings);
        setIsDark(settings.dark);
      } catch (e) {
        console.error('ThemeProvider: error loading settings', e);
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    await storage.setSettings({ dark: newTheme });
  };


  const value = {
    isDark,
    colors: isDark ? darkColors : lightColors,
    toggleTheme,
  };
  console.log('ThemeProvider: value', value);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};