import React from 'react';
import { SafeAreaView, View, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { useTheme } from '../providers/ThemeProvider';

export const MaintenanceScreen = ({ navigation }) => {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>🔧 Home Repairs</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Coming soon: Track repairs, assign tasks to rooms, and save your trusted pros!
        </Text>
        <View style={styles.featureList}>
          <Text style={[styles.feature, { color: colors.text }]}>
            ✓ Needed Repairs - What needs fixing
          </Text>
          <Text style={[styles.feature, { color: colors.text }]}>
            ✓ Completed Repairs - History with notes & photos
          </Text>
          <Text style={[styles.feature, { color: colors.text }]}>
            ✓ Trusted Pros - Save your favorite contractors
          </Text>
          <Text style={[styles.feature, { color: colors.text }]}>
            ✓ Room Assignment - Organize by location
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

MaintenanceScreen.propTypes = {
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
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  featureList: {
    alignSelf: 'stretch',
    paddingHorizontal: 40,
  },
  feature: {
    fontSize: 15,
    marginBottom: 12,
    lineHeight: 22,
  },
});
