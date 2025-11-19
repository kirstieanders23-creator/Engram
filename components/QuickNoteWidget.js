import React, { useState } from 'react';
import { View, TextInput, FlatList, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Button from './MasterKit/Button';

export default function QuickNoteWidget() {
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);

  const handleAddOrEdit = () => {
    if (note.trim() === '') return;
    if (editingIndex !== null) {
      const updated = [...notes];
      updated[editingIndex] = note;
      setNotes(updated);
      setEditingIndex(null);
    } else {
      setNotes([note, ...notes]);
    }
    setNote('');
  };

  const handleEdit = (index) => {
    setNote(notes[index]);
    setEditingIndex(index);
  };

  const handleDelete = (index) => {
    setNotes(notes.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setNote('');
      setEditingIndex(null);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick Notes</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Type a note..."
          value={note}
          onChangeText={setNote}
          accessibilityLabel="Quick note input"
        />
        <Button
          title={editingIndex !== null ? 'Update' : 'Add'}
          onPress={handleAddOrEdit}
          style={styles.addButton}
        />
      </View>
      <FlatList
        data={notes}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item, index }) => (
          <View style={styles.noteRow}>
            <Text style={styles.noteText}>{item}</Text>
            <TouchableOpacity onPress={() => handleEdit(index)} accessibilityLabel="Edit note">
              <Text style={styles.action}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(index)} accessibilityLabel="Delete note">
              <Text style={[styles.action, { color: 'red' }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No notes yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 16,
    margin: 16,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#4B5D52',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  input: {
    flex: 1,
    borderColor: '#b2c8b2',
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    backgroundColor: '#fff',
  },
  addButton: {
    marginLeft: 8,
    paddingHorizontal: 16,
    backgroundColor: '#6B8E7D',
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    backgroundColor: '#e6f2ea',
    borderRadius: 6,
    padding: 8,
  },
  noteText: {
    flex: 1,
    color: '#333',
    fontSize: 15,
  },
  action: {
    marginLeft: 12,
    color: '#6B8E7D',
    fontWeight: 'bold',
  },
  empty: {
    color: '#aaa',
    textAlign: 'center',
    marginTop: 12,
  },
});
