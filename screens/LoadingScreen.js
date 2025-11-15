import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useTheme } from '../providers/ThemeProvider';

export const LoadingScreen = () => {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={{ color: colors.text, marginTop: 10 }}>Loading...</Text>
    </View>
  );
};