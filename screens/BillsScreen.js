import React from 'react';
import { SafeAreaView, View, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { useTheme } from '../providers/ThemeProvider';

export const BillsScreen = ({ navigation }) => {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}
      accessible accessibilityLabel="Bills Screen">
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>💰 Monthly Bills</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Coming soon: Track bills, split costs with roommates, and get payment reminders!
        </Text>
      </View>
    </SafeAreaView>
  );
};

BillsScreen.propTypes = {
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
    paddingHorizontal: 20,
  },
});
