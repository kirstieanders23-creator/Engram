import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

export default function DetailScreen({ route }) {
  const { product } = route.params || {};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Product Detail</Text>
      {product?.photo && <Image source={{ uri: product.photo }} style={styles.image} />}
      <Text>Name: {product?.name}</Text>
      {/* Add warranty countdown, reminders, and edit/delete actions here */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: 16,
    borderRadius: 12,
  },
});
