import React from 'react';
import { SafeAreaView, View, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { useTheme } from '../providers/ThemeProvider';

export const RoommatesScreen = ({ navigation }) => {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}
      accessible accessibilityLabel="Roommates Screen">
      <View style={styles.content} accessible accessibilityRole="header">
        <Text style={[styles.title, { color: colors.text }]} allowFontScaling accessibilityLabel="Roommates and Shared Tasks">👥 Roommates & Shared Tasks</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]} allowFontScaling accessibilityLabel="Coming soon: Invite roommates, assign chores, send requests, and coordinate house tasks!">
          Coming soon: Invite roommates, assign chores, send requests, and coordinate house tasks!
        </Text>
      </View>
    </SafeAreaView>
  );
};

RoommatesScreen.propTypes = {
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
});
