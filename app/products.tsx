import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import levenshtein from 'fast-levenshtein';
import React, { useState } from 'react';
import { Button, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';

function fuzzyMatch(query, items) {
  return items.filter(item => {
    const name = item.name.toLowerCase();
    const q = query.toLowerCase();
    return name.includes(q) || levenshtein.get(name, q) < 3;
  });
}

export default function ProductsScreen() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState(null);

  const filtered = search ? fuzzyMatch(search, products) : products;

  const addProduct = () => {
    if (name) {
      setProducts([...products, { name, photo }]);
      setName('');
      setPhoto(null);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Products</ThemedText>
      <TextInput
        style={styles.input}
        placeholder="Search..."
        value={search}
        onChangeText={setSearch}
      />
      <TextInput
        style={styles.input}
        placeholder="Add product name..."
        value={name}
        onChangeText={setName}
      />
      <Button title="Add Product" onPress={addProduct} />
      <FlatList
        data={filtered}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}>
            {item.photo ? (
              <Image source={{ uri: item.photo }} style={styles.thumbnail} />
            ) : null}
            <Text>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  input: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  thumbnail: {
    width: 50,
    height: 50,
    marginRight: 12,
    borderRadius: 8,
  },
});
