import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import React from "react";
import { Button, StyleSheet, Text, View } from "react-native";

const data = {
  products: [],
  settings: {},
  user: {},
};

export default function SettingsScreen() {
  const exportData = async () => {
    const fileUri = FileSystem.documentDirectory + "engram-backup.json";
    await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(data));
    await Sharing.shareAsync(fileUri);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Button title="Export Data" onPress={exportData} />
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
});
