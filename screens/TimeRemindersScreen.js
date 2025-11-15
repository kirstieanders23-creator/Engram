import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../providers/ThemeProvider';
import { useFocusEffect } from '@react-navigation/native';
import {
  getTimeReminders,
  createTimeReminder,
  deleteTimeReminder,
  completeReminder,
  getReminderStatus,
  getUpcomingReminders,
  getReminderStats,
  formatTime12Hour,
  getCategoryIcon,
  createSampleReminders,
} from '../utils/time-reminders';

/**
 * Time Reminders Screen
 * 
 * Event & coordination reminders
 * 
 * Examples:
 * - "Mom gets home at 5pm - finish chores"
 * - "Package delivery 2-4pm - be home"
 * - "Trash pickup tomorrow 7am"
 */

export const TimeRemindersScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [reminders, setReminders] = useState([]);
  const [upcomingReminders, setUpcomingReminders] = useState([]);
  const [stats, setStats] = useState(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  
  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newReminderText, setNewReminderText] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [newAdvanceNotice, setNewAdvanceNotice] = useState('30');

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const all = await getTimeReminders();
    const upcoming = await getUpcomingReminders(24);
    const statistics = await getReminderStats();
    
    setReminders(all);
    setUpcomingReminders(upcoming);
    setStats(statistics);
  };

  const handleAddReminder = async () => {
    if (!newTitle.trim() || !newEventDate || !newEventTime) {
      Alert.alert('Error', 'Please fill in title, date, and time');
      return;
    }

    const result = await createTimeReminder({
      title: newTitle.trim(),
      type: 'event',
      eventDate: newEventDate,
      eventTime: newEventTime,
      advanceNotice: parseInt(newAdvanceNotice) || 30,
      reminderText: newReminderText.trim(),
      category: 'coordination',
      priority: 'medium',
    });

    if (result.success) {
      setNewTitle('');
      setNewReminderText('');
      setNewEventDate('');
      setNewEventTime('');
      setAddModalVisible(false);
      await loadData();
    }
  };

  const handleDeleteReminder = (reminder) => {
    Alert.alert(
      'Delete Reminder',
      `Remove "${reminder.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteTimeReminder(reminder.id);
            await loadData();
          },
        },
      ]
    );
  };

  const handleCompleteReminder = async (reminder) => {
    await completeReminder(reminder.id);
    await loadData();
  };

  const renderReminder = (reminder) => {
    const status = getReminderStatus(reminder);
    const icon = getCategoryIcon(reminder.category);

    return (
      <TouchableOpacity
        key={reminder.id}
        style={[
          styles.reminderCard,
          { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: status.color, borderLeftWidth: 4 },
        ]}
        onLongPress={() => handleDeleteReminder(reminder)}
      >
        <View style={styles.reminderHeader}>
          <View style={[styles.iconBadge, { backgroundColor: status.color }]}>
            <Ionicons name={icon} size={20} color="#fff" />
          </View>
          <View style={styles.reminderTitleContainer}>
            <Text style={[styles.reminderTitle, { color: colors.text }]}>
              {reminder.title}
            </Text>
            <View style={styles.statusRow}>
              {status.urgent && <Ionicons name="alert-circle" size={14} color={status.color} />}
              <Text style={[styles.statusText, { color: status.color }]}>
                {status.message}
              </Text>
            </View>
          </View>
        </View>

        {reminder.reminderText && (
          <Text style={[styles.reminderText, { color: colors.secondaryText }]}>
            💭 {reminder.reminderText}
          </Text>
        )}

        <View style={styles.reminderMeta}>
          <View style={styles.metaChip}>
            <Ionicons name="calendar-outline" size={12} color={colors.secondaryText} />
            <Text style={[styles.metaText, { color: colors.secondaryText }]}>
              {new Date(reminder.eventDate).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.metaChip}>
            <Ionicons name="time-outline" size={12} color={colors.secondaryText} />
            <Text style={[styles.metaText, { color: colors.secondaryText }]}>
              {formatTime12Hour(reminder.eventTime)}
            </Text>
          </View>
        </View>

        {status.status === 'urgent' || status.status === 'soon' ? (
          <TouchableOpacity
            style={[styles.completeButton, { backgroundColor: colors.primary }]}
            onPress={() => handleCompleteReminder(reminder)}
          >
            <Text style={styles.completeButtonText}>Mark Complete</Text>
          </TouchableOpacity>
        ) : null}
      </TouchableOpacity>
    );
  };

  const getTodayDateString = () => {
    return new Date().toISOString().split('T')[0];
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Time Reminders</Text>
        <TouchableOpacity onPress={() => setAddModalVisible(true)} style={styles.addButton}>
          <Ionicons name="add-circle" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {stats && (
        <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>{stats.upcomingToday}</Text>
            <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Today</Text>
          </View>
          {stats.urgent > 0 && (
            <>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="alert-circle" size={20} color="#FF6B6B" />
                <Text style={[styles.statNumber, { color: '#FF6B6B' }]}>{stats.urgent}</Text>
                <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Urgent</Text>
              </View>
            </>
          )}
        </View>
      )}

      <ScrollView style={styles.scrollView}>
        {upcomingReminders.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              UPCOMING ({upcomingReminders.length})
            </Text>
            {upcomingReminders.map(renderReminder)}
          </View>
        )}

        {reminders.filter(r => !upcomingReminders.includes(r)).length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              ALL REMINDERS ({reminders.length})
            </Text>
            {reminders.filter(r => !upcomingReminders.includes(r)).map(renderReminder)}
          </View>
        )}

        {reminders.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="time-outline" size={80} color={colors.secondaryText} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Reminders Yet</Text>
            <Text style={[styles.emptyDescription, { color: colors.secondaryText }]}>
              Set time-based reminders for coordination and planning
            </Text>
            <TouchableOpacity
              style={[styles.sampleButton, { backgroundColor: colors.primary }]}
              onPress={async () => {
                await createSampleReminders();
                await loadData();
              }}
            >
              <Text style={styles.sampleButtonText}>Add Sample Reminders</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add Reminder Modal */}
      <Modal visible={addModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>New Time Reminder</Text>
            
            <Text style={[styles.inputLabel, { color: colors.secondaryText }]}>Event Title *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Mom gets home"
              placeholderTextColor={colors.secondaryText}
              value={newTitle}
              onChangeText={setNewTitle}
              autoFocus
            />
            
            <Text style={[styles.inputLabel, { color: colors.secondaryText }]}>Reminder (what to do)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Finish chores before Mom gets home"
              placeholderTextColor={colors.secondaryText}
              value={newReminderText}
              onChangeText={setNewReminderText}
            />
            
            <Text style={[styles.inputLabel, { color: colors.secondaryText }]}>Date * (YYYY-MM-DD)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder={getTodayDateString()}
              placeholderTextColor={colors.secondaryText}
              value={newEventDate}
              onChangeText={setNewEventDate}
            />
            
            <Text style={[styles.inputLabel, { color: colors.secondaryText }]}>Time * (HH:MM 24hr)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="17:00"
              placeholderTextColor={colors.secondaryText}
              value={newEventTime}
              onChangeText={setNewEventTime}
            />
            
            <Text style={[styles.inputLabel, { color: colors.secondaryText }]}>Notify before (minutes)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="30"
              placeholderTextColor={colors.secondaryText}
              value={newAdvanceNotice}
              onChangeText={setNewAdvanceNotice}
              keyboardType="number-pad"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.border }]}
                onPress={() => {
                  setAddModalVisible(false);
                  setNewTitle('');
                  setNewReminderText('');
                  setNewEventDate('');
                  setNewEventTime('');
                }}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleAddReminder}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  addButton: { padding: 4 },
  statsCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginHorizontal: 16, marginBottom: 16, padding: 16, borderRadius: 12 },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: 'bold' },
  statLabel: { fontSize: 11, marginTop: 4 },
  statDivider: { width: 1, height: 40, backgroundColor: '#ddd' },
  scrollView: { flex: 1 },
  section: { marginHorizontal: 16, marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  reminderCard: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  reminderHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  iconBadge: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  reminderTitleContainer: { flex: 1 },
  reminderTitle: { fontSize: 18, fontWeight: 'bold' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  statusText: { fontSize: 13, fontWeight: '600' },
  reminderText: { fontSize: 14, marginBottom: 12, lineHeight: 20 },
  reminderMeta: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12 },
  completeButton: { paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  completeButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 24, fontWeight: 'bold', marginTop: 20, marginBottom: 12 },
  emptyDescription: { fontSize: 15, textAlign: 'center', marginBottom: 24 },
  sampleButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  sampleButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center' },
  modal: { marginHorizontal: 24, padding: 24, borderRadius: 16 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 12 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 12 },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 16 },
  modalButton: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  modalButtonText: { fontSize: 16, fontWeight: '600' },
});
