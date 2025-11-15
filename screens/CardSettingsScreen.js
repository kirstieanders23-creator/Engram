import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import PropTypes from 'prop-types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../providers/ThemeProvider';

const AVAILABLE_CARDS = [
  { id: 'quick-actions', title: 'Quick Actions', description: 'Scan, Camera, Rooms, Remove, Share', canDisable: false },
  { id: 'reminders', title: 'Reminders', description: 'Upcoming tasks and notifications', canDisable: true },
  { id: 'warranty-expiring', title: 'Warranty Alerts', description: 'Products with expiring warranties', canDisable: true },
  { id: 'notes', title: 'Notes', description: 'Quick notes and ideas for your home', canDisable: true },
  { id: 'fixes', title: 'Home Repairs', description: 'Track repairs and trusted pros', canDisable: true },
  { id: 'living-partners', title: 'Roommates & Shared Tasks', description: 'Coordinate with housemates', canDisable: true },
  { id: 'home-info', title: 'Home Info', description: 'Documents and information', canDisable: true },
  { id: 'bills', title: 'Monthly Bills', description: 'Track and split expenses', canDisable: true },
  { id: 'first-scan', title: 'First Home Scan', description: 'Get started guide', canDisable: true },
];

const STORAGE_KEY = '@dashboard_cards';

export const CardSettingsScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [visibleCards, setVisibleCards] = useState(
    AVAILABLE_CARDS.map(card => card.id)
  );
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadCardPreferences();
  }, []);

  const loadCardPreferences = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        setVisibleCards(JSON.parse(saved));
      }
    } catch (error) {
      console.log('Error loading card preferences:', error);
    }
  };

  const saveCardPreferences = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(visibleCards));
      setHasChanges(false);
      Alert.alert('Success', 'Dashboard customized!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save preferences');
    }
  };

  const toggleCard = (cardId) => {
    const card = AVAILABLE_CARDS.find(c => c.id === cardId);
    if (!card.canDisable) {
      Alert.alert('Cannot Disable', 'Quick Actions is required and cannot be disabled');
      return;
    }

    setHasChanges(true);
    setVisibleCards(prev => {
      if (prev.includes(cardId)) {
        return prev.filter(id => id !== cardId);
      } else {
        return [...prev, cardId];
      }
    });
  };

  const resetToDefault = () => {
    Alert.alert(
      'Reset to Default',
      'Show all dashboard cards?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          onPress: () => {
            setVisibleCards(AVAILABLE_CARDS.map(card => card.id));
            setHasChanges(true);
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>
          Customize Dashboard
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Choose which cards to display on your home screen
        </Text>

        <View style={styles.cardList}>
          {AVAILABLE_CARDS.map(card => {
            const isVisible = visibleCards.includes(card.id);
            return (
              <View
                key={card.id}
                style={[styles.cardItem, { backgroundColor: colors.card }]}
              >
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    {card.title}
                  </Text>
                  <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
                    {card.description}
                  </Text>
                  {!card.canDisable && (
                    <Text style={[styles.requiredText, { color: colors.accent }]}>
                      Required
                    </Text>
                  )}
                </View>
                <Switch
                  value={isVisible}
                  onValueChange={() => toggleCard(card.id)}
                  trackColor={{ false: '#ccc', true: colors.accent }}
                  thumbColor={isVisible ? '#fff' : '#f4f3f4'}
                  disabled={!card.canDisable}
                />
              </View>
            );
          })}
        </View>

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.button, styles.resetButton, { backgroundColor: colors.card }]}
            onPress={resetToDefault}
          >
            <Text style={[styles.buttonText, { color: colors.text }]}>
              Reset to Default
            </Text>
          </TouchableOpacity>

          {hasChanges && (
            <TouchableOpacity
              style={[styles.button, styles.saveButton, { backgroundColor: colors.accent }]}
              onPress={saveCardPreferences}
            >
              <Text style={[styles.buttonText, { color: '#fff' }]}>
                Save Changes
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

CardSettingsScreen.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
  }).isRequired,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 24,
  },
  cardList: {
    gap: 12,
    marginBottom: 24,
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardInfo: {
    flex: 1,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  requiredText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  buttonGroup: {
    gap: 12,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resetButton: {
    borderWidth: 1,
    borderColor: '#ddd',
  },
  saveButton: {
    // accent color applied inline
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
