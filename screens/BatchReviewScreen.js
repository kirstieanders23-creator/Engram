import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useDatabase } from '../providers/DatabaseProvider';
import { useNavigation } from '@react-navigation/native';

export default function BatchReviewScreen({ route }) {
  const navigation = useNavigation();
  const { products, updateProduct, rooms } = useDatabase();
  // Assume newItems is passed via navigation or filter for recently added/unsorted
  const newItems = route?.params?.newItems || products.filter(p => p.room === 'Put Away');

  const handleAssignRoom = (itemId, room) => {
    updateProduct(itemId, { room });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors?.background || '#fff' }]} accessible accessibilityLabel="Batch Review Screen">
      <Text style={[styles.header, { color: colors?.text || '#222' }]} allowFontScaling accessibilityLabel="Batch Review: Assign Rooms">Batch Review: Assign Rooms</Text>
      <FlatList
        data={newItems}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <Text style={[styles.itemName, { color: colors?.text || '#222' }]} allowFontScaling accessibilityLabel={`Item: ${item.name}`}>{item.name}</Text>
            <FlatList
              data={rooms}
              horizontal
              keyExtractor={room => room}
              renderItem={({ item: room }) => (
                <TouchableOpacity
                  style={[styles.roomButton, { backgroundColor: colors?.card || '#eee' }]}
                  onPress={() => handleAssignRoom(item.id, room)}
                  accessibilityLabel={`Assign to room: ${room}`}
                >
                  <Text style={[styles.roomText, { color: colors?.text || '#222' }]} allowFontScaling>{room}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
        ListEmptyComponent={<Text style={[styles.empty, { color: colors?.textSecondary || '#888' }]} allowFontScaling>No new items to review.</Text>}
      />
      <TouchableOpacity style={[styles.doneButton, { backgroundColor: colors?.primary || '#4CAF50' }]} onPress={() => navigation.goBack()} accessibilityLabel="Done">
        <Text style={[styles.doneText, { color: '#fff' }]} allowFontScaling>Done</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  itemName: { flex: 1, fontSize: 16 },
  roomButton: { backgroundColor: '#e0e0e0', borderRadius: 8, padding: 8, marginHorizontal: 4 },
  roomText: { fontSize: 14 },
  doneButton: { marginTop: 24, backgroundColor: '#4e8d7c', borderRadius: 8, padding: 16, alignItems: 'center' },
  doneText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  empty: { textAlign: 'center', color: '#888', marginTop: 32 },
});
