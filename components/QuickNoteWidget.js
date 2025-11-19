
import React, { useState } from 'react';
import { View, TextInput, FlatList, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Button from './MasterKit/Button';
import * as Audio from 'expo-av';


export default function QuickNoteWidget() {
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);


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

  // Voice recording logic
  const startRecording = async () => {
    try {
      setIsRecording(true);
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Microphone permission is required to record notes.');
        setIsRecording(false);
        return;
      }
      await Audio.Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Audio.Recording.createAsync(Audio.Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      setRecording(recording);
    } catch (err) {
      Alert.alert('Recording error', err.message || 'Could not start recording.');
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      // Transcribe audio (mocked for now)
      // In production, integrate with a speech-to-text API
      const transcript = await mockTranscribe(uri);
      if (transcript.trim()) {
        setNotes([transcript, ...notes]);
      }
    } catch (err) {
      Alert.alert('Recording error', err.message || 'Could not stop recording.');
    }
  };

  // Mock transcription function (replace with real API for production)
  const mockTranscribe = async (uri) => {
    // Simulate transcription delay
    return new Promise((resolve) => setTimeout(() => resolve('Voice note (transcribed): ' + new Date().toLocaleTimeString()), 1200));
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
        <TouchableOpacity
          onPress={isRecording ? stopRecording : startRecording}
          style={[styles.voiceButton, isRecording && styles.voiceButtonActive]}
          accessibilityLabel={isRecording ? 'Stop recording' : 'Record voice note'}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>{isRecording ? '■' : '🎤'}</Text>
        </TouchableOpacity>
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
  voiceButton: {
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#4B5D52',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 36,
  },
  voiceButtonActive: {
    backgroundColor: '#ff4444',
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
