import {
  getUrgentMealSuggestions,
  getUrgencyColor,
  hasUrgentIngredients,
  formatSuggestionForDisplay,
} from '../utils/smart-meal-suggestions';
import { getExpirationStatus } from '../utils/expiration-tracker';
import { getMealHistory } from '../utils/meal-history';

// Mock dependencies
jest.mock('../providers/DatabaseProvider', () => ({
  getDatabase: jest.fn(),
}));

jest.mock('../utils/expiration-tracker', () => ({
  getExpirationStatus: jest.fn(),
}));

jest.mock('../utils/meal-history', () => ({
  getMealHistory: jest.fn(),
}));

import { getDatabase } from '../providers/DatabaseProvider';

describe('Smart Meal Suggestions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUrgentMealSuggestions', () => {
    it('should return empty array when no expiring items', async () => {
      getDatabase.mockResolvedValue({
        products: [
          {
            id: '1',
            name: 'Ground Beef',
            expirationDate: '2025-12-31', // Far future
          },
        ],
      });

      getMealHistory.mockResolvedValue([]);
      getExpirationStatus.mockReturnValue({
        daysLeft: 365,
        status: 'active',
      });

      const result = await getUrgentMealSuggestions(3);
      expect(result).toEqual([]);
    });

    it('should match expiring ingredients with meal history', async () => {
      getDatabase.mockResolvedValue({
        products: [
          {
            id: '1',
            name: 'Ground Beef',
            expirationDate: '2025-11-15', // 2 days from now
          },
        ],
      });

      getMealHistory.mockResolvedValue([
        {
          id: 'meal1',
          name: 'Beef Tacos',
          rating: 5,
          ingredients: ['ground beef', 'taco shells', 'cheese'],
        },
      ]);

      getExpirationStatus.mockReturnValue({
        daysLeft: 2,
        status: 'warning',
      });

      const result = await getUrgentMealSuggestions(3);
      
      expect(result).toHaveLength(1);
      expect(result[0].expiringItem.name).toBe('Ground Beef');
      expect(result[0].suggestedMeals[0].name).toBe('Beef Tacos');
      expect(result[0].urgencyLevel).toBe('warning');
    });

    it('should prioritize high-rated meals', async () => {
      getDatabase.mockResolvedValue({
        products: [
          {
            id: '1',
            name: 'Chicken',
            expirationDate: '2025-11-15',
          },
        ],
      });

      getMealHistory.mockResolvedValue([
        {
          id: 'meal1',
          name: 'Chicken Soup',
          rating: 3,
          ingredients: ['chicken', 'carrots'],
        },
        {
          id: 'meal2',
          name: 'Chicken Stir Fry',
          rating: 5,
          ingredients: ['chicken', 'vegetables'],
        },
      ]);

      getExpirationStatus.mockReturnValue({
        daysLeft: 2,
        status: 'warning',
      });

      const result = await getUrgentMealSuggestions(3);
      
      expect(result[0].suggestedMeals[0].name).toBe('Chicken Stir Fry'); // 5 stars first
      expect(result[0].suggestedMeals[1].name).toBe('Chicken Soup');
    });
  });

  describe('getUrgencyColor', () => {
    it('should return red for critical urgency', () => {
      expect(getUrgencyColor('critical')).toBe('#FF3B30');
    });

    it('should return orange for urgent', () => {
      expect(getUrgencyColor('urgent')).toBe('#FF9500');
    });

    it('should return yellow for warning', () => {
      expect(getUrgencyColor('warning')).toBe('#FFD700');
    });

    it('should return blue for notice', () => {
      expect(getUrgencyColor('notice')).toBe('#007AFF');
    });
  });

  describe('hasUrgentIngredients', () => {
    it('should return true when urgent suggestions exist', async () => {
      getDatabase.mockResolvedValue({
        products: [
          {
            id: '1',
            name: 'Beef',
            expirationDate: '2025-11-15',
          },
        ],
      });

      getMealHistory.mockResolvedValue([
        {
          id: 'meal1',
          name: 'Beef Tacos',
          rating: 5,
          ingredients: ['beef'],
        },
      ]);

      getExpirationStatus.mockReturnValue({
        daysLeft: 2,
        status: 'warning',
      });

      const result = await hasUrgentIngredients();
      expect(result).toBe(true);
    });

    it('should return false when no urgent suggestions', async () => {
      getDatabase.mockResolvedValue({
        products: [],
      });

      getMealHistory.mockResolvedValue([]);

      const result = await hasUrgentIngredients();
      expect(result).toBe(false);
    });
  });

  describe('formatSuggestionForDisplay', () => {
    it('should format suggestion with all required fields', () => {
      const suggestion = {
        expiringItem: {
          id: '1',
          name: 'Ground Beef',
          status: { daysLeft: 2 },
          expirationDate: '2025-11-15',
        },
        suggestedMeals: [
          {
            id: 'meal1',
            name: 'Beef Tacos',
            rating: 5,
          },
        ],
        urgencyLevel: 'warning',
        message: 'Use beef for tacos!',
      };

      const result = formatSuggestionForDisplay(suggestion);

      expect(result).toMatchObject({
        id: 'suggestion_1',
        urgencyLevel: 'warning',
        urgencyColor: '#FFD700',
        expiringItem: {
          name: 'Ground Beef',
          daysLeft: 2,
        },
        topMeal: {
          id: 'meal1',
          name: 'Beef Tacos',
        },
        message: 'Use beef for tacos!',
      });
    });
  });
});
