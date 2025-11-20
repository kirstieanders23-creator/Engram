import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import PropTypes from 'prop-types';
import { Ionicons } from '@expo/vector-icons';

// Import providers and screens
import { ThemeProvider, useTheme } from './providers/ThemeProvider';
import { AuthProvider, useAuth } from './providers/AuthProvider';
import { DatabaseProvider, useDatabase } from './providers/DatabaseProvider';
import { PremiumProvider } from './providers/PremiumProvider';

console.log('App.js: File loaded');
import { DashboardScreen } from './screens/DashboardScreen';
import { ProductsScreen } from './screens/ProductsScreen';
import { ProductDetailScreen } from './screens/ProductDetailScreen';
import { RemindersScreen } from './screens/RemindersScreen';
import NotesScreen from './screens/NotesScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { MaintenanceScreen } from './screens/MaintenanceScreen';
import { RoommatesScreen } from './screens/RoommatesScreen';
import { HomeInfoScreen } from './screens/HomeInfoScreen';
import { BillsScreen } from './screens/BillsScreen';
import { CardSettingsScreen } from './screens/CardSettingsScreen';
import { LegalScreen } from './screens/LegalScreen';
import { QuickAddScreen } from './screens/QuickAddScreen';
import BatchReviewScreen from './screens/BatchReviewScreen';
import { RoomWizardScreen } from './screens/RoomWizardScreen';
import { QuickLookupScreen } from './screens/QuickLookupScreen';
import { UpgradeFinderScreen } from './screens/UpgradeFinderScreen';
import { WishListScreen } from './screens/WishListScreen';
import { ManualLookupScreen } from './screens/ManualLookupScreen';
import { TransferScreen } from './screens/TransferScreen';
import { ReceiveTransferScreen } from './screens/ReceiveTransferScreen';
import { ImportScreen } from './screens/ImportScreen';
import { ShoppingListScreen } from './screens/ShoppingListScreen';
import { MealPlanningScreen } from './screens/MealPlanningScreen';
import { SharedShoppingScreen } from './screens/SharedShoppingScreen';
import { DailyChecklistScreen } from './screens/DailyChecklistScreen';
import { DontBuyAgainScreen } from './screens/DontBuyAgainScreen';
import { TimeRemindersScreen } from './screens/TimeRemindersScreen';
import { MealHistoryScreen } from './screens/MealHistoryScreen';
import { LoginScreen } from './screens/LoginScreen';
import { SignupScreen } from './screens/SignupScreen';
import { LoadingScreen } from './screens/LoadingScreen';
import { PaywallScreen } from './screens/PaywallScreen';

import AsyncStorage from '@react-native-async-storage/async-storage';

const QUICK_ADD_PREFS_KEY = 'quickAddPrefs';

const SettingsScreen = ({ _navigation }) => {
  const { isDark, colors, toggleTheme } = useTheme();
  const { handleLogout } = useAuth();
  const { products } = useDatabase();
  const [exporting, setExporting] = React.useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [requestingPermission, setRequestingPermission] = React.useState(false);


  // Quick Add Preferences state
  const { rooms } = useDatabase();
  const [quickAddPrefs, setQuickAddPrefs] = React.useState({ defaultRoom: '', alwaysPrompt: true });

  // Load notification settings and quick add prefs on mount
  React.useEffect(() => {
    const loadSettings = async () => {
      try {
        const { areNotificationsEnabled } = await import('./utils/notifications');
        const enabled = await areNotificationsEnabled();
        setNotificationsEnabled(enabled);
        // Load quick add prefs
        const prefsRaw = await AsyncStorage.getItem(QUICK_ADD_PREFS_KEY);
        if (prefsRaw) setQuickAddPrefs(JSON.parse(prefsRaw));
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    loadSettings();
  }, []);

  const saveQuickAddPrefs = async (prefs) => {
    setQuickAddPrefs(prefs);
    await AsyncStorage.setItem(QUICK_ADD_PREFS_KEY, JSON.stringify(prefs));
  };

  const handleToggleNotifications = async () => {
    try {
      const { setNotificationsEnabled: setEnabled, requestNotificationPermissions } = await import('./utils/notifications');
      
      if (!notificationsEnabled) {
        // Show disclaimer before enabling
        Alert.alert(
          'Warranty Notifications Disclaimer',
          '⚠️ IMPORTANT: These notifications are reminders only.\n\n' +
          '• We are NOT responsible for missed notifications\n' +
          '• Delivery depends on device settings and connectivity\n' +
          '• Always verify warranty dates manually\n' +
          '• Keep original warranty documents\n\n' +
          'Do you understand and accept these terms?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'I Understand',
              onPress: async () => {
                // Enabling - request permissions after acceptance
                setRequestingPermission(true);
                const granted = await requestNotificationPermissions();
                setRequestingPermission(false);
                
                if (!granted) {
                  alert('Notification permissions denied. Please enable in your device settings.');
                  return;
                }
                
                const newValue = true;
                await setEnabled(newValue);
                setNotificationsEnabled(newValue);
              },
            },
          ]
        );
        return;
      }
      
      // Disabling - no confirmation needed
      const newValue = false;
      await setEnabled(newValue);
      setNotificationsEnabled(newValue);
    } catch (error) {
      console.error('Error toggling notifications:', error);
      alert('Failed to update notification settings');
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const backup = await import('./utils/backup');
      await backup.exportData();
      alert('Data exported successfully');
    } catch (e) {
      alert(`Export failed: ${e.message}`);
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      if (products.length === 0) {
        alert('No products to export. Add some items first!');
        return;
      }

      // Show disclaimer first
      Alert.alert(
        'PDF Export Disclaimer',
        '⚠️ IMPORTANT:\n\n' +
        '• PDF reports are for PERSONAL USE only\n' +
        '• NOT official insurance claim documents\n' +
        '• May not be accepted by all insurance companies\n' +
        '• Always consult your insurer for their requirements\n' +
        '• Verify all data is accurate before sharing\n\n' +
        'Choose report type:',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Insurance Report',
            onPress: async () => {
              try {
                const { exportInsuranceReport } = await import('./utils/pdf-export');
                await exportInsuranceReport(products);
                alert('Insurance report generated and ready to share!');
              } catch (error) {
                alert(`Failed to export: ${error.message}`);
              }
            },
          },
          {
            text: 'Simple Inventory',
            onPress: async () => {
              try {
                const { exportSimpleInventory } = await import('./utils/pdf-export');
                await exportSimpleInventory(products);
                alert('Inventory list generated and ready to share!');
              } catch (error) {
                alert(`Failed to export: ${error.message}`);
              }
            },
          },
        ]
      );
    } catch (error) {
      alert('Failed to export PDF');
    }
  };
  
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Notifications</Text>
        <TouchableOpacity 
          style={[styles.settingRow, { backgroundColor: colors.card, borderColor: colors.border }]} 
          onPress={handleToggleNotifications}
          disabled={requestingPermission}
        >
          <View style={styles.settingLeft}>
            <Text style={[styles.settingTitle, { color: colors.text }]}>Warranty Alerts</Text>
            <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
              Get notified when warranties are expiring
            </Text>
          </View>
          <View style={[styles.toggle, { backgroundColor: notificationsEnabled ? colors.accent : colors.border }]}>
            <Text style={styles.toggleText}>{notificationsEnabled ? 'ON' : 'OFF'}</Text>
          </View>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>Quick Add Preferences</Text>
        <View style={{ backgroundColor: colors.card, borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <Text style={{ color: colors.text, fontWeight: '600', marginBottom: 8 }}>Default Room</Text>
          <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 6, marginBottom: 12 }}>
            <TouchableOpacity
              onPress={() => {
                // Show room picker
                Alert.alert(
                  'Select Default Room',
                  '',
                  [
                    ...rooms.map(room => ({
                      text: room,
                      onPress: () => saveQuickAddPrefs({ ...quickAddPrefs, defaultRoom: room }),
                    })),
                    { text: 'None', onPress: () => saveQuickAddPrefs({ ...quickAddPrefs, defaultRoom: '' }) },
                    { text: 'Cancel', style: 'cancel' },
                  ]
                );
              }}
              style={{ padding: 12 }}
            >
              <Text style={{ color: colors.text }}>
                {quickAddPrefs.defaultRoom ? quickAddPrefs.defaultRoom : 'None'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <TouchableOpacity
              onPress={() => saveQuickAddPrefs({ ...quickAddPrefs, alwaysPrompt: !quickAddPrefs.alwaysPrompt })}
              style={{ marginRight: 12 }}
            >
              <View style={{ width: 32, height: 20, borderRadius: 10, backgroundColor: quickAddPrefs.alwaysPrompt ? colors.accent : colors.border, justifyContent: 'center' }}>
                <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: '#fff', marginLeft: quickAddPrefs.alwaysPrompt ? 14 : 2 }} />
              </View>
            </TouchableOpacity>
            <Text style={{ color: colors.text }}>
              Always prompt for room when using Quick Add
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>Appearance</Text>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.primary }]} 
          onPress={toggleTheme}
        >
          <Text style={styles.buttonText}>Toggle Theme (Current: {isDark ? 'Dark' : 'Light'})</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>Data</Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.accent, marginTop: 10 }]}
          onPress={handleExportPDF}
        >
          <Text style={styles.buttonText}>Export PDF Report</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.secondary || '#555', marginTop: 10 }]}
          onPress={handleExport}
          disabled={exporting}
        >
          <Text style={styles.buttonText}>{exporting ? 'Exporting...' : 'Export Data (JSON)'}</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>Legal</Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.secondary || '#555', marginTop: 10 }]}
          onPress={() => _navigation.navigate('Legal')}
        >
          <Text style={styles.buttonText}>Terms, Privacy & Disclaimer</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>Legal</Text>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.secondary || '#555', marginTop: 10 }]} 
          onPress={() => _navigation.navigate('Legal')}
        >
          <Text style={styles.buttonText}>Terms, Privacy & Disclaimers</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>Account</Text>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.error, marginTop: 10 }]} 
          onPress={handleLogout}
        >
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

SettingsScreen.propTypes = {
  _navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
};

// Navigation stacks
const AuthStack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom Tab Navigator
const MainTabs = () => {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          paddingBottom: 28,        // Increased for phone safe area (was 8)
          paddingTop: 12,           // Increased spacing (was 8)
          height: 88,               // Taller to account for phone controls (was 60)
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 11,             // Slightly smaller for modern look (was 12)
          fontWeight: '600',
          letterSpacing: 0.3,       // Better spacing
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size || 24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Products"
        component={ProductsScreen}
        options={{
          tabBarLabel: 'Products',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube" size={size || 24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Reminders"
        component={RemindersScreen}
        options={{
          tabBarLabel: 'Reminders',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size || 24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size || 24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};


const AppNavigator = () => {
  const { user, isLoading } = useAuth();
  const { isDark, colors } = useTheme();

  const navTheme = {
    dark: isDark,
    colors: {
      primary: colors.primary,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      notification: colors.primary,
    },
    fonts: {
      regular: {
        fontFamily: 'System',
        fontWeight: '400',
      },
      medium: {
        fontFamily: 'System',
        fontWeight: '500',
      },
      bold: {
        fontFamily: 'System',
        fontWeight: '700',
      },
      heavy: {
        fontFamily: 'System',
        fontWeight: '900',
      },
    },
  };

  console.log('AppNavigator render', { user, isLoading });

  if (isLoading) {
    console.log('LoadingScreen shown');
    return <LoadingScreen />;
  }

  // Always show main app, even if not logged in
  console.log('Rendering NavigationContainer');
  return (
    <NavigationContainer theme={navTheme}>
      <MainStack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <MainStack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
        <MainStack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: 'Product Details' }} />
        <MainStack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
        <MainStack.Screen name="CardSettings" component={CardSettingsScreen} options={{ title: 'Customize Dashboard' }} />
        <MainStack.Screen name="Notes" component={NotesScreen} options={{ title: 'Notes' }} />
        <MainStack.Screen name="Maintenance" component={MaintenanceScreen} options={{ title: 'Home Repairs' }} />
        <MainStack.Screen name="Roommates" component={RoommatesScreen} options={{ title: 'Roommates & Shared Tasks' }} />
        <MainStack.Screen name="HomeInfo" component={HomeInfoScreen} options={{ title: 'Home Info' }} />
        <MainStack.Screen name="Bills" component={BillsScreen} options={{ title: 'Monthly Bills' }} />
        <MainStack.Screen name="Legal" component={LegalScreen} options={{ headerShown: false }} />
        <MainStack.Screen name="QuickAdd" component={QuickAddScreen} options={{ headerShown: false }} />
        <MainStack.Screen name="BatchReview" component={BatchReviewScreen} options={{ title: 'Batch Review' }} />
        <MainStack.Screen name="RoomWizard" component={RoomWizardScreen} options={{ headerShown: false }} />
        <MainStack.Screen name="QuickLookup" component={QuickLookupScreen} options={{ headerShown: false }} />
        <MainStack.Screen name="UpgradeFinder" component={UpgradeFinderScreen} options={{ headerShown: false }} />
        <MainStack.Screen name="WishList" component={WishListScreen} options={{ headerShown: false }} />
        <MainStack.Screen name="ManualLookup" component={ManualLookupScreen} options={{ headerShown: false }} />
        <MainStack.Screen name="Transfer" component={TransferScreen} options={{ headerShown: false }} />
        <MainStack.Screen name="ReceiveTransfer" component={ReceiveTransferScreen} options={{ headerShown: false }} />
        <MainStack.Screen name="Import" component={ImportScreen} options={{ headerShown: false }} />
        <MainStack.Screen name="ShoppingList" component={ShoppingListScreen} options={{ headerShown: false }} />
        <MainStack.Screen name="MealPlanning" component={MealPlanningScreen} options={{ headerShown: false }} />
        <MainStack.Screen name="SharedShopping" component={SharedShoppingScreen} options={{ headerShown: false }} />
        <MainStack.Screen name="DailyChecklist" component={DailyChecklistScreen} options={{ headerShown: false }} />
        <MainStack.Screen name="DontBuyAgain" component={DontBuyAgainScreen} options={{ headerShown: false }} />
        <MainStack.Screen name="TimeReminders" component={TimeRemindersScreen} options={{ headerShown: false }} />
        <MainStack.Screen name="MealHistory" component={MealHistoryScreen} options={{ headerShown: false }} />
        <MainStack.Screen name="Paywall" component={PaywallScreen} options={{ headerShown: false }} />
        {/* Auth screens for cloud save only */}
        <MainStack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <MainStack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />
      </MainStack.Navigator>
    </NavigationContainer>
  );
};

// Main App component

const App = () => {
  console.log('App: Rendering App component');
  return (
    <ThemeProvider>
      <AuthProvider>
        <DatabaseProvider>
          <PremiumProvider>
            <AppNavigator />
          </PremiumProvider>
        </DatabaseProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

const AppNavigator = () => {
  const { user, isLoading } = useAuth();
  const { isDark, colors } = useTheme();

  const navTheme = {
    dark: isDark,
    colors: {
      primary: colors.primary,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      notification: colors.primary,
    },
    fonts: {
      regular: {
        fontFamily: 'System',
        fontWeight: '400',
      },
      medium: {
        fontFamily: 'System',
        fontWeight: '500',
      },
      bold: {
        fontFamily: 'System',
        fontWeight: '700',
      },
      heavy: {
        fontFamily: 'System',
        fontWeight: '900',
      },
    },
  };

  console.log('AppNavigator: user, isLoading', { user, isLoading });

  if (isLoading) {
    console.log('AppNavigator: LoadingScreen shown');
    return <LoadingScreen />;
  }

  // Always show main app, even if not logged in
  console.log('AppNavigator: Rendering NavigationContainer');
  return (
    <NavigationContainer theme={navTheme}>
      <MainStack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <MainStack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
        <MainStack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: 'Product Details' }} />
        <MainStack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
        <MainStack.Screen name="CardSettings" component={CardSettingsScreen} options={{ title: 'Customize Dashboard' }} />
        <MainStack.Screen name="Notes" component={NotesScreen} options={{ title: 'Notes' }} />
        <MainStack.Screen name="Maintenance" component={MaintenanceScreen} options={{ title: 'Home Repairs' }} />
        <MainStack.Screen name="Roommates" component={RoommatesScreen} options={{ title: 'Roommates & Shared Tasks' }} />
        <MainStack.Screen name="HomeInfo" component={HomeInfoScreen} options={{ title: 'Home Info' }} />
        <MainStack.Screen name="Bills" component={BillsScreen} options={{ title: 'Monthly Bills' }} />
        <MainStack.Screen name="Legal" component={LegalScreen} options={{ headerShown: false }} />
        <MainStack.Screen name="QuickAdd" component={QuickAddScreen} options={{ headerShown: false }} />
        <MainStack.Screen name="BatchReview" component={BatchReviewScreen} options={{ title: 'Batch Review' }} />
        <MainStack.Screen name="RoomWizard" component={RoomWizardScreen} options={{ headerShown: false }} />
        <MainStack.Screen name="QuickLookup" component={QuickLookupScreen} options={{ headerShown: false }} />
        <MainStack.Screen name="UpgradeFinder" component={UpgradeFinderScreen} options={{ headerShown: false }} />
        <MainStack.Screen name="WishList" component={WishListScreen} options={{ headerShown: false }} />
        <MainStack.Screen name="ManualLookup" component={ManualLookupScreen} options={{ headerShown: false }} />
        <MainStack.Screen name="Transfer" component={TransferScreen} options={{ headerShown: false }} />
        <MainStack.Screen name="ReceiveTransfer" component={ReceiveTransferScreen} options={{ headerShown: false }} />
        <MainStack.Screen name="Import" component={ImportScreen} options={{ headerShown: false }} />
        <MainStack.Screen name="ShoppingList" component={ShoppingListScreen} options={{ headerShown: false }} />
        <MainStack.Screen name="MealPlanning" component={MealPlanningScreen} options={{ headerShown: false }} />
        <MainStack.Screen name="SharedShopping" component={SharedShoppingScreen} options={{ headerShown: false }} />
        <MainStack.Screen name="DailyChecklist" component={DailyChecklistScreen} options={{ headerShown: false }} />
        <MainStack.Screen name="DontBuyAgain" component={DontBuyAgainScreen} options={{ headerShown: false }} />
        <MainStack.Screen name="TimeReminders" component={TimeRemindersScreen} options={{ headerShown: false }} />
        <MainStack.Screen name="MealHistory" component={MealHistoryScreen} options={{ headerShown: false }} />
        <MainStack.Screen name="Paywall" component={PaywallScreen} options={{ headerShown: false }} />
        {/* Auth screens for cloud save only */}
        <MainStack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <MainStack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />
      </MainStack.Navigator>
    </NavigationContainer>
  );
};
    marginTop: 20,
  },
  linkText: {
    fontSize: 16,
    textAlign: 'center',
  },
});