import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../providers/ThemeProvider';
import { useDatabase } from '../providers/DatabaseProvider';

// Available dashboard cards (ordered by priority)
const AVAILABLE_CARDS = [
  { id: 'quick-actions', title: 'Quick Actions', description: 'Wizard, Scan, Camera, Rooms, Export, Remove, Share' },
  { id: 'reminders', title: 'Reminders', description: 'Upcoming tasks and notifications' },
  { id: 'warranty-expiring', title: 'Warranty Alerts', description: 'Products with expiring warranties' },
  { id: 'notes', title: 'Notes', description: 'Quick notes and ideas for your home' },
  { id: 'fixes', title: 'Home Repairs', description: 'Track repairs and trusted pros' },
  { id: 'living-partners', title: 'Roommates & Shared Tasks', description: 'Coordinate with housemates' },
  { id: 'home-info', title: 'Home Info', description: 'Documents and important information' },
  { id: 'bills', title: 'Monthly Bills', description: 'Track and split expenses' },
  { id: 'first-scan', title: 'First Home Scan', description: 'Get started with your inventory' },
];

const STORAGE_KEY = '@dashboard_cards';

export const DashboardScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { products } = useDatabase();
  const [visibleCards, setVisibleCards] = useState(
    AVAILABLE_CARDS.map(card => card.id)
  );


  // Load user's card preferences
  useEffect(() => {
    loadCardPreferences();
  }, []);

  // Refresh products when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      // This will trigger a re-render if products change
      // If you need to force a reload from storage/server, do it here
      return () => {};
    }, [products])
  );

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

  // Calculate warranty stats
  const getWarrantyStats = () => {
    const now = new Date();
    const expiringSoon = products.filter(p => {
      if (!p.warranty) return false;
      const warrantyDate = new Date(p.warranty);
      const daysRemaining = Math.ceil((warrantyDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysRemaining > 0 && daysRemaining <= 30;
    });
    return { count: expiringSoon.length, products: expiringSoon };
  };

  const warrantyStats = getWarrantyStats();

  // Check if card should be visible
  const isCardVisible = (cardId) => visibleCards.includes(cardId);

  // Handle PDF export
  const handleExportPDF = async () => {
    try {
      if (products.length === 0) {
        Alert.alert('No Products', 'Add some products before exporting.');
        return;
      }

      Alert.alert(
        'Export Inventory Report',
        'Choose report type:',
        [
          {
            text: 'Insurance Report',
            onPress: async () => {
              try {
                const { exportInsuranceReport } = await import('../utils/pdf-export');
                await exportInsuranceReport(products);
                Alert.alert('Success', 'Insurance report generated and ready to share!');
              } catch (error) {
                Alert.alert('Error', `Failed to export: ${error.message}`);
              }
            },
          },
          {
            text: 'Simple List',
            onPress: async () => {
              try {
                const { exportSimpleInventory } = await import('../utils/pdf-export');
                await exportSimpleInventory(products);
                Alert.alert('Success', 'Inventory list generated and ready to share!');
              } catch (error) {
                Alert.alert('Error', `Failed to export: ${error.message}`);
              }
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to export inventory');
    }
  };

  // Card Components
  const QuickActionsCard = () => (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <Text style={[styles.cardTitle, { color: colors.text }]}>Quick Actions</Text>
      <View style={styles.actionGrid}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.accent }]}
          onPress={() => navigation.navigate('RoomWizard')}
        >
          <Ionicons name="compass-outline" size={24} color="#fff" />
          <Text style={styles.actionText}>WIZARD</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('Products', { openScanner: true })}
        >
          <Ionicons name="barcode-outline" size={24} color="#fff" />
          <Text style={styles.actionText}>SCAN</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('Products', { openCamera: true })}
        >
          <Ionicons name="camera-outline" size={24} color="#fff" />
          <Text style={styles.actionText}>CAMERA</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('Products')}
        >
          <Ionicons name="home-outline" size={24} color="#fff" />
          <Text style={styles.actionText}>ROOMS</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.accent }]}
          onPress={handleExportPDF}
        >
          <Ionicons name="document-text-outline" size={24} color="#fff" />
          <Text style={styles.actionText}>EXPORT</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => Alert.alert('Remove Mode', 'Bulk delete coming soon!')}
        >
          <Ionicons name="trash-outline" size={24} color="#fff" />
          <Text style={styles.actionText}>REMOVE</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.accent }]}
          onPress={() => navigation.navigate('MealHistory')}
        >
          <Ionicons name="book-outline" size={24} color="#fff" />
          <Text style={styles.actionText}>RECIPES</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.accent }]}
          onPress={() => navigation.navigate('ShoppingList')}
        >
          <Ionicons name="cart-outline" size={24} color="#fff" />
          <Text style={styles.actionText}>SHOPPING</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('DailyChecklist')}
        >
          <Ionicons name="checkbox-outline" size={24} color="#fff" />
          <Text style={styles.actionText}>DAILY</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('DontBuyAgain')}
        >
          <Ionicons name="ban-outline" size={24} color="#fff" />
          <Text style={styles.actionText}>DON'T BUY</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('TimeReminders')}
        >
          <Ionicons name="time-outline" size={24} color="#fff" />
          <Text style={styles.actionText}>TIMERS</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const WarrantyAlertsCard = () => {
    if (warrantyStats.count === 0) return null;
    
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.card }]}
        onPress={() => navigation.navigate('Products', { filter: 'expiring' })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="alert-circle" size={20} color="#ff4444" />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Warranty Alerts</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: '#ff4444' }]}>
            <Text style={styles.badgeText}>{warrantyStats.count}</Text>
          </View>
        </View>
        <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
          {warrantyStats.count} {warrantyStats.count === 1 ? 'product' : 'products'} expiring soon
        </Text>
        {warrantyStats.products.slice(0, 2).map(product => (
          <View key={product.id} style={styles.listItem}>
            <Text style={[styles.listItemText, { color: colors.text }]}>
              • {product.name}
            </Text>
          </View>
        ))}
      </TouchableOpacity>
    );
  };

  const RemindersCard = () => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card }]}
      onPress={() => navigation.navigate('Reminders')}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Ionicons name="calendar-outline" size={20} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>Reminders</Text>
        </View>
      </View>
      <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
        Upcoming tasks and notifications
      </Text>
      <View style={styles.reminderPreview}>
        <View style={styles.reminderItem}>
          <View style={[styles.reminderDot, { backgroundColor: '#44dd44' }]} />
          <Text style={[styles.reminderText, { color: colors.text }]}>
            Example: Weekly trash pickup
          </Text>
        </View>
        <View style={styles.reminderItem}>
          <View style={[styles.reminderDot, { backgroundColor: '#ffaa00' }]} />
          <Text style={[styles.reminderText, { color: colors.text }]}>
            Example: Filter change due soon
          </Text>
        </View>
        <TouchableOpacity style={styles.addButton}>
          <Text style={[styles.addButtonText, { color: colors.accent }]}>
            + Create Reminder
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const FixesCard = () => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card }]}
      onPress={() => navigation.navigate('Maintenance')}
    >
      <View style={styles.cardTitleRow}>
        <Ionicons name="construct-outline" size={20} color={colors.primary} />
        <Text style={[styles.cardTitle, { color: colors.text }]}>Home Repairs</Text>
      </View>
      <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
        Track repairs and find trusted pros
      </Text>
      <View style={styles.repairsGrid}>
        <View style={[styles.repairSection, { backgroundColor: colors.background }]}>
          <Text style={[styles.repairLabel, { color: colors.text }]}>Needed Repairs</Text>
          <Text style={[styles.repairHint, { color: colors.textSecondary }]}>
            Track what needs fixing
          </Text>
        </View>
        <View style={[styles.repairSection, { backgroundColor: colors.background }]}>
          <Text style={[styles.repairLabel, { color: colors.text }]}>Completed Repairs</Text>
          <Text style={[styles.repairHint, { color: colors.textSecondary }]}>
            History & notes
          </Text>
        </View>
        <View style={[styles.repairSection, { backgroundColor: colors.accent, opacity: 0.9 }]}>
          <View style={styles.repairLabelRow}>
            <Ionicons name="star" size={14} color="#fff" />
            <Text style={[styles.repairLabel, { color: '#fff' }]}>Trusted Pros</Text>
          </View>
          <Text style={[styles.repairHint, { color: 'rgba(255,255,255,0.9)' }]}>
            Your favorite contractors
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const LivingPartnersCard = () => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card }]}
      onPress={() => navigation.navigate('Roommates')}
    >
      <View style={styles.cardTitleRow}>
        <Ionicons name="people-outline" size={20} color={colors.primary} />
        <Text style={[styles.cardTitle, { color: colors.text }]}>Roommates & Shared Tasks</Text>
      </View>
      <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
        Coordinate chores, requests, and house tasks
      </Text>
      <View style={styles.roommateActions}>
        <TouchableOpacity style={[styles.actionLink, { borderColor: colors.accent }]}>
          <Text style={[styles.actionLinkText, { color: colors.accent }]}>
            + Add Roommates & Assign Tasks
          </Text>
        </TouchableOpacity>
        <Text style={[styles.actionHint, { color: colors.textSecondary }]}>
          Send requests, track chores, set reminders
        </Text>
      </View>
    </TouchableOpacity>
  );

  const NotesCard = () => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card }]}
      onPress={() => navigation.navigate('Notes')}
    >
      <View style={styles.cardTitleRow}>
        <Ionicons name="document-text-outline" size={20} color={colors.primary} />
        <Text style={[styles.cardTitle, { color: colors.text }]}>Notes</Text>
      </View>
      <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
        Quick ideas, reminders, and home observations
      </Text>
      <View style={styles.notesPreview}>
        <View style={styles.noteCategories}>
          <View style={[styles.noteTag, { backgroundColor: '#ff4444' }]}>
            <Ionicons name="alert-circle" size={14} color="#fff" />
            <Text style={styles.noteTagText}>Urgent</Text>
          </View>
          <View style={[styles.noteTag, { backgroundColor: '#44aaff' }]}>
            <Ionicons name="bulb-outline" size={14} color="#fff" />
            <Text style={styles.noteTagText}>Ideas</Text>
          </View>
          <View style={[styles.noteTag, { backgroundColor: '#ffaa00' }]}>
            <Ionicons name="time-outline" size={14} color="#fff" />
            <Text style={styles.noteTagText}>Waiting</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.addButton}>
          <Text style={[styles.addButtonText, { color: colors.accent }]}>
            + Add Note
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const HomeInfoCard = () => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card }]}
      onPress={() => navigation.navigate('HomeInfo')}
    >
      <View style={styles.cardTitleRow}>
        <Ionicons name="folder-outline" size={20} color={colors.primary} />
        <Text style={[styles.cardTitle, { color: colors.text }]}>Home Info</Text>
      </View>
      <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
        address, insurance, mortgage (stuff like that)
      </Text>
      <View style={styles.comingSoon}>
        <Text style={[styles.comingSoonText, { color: colors.textSecondary }]}>
          Tap to add documents
        </Text>
      </View>
    </TouchableOpacity>
  );

  const BillsCard = () => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card }]}
      onPress={() => navigation.navigate('Bills')}
    >
      <View style={styles.cardTitleRow}>
        <Ionicons name="cash-outline" size={20} color={colors.primary} />
        <Text style={[styles.cardTitle, { color: colors.text }]}>Monthly Bills</Text>
      </View>
      <View style={styles.comingSoon}>
        <Text style={[styles.comingSoonText, { color: colors.textSecondary }]}>
          Tap to track bills
        </Text>
      </View>
    </TouchableOpacity>
  );

  const FirstScanCard = () => {
    if (products.length > 0) return null;
    
    return (
      <TouchableOpacity
        style={[styles.card, styles.highlightCard, { backgroundColor: colors.accent }]}
        onPress={() => navigation.navigate('Products', { openScanner: true })}
      >
        <View style={[styles.cardTitleRow, { marginBottom: 8 }]}>
          <Ionicons name="home-outline" size={24} color="#fff" />
          <Text style={[styles.cardTitle, { color: '#fff' }]}>First Home Scan</Text>
        </View>
        <Text style={[styles.cardSubtitle, { color: 'rgba(255,255,255,0.9)' }]}>
          Get started by scanning your first product!
        </Text>
      </TouchableOpacity>
    );
  };

  const renderCard = (cardId) => {
    if (!isCardVisible(cardId)) return null;

    switch (cardId) {
      case 'quick-actions':
        return <QuickActionsCard key={cardId} />;
      case 'reminders':
        return <RemindersCard key={cardId} />;
      case 'warranty-expiring':
        return <WarrantyAlertsCard key={cardId} />;
      case 'notes':
        return <NotesCard key={cardId} />;
      case 'fixes':
        return <FixesCard key={cardId} />;
      case 'living-partners':
        return <LivingPartnersCard key={cardId} />;
      case 'home-info':
        return <HomeInfoCard key={cardId} />;
      case 'bills':
        return <BillsCard key={cardId} />;
      case 'first-scan':
        return <FirstScanCard key={cardId} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <View style={[styles.profileIcon, { backgroundColor: colors.primary }]}>
            <Ionicons name="person" size={22} color="#fff" />
          </View>
        </TouchableOpacity>
        <View style={styles.headerText}>
          <View style={[styles.titleContainer, { backgroundColor: 'rgba(201, 169, 97, 0.12)' }]}>
            <Text style={[styles.title, { color: colors.accent, textShadowColor: 'rgba(201, 169, 97, 0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 }]}>ENGRAM</Text>
          </View>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Your Home, Elevated</Text>
        </View>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <View style={[styles.settingsIcon, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="settings-outline" size={22} color={colors.primary} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Scrollable Cards */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {AVAILABLE_CARDS.map(card => renderCard(card.id))}
        
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Customize your dashboard in Settings
          </Text>
        </View>
      </ScrollView>

      {/* Floating Quick Lookup Button */}
      <TouchableOpacity
        style={[styles.quickLookupButton, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('QuickLookup', { autoCapture: true })}
      >
        <Ionicons name="camera" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Floating Quick Add Button */}
      <TouchableOpacity
        style={[styles.quickAddButton, { backgroundColor: colors.accent }]}
        onPress={() => navigation.navigate('QuickAdd')}
      >
        <Ionicons name="flash" size={28} color="#fff" />
        <Text style={styles.quickAddText}>Quick Add</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

DashboardScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
  },
  profileButton: {
    width: 44,
    height: 44,
  },
  profileIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  headerText: {
    flex: 1,
    alignItems: 'center',
  },
  titleContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(201, 169, 97, 0.25)',
  },
  title: {
    fontSize: 38,
    fontWeight: '900',        // Maximum bold weight
    letterSpacing: 1.5,       // Reduced spacing for tighter, bolder look (was 2.5)
    fontFamily: 'System',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',        // Medium weight
    fontStyle: 'normal',
    marginTop: 4,
    letterSpacing: 1.2,       // Wider letter spacing for elegance
    textTransform: 'uppercase',
  },
  settingsButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  highlightCard: {
    shadowOpacity: 0.15,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,             // Slightly smaller for modern look (was 20)
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -0.3,      // Tighter for modern feel
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardSubtitle: {
    fontSize: 13,             // More modern sizing (was 14)
    marginBottom: 12,
    lineHeight: 18,
    fontWeight: '400',        // Regular weight
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  reminderPreview: {
    marginTop: 12,
    gap: 10,
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reminderDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  reminderText: {
    fontSize: 14,
    flex: 1,
  },
  addButton: {
    marginTop: 8,
    paddingVertical: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  repairsGrid: {
    gap: 10,
    marginTop: 12,
  },
  repairSection: {
    padding: 14,
    borderRadius: 12,
  },
  repairLabel: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  repairLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  repairHint: {
    fontSize: 13,
  },
  roommateActions: {
    marginTop: 12,
    gap: 10,
  },
  actionLink: {
    borderWidth: 2,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  actionLinkText: {
    fontSize: 14,
    fontWeight: '700',
  },
  actionHint: {
    fontSize: 13,
    textAlign: 'center',
  },
  notesPreview: {
    marginTop: 12,
    gap: 12,
  },
  noteCategories: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  noteTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  noteTagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  fixesGrid: {
    gap: 8,
    marginTop: 8,
  },
  fixItem: {
    padding: 12,
    borderRadius: 10,
  },
  fixText: {
    fontSize: 13,
  },
  listItem: {
    paddingVertical: 6,
  },
  listItemText: {
    fontSize: 14,
  },
  comingSoon: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  comingSoonText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  footer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  quickLookupButton: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  quickAddButton: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  quickAddText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
