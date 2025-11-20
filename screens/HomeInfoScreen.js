import React from 'react';
import { SafeAreaView, View, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { useTheme } from '../providers/ThemeProvider';

export const HomeInfoScreen = ({ navigation }) => {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}
      accessible accessibilityLabel="Home Info Screen">
      <View style={styles.content} accessible accessibilityRole="header">
        <Text style={[styles.title, { color: colors.text }]} allowFontScaling accessibilityLabel="Home Info">📄 Home Info</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]} allowFontScaling accessibilityLabel="Coming soon: Store lease, insurance, mortgage, WiFi password, and emergency contacts!"> 
          Coming soon: Store lease, insurance, mortgage, WiFi password, and emergency contacts!
        </Text>
      </View>
    </SafeAreaView>
  );
};

HomeInfoScreen.propTypes = {
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
