

import { useTheme } from '../providers/ThemeProvider';
import { useWindowDimensions } from 'react-native';

export default function QuickNoteWidget() {
  const { colors } = useTheme();
  const { fontScale } = useWindowDimensions();
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
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}
      accessible accessibilityLabel="Quick Notes Widget">
      <Text style={[styles.title, { color: colors.text, fontSize: 18 * fontScale }]} accessibilityRole="header">Quick Notes</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
          placeholder="Type a note..."
          placeholderTextColor={colors.textSecondary}
          value={note}
          onChangeText={setNote}
          accessibilityLabel="Quick note input"
          allowFontScaling
        />
        <Button
          title={editingIndex !== null ? 'Update' : 'Add'}
          onPress={handleAddOrEdit}
          style={[styles.addButton, { backgroundColor: colors.accent }]}
          accessibilityLabel={editingIndex !== null ? 'Update note' : 'Add note'}
        />
        <TouchableOpacity
          onPress={isRecording ? stopRecording : startRecording}
          style={[styles.voiceButton, isRecording && { backgroundColor: colors.error || '#ff4444' }]}
          accessibilityLabel={isRecording ? 'Stop recording' : 'Record voice note'}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 * fontScale }}>{isRecording ? '\u25a0' : '\ud83c\udfa4'}</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={notes}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item, index }) => (
          <View style={[styles.noteRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
            accessible accessibilityLabel={`Note ${index + 1}`}
          >
            <Text style={[styles.noteText, { color: colors.text, fontSize: 15 * fontScale }]} allowFontScaling>{item}</Text>
            <TouchableOpacity onPress={() => handleEdit(index)} accessibilityLabel="Edit note">
              <Text style={[styles.action, { color: colors.accent }]}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(index)} accessibilityLabel="Delete note">
              <Text style={[styles.action, { color: colors.error || '#ff4444' }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={[styles.empty, { color: colors.textSecondary }]}>No notes yet.</Text>}
        accessibilityLabel="Notes list"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    padding: 16,
    margin: 16,
    elevation: 2,
    borderWidth: 1,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
  },
  addButton: {
    marginLeft: 8,
    paddingHorizontal: 16,
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
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
  },
  noteText: {
    flex: 1,
  },
  action: {
    marginLeft: 12,
    fontWeight: 'bold',
  },
  empty: {
    textAlign: 'center',
    marginTop: 12,
  },
});
