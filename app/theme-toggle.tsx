import { useColorScheme } from "@/hooks/use-color-scheme";
import React, { useState } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";

export default function ThemeToggleScreen() {
  const [isDark, setIsDark] = useState(useColorScheme() === "dark");

  const toggleTheme = () => {
    setIsDark(!isDark);
    // Add persistence logic here (AsyncStorage, etc.)
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Theme</Text>
      <View style={styles.row}>
        <Text>Light</Text>
        <Switch value={isDark} onValueChange={toggleTheme} />
        <Text>Dark</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
});
