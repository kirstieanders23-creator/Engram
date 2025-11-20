import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../providers/ThemeProvider';
import {
  getUrgentMealSuggestions,
  formatSuggestionForDisplay,
} from '../utils/smart-meal-suggestions';

/**
const UrgentMealSuggestion = ({ navigation, onDismiss }) => {
  const { colors } = useTheme();
  const { fontScale } = useWindowDimensions();
  const [suggestion, setSuggestion] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-200)); // Start off-screen

  useEffect(() => {
    loadSuggestion();
  }, []);

  const loadSuggestion = async () => {
    try {
      const suggestions = await getUrgentMealSuggestions(3);
      if (suggestions.length > 0) {
        const formatted = formatSuggestionForDisplay(suggestions[0]);
        setSuggestion(formatted);
        // Slide in animation
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }
    } catch (error) {
      console.error('Error loading urgent meal suggestion:', error);
    }
  };

  const handleDismiss = () => {
    // Slide out animation
    Animated.timing(slideAnim, {
      toValue: -200,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setDismissed(true);
      if (onDismiss) onDismiss();
    });
  };

  const handleAccept = () => {
    // Navigate to meal planning screen
    navigation.navigate('MealPlanning', {
      suggestedMeal: suggestion.topMeal,
      expiringItem: suggestion.expiringItem,
    });
    handleDismiss();
  };

  // Don't show if no suggestion or already dismissed
  if (!suggestion || dismissed) {
    return null;
  }

  const { urgencyColor, expiringItem, topMeal, message } = suggestion;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderLeftColor: urgencyColor,
          transform: [{ translateY: slideAnim }],
        },
      ]}
      accessible accessibilityLabel="Urgent Meal Suggestion Banner"
    >
      {/* Close button */}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={handleDismiss}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityLabel="Dismiss meal suggestion"
      >
        <Ionicons name="close" size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      {/* Icon */}
      <View style={[styles.iconContainer, { backgroundColor: urgencyColor + '20' }]}
        accessible accessibilityLabel="Meal suggestion icon">
        <Ionicons name="restaurant" size={24} color={urgencyColor} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text, fontSize: 14 * fontScale }]} accessibilityRole="header">
          Meal Suggestion
        </Text>
        <Text style={[styles.message, { color: colors.text, fontSize: 15 * fontScale }]}>{message}</Text>
        <Text style={[styles.details, { color: colors.textSecondary, fontSize: 12 * fontScale }]}
          accessibilityLabel={`Expiring item: ${expiringItem.name}, expires in ${expiringItem.daysLeft} days`}>
          {expiringItem.name} expires in {expiringItem.daysLeft} day{expiringItem.daysLeft !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Action button */}
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: urgencyColor }]}
        onPress={handleAccept}
        accessibilityLabel="Add meal suggestion to plan"
      >
        <Text style={styles.actionText}>Add to Plan</Text>
        <Ionicons name="arrow-forward" size={16} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
};
        <Text style={[styles.message, { color: colors.text }]}>
          {message}
        </Text>
        <Text style={[styles.details, { color: colors.textSecondary }]}>
          {expiringItem.name} expires in {expiringItem.daysLeft} day{expiringItem.daysLeft !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Action button */}
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: urgencyColor }]}
        onPress={handleAccept}
      >
        <Text style={styles.actionText}>Add to Plan</Text>
        <Ionicons name="arrow-forward" size={16} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
    zIndex: 10,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  message: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  details: {
    fontSize: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  actionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default UrgentMealSuggestion;
