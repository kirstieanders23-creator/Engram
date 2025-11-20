
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  TextInput,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../providers/ThemeProvider';
import PropTypes from 'prop-types';

const STORAGE_KEY = '@notes';
const NOTE_CATEGORIES = [
  { id: 'urgent', label: 'Urgent', icon: 'alert-circle', color: '#ff4444' },
  { id: 'ideas', label: 'Ideas', icon: 'bulb-outline', color: '#44aaff' },
  { id: 'waiting', label: 'Waiting on Quote', icon: 'time-outline', color: '#ffaa00' },
  { id: 'general', label: 'General', icon: 'document-text-outline', color: '#999' },
];

const NotesScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [notes, setNotes] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [noteCategory, setNoteCategory] = useState('general');
  const [noteRoom, setNoteRoom] = useState('');

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        setNotes(JSON.parse(saved));
      }
    } catch (error) {
      console.log('Error loading notes:', error);
    }
  };

  const saveNotes = async (updatedNotes) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotes));
      setNotes(updatedNotes);
    } catch (error) {
      Alert.alert('Error', 'Failed to save note');
    }
  };

  const addNote = () => {
    if (!noteText.trim()) {
      Alert.alert('Empty Note', 'Please enter some text');
      return;
    }

    const newNote = {
      id: Date.now().toString(),
      text: noteText,
      category: noteCategory,
      room: noteRoom,
      createdAt: new Date().toISOString(),
    };

    const updatedNotes = [newNote, ...notes];
    saveNotes(updatedNotes);
    closeModal();
  };

  const updateNote = () => {
    if (!noteText.trim()) {
      Alert.alert('Empty Note', 'Please enter some text');
      return;
    }

    const updatedNotes = notes.map(note =>
      note.id === editingNote.id
        ? { ...note, text: noteText, category: noteCategory, room: noteRoom }
        : note
    );

    saveNotes(updatedNotes);
    closeModal();
  };

  const deleteNote = (noteId) => {
    Alert.alert(
      'Delete Note',
      'Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedNotes = notes.filter(note => note.id !== noteId);
            saveNotes(updatedNotes);
          },
        },
      ]
    );
  };

  const openAddModal = () => {
    setEditingNote(null);
    setNoteText('');
    setNoteCategory('general');
    setNoteRoom('');
    setModalVisible(true);
  };

  const openEditModal = (note) => {
    setEditingNote(note);
    setNoteText(note.text);
    setNoteCategory(note.category);
    setNoteRoom(note.room || '');
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingNote(null);
    setNoteText('');
    setNoteCategory('general');
    setNoteRoom('');
  };

  const getCategoryInfo = (categoryId) => {
    return NOTE_CATEGORIES.find(cat => cat.id === categoryId) || NOTE_CATEGORIES[3];
  };

  const groupedNotes = NOTE_CATEGORIES.reduce((acc, cat) => {
    acc[cat.id] = notes.filter(note => note.category === cat.id);
    return acc;
  }, {});

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>📝 Notes</Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.accent }]}
            onPress={openAddModal}
          >
            <Text style={styles.addButtonText}>+ Add Note</Text>
          </TouchableOpacity>
        </View>

        {notes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No notes yet. Tap + to add your first note!
            </Text>
          </View>
        ) : (
          NOTE_CATEGORIES.map(category => {
            const categoryNotes = groupedNotes[category.id];
            if (categoryNotes.length === 0) return null;

            return (
              <View key={category.id} style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                  <Ionicons name={category.icon} size={20} color={category.color} />
                  <Text style={[styles.categoryTitle, { color: colors.text }]}>
                    {category.label} ({categoryNotes.length})
                  </Text>
                </View>

                {categoryNotes.map(note => (
                  <TouchableOpacity
                    key={note.id}
                    style={[styles.noteCard, { backgroundColor: colors.card }]}
                    onPress={() => openEditModal(note)}
                    onLongPress={() => deleteNote(note.id)}
                  >
                    <View style={styles.noteHeader}>
                      <View style={[styles.noteCategoryBadge, { backgroundColor: category.color }]}>
                        <Ionicons name={category.icon} size={14} color="#fff" />
                        <Text style={styles.noteCategoryText}>{category.label}</Text>
                      </View>
                      {note.room && (
                        <View style={styles.noteRoomContainer}>
                          <Ionicons name="home-outline" size={14} color={colors.textSecondary} />
                          <Text style={[styles.noteRoom, { color: colors.textSecondary }]}>
                            {note.room}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.noteText, { color: colors.text }]}>
                      {note.text}
                    </Text>
                    <Text style={[styles.noteDate, { color: colors.textSecondary }]}>
                      {new Date(note.createdAt).toLocaleDateString()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingNote ? 'Edit Note' : 'Add Note'}
            </Text>

            <TextInput
              style={[styles.textInput, { 
                backgroundColor: colors.background, 
                color: colors.text,
                borderColor: colors.border,
              }]}
              placeholder="Enter your note..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={6}
              value={noteText}
              onChangeText={setNoteText}
              autoFocus
            />

            <Text style={[styles.label, { color: colors.text }]}>Category</Text>
            <View style={styles.categoryPicker}>
              {NOTE_CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryOption,
                    { 
                      backgroundColor: noteCategory === cat.id ? cat.color : colors.background,
                      borderColor: cat.color,
                    }
                  ]}
                  onPress={() => setNoteCategory(cat.id)}
                >
                  <Ionicons 
                    name={cat.icon} 
                    size={16} 
                    color={noteCategory === cat.id ? '#fff' : cat.color} 
                  />
                  <Text style={[
                    styles.categoryOptionText,
                    { color: noteCategory === cat.id ? '#fff' : colors.text }
                  ]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.text }]}>Room (Optional)</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.background, 
                color: colors.text,
                borderColor: colors.border,
              }]}
              placeholder="e.g., Kitchen, Bedroom"
              placeholderTextColor={colors.textSecondary}
              value={noteRoom}
              onChangeText={setNoteRoom}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.background }]}
                onPress={closeModal}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.accent }]}
                onPress={editingNote ? updateNote : addNote}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>
                  {editingNote ? 'Update' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>

            {editingNote && (
              <TouchableOpacity
                style={[styles.deleteButton, { backgroundColor: colors.error }]}
                onPress={() => {
                  closeModal();
                  deleteNote(editingNote.id);
                }}
              >
                <Text style={styles.deleteButtonText}>Delete Note</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};


NotesScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
};

export default NotesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  noteCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  noteCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  noteCategoryText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  noteRoomContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  noteRoom: {
    fontSize: 13,
  },
  noteText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  noteDate: {
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 500,
    borderRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
  },
  categoryPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 2,
  },
  categoryOptionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  deleteButton: {
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
