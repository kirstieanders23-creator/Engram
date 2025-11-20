import React from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import PropTypes from 'prop-types';
import { useTheme } from '../providers/ThemeProvider';
import { useAuth } from '../providers/AuthProvider';

export const ProfileScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { user, handleLogout } = useAuth();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}
      accessible accessibilityLabel="Profile Screen">
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.profileIcon, { backgroundColor: colors.primary }]} accessible accessibilityLabel="Profile icon">
          <Text style={styles.profileIconText} allowFontScaling accessibilityLabel="Profile icon">👤</Text>
        </View>
        
        <Text style={[styles.email, { color: colors.text }]} allowFontScaling accessibilityLabel={`Email: ${user?.email || 'User'}`}>{user?.email || 'User'}</Text>

        <View style={styles.menuSection} accessible accessibilityRole="menu">
          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate('Settings')}
            accessibilityLabel="Settings"
          >
            <Text style={[styles.menuText, { color: colors.text }]} allowFontScaling>⚙️  Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate('CardSettings')}
            accessibilityLabel="Customize Dashboard"
          >
            <Text style={[styles.menuText, { color: colors.text }]} allowFontScaling>🎴  Customize Dashboard</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate('Import')}
            accessibilityLabel="Import from Amazon"
          >
            <Text style={[styles.menuText, { color: colors.text }]} allowFontScaling>📥  Import from Amazon</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: colors.error }]}
            onPress={handleLogout}
            accessibilityLabel="Logout"
          >
            <Text style={[styles.menuText, { color: '#fff' }]} allowFontScaling>🚪  Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

ProfileScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  profileIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileIconText: {
    fontSize: 48,
  },
  email: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 40,
  },
  menuSection: {
    width: '100%',
    gap: 12,
  },
  menuItem: {
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
