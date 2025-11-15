import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../providers/ThemeProvider';
import { useDatabase } from '../providers/DatabaseProvider';
import { usePremium } from '../providers/PremiumProvider';

/**
 * Quick Add Screen - Rapid photo capture for bulk inventory
 * Users can snap multiple photos quickly without filling forms
 * Products are auto-created with minimal data, editable later
 */
export const QuickAddScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { addProduct, rooms, products } = useDatabase();
  const { checkProductLimit } = usePremium();
  
  const [photos, setPhotos] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(route.params?.room || 'Uncategorized');
  const [isSaving, setIsSaving] = useState(false);

  // Auto-focus on camera when screen loads
  useEffect(() => {
    if (photos.length === 0) {
      handleTakePhoto();
    }
  }, []);

  const handleTakePhoto = async () => {
    try {
      const ImagePicker = await import('expo-image-picker');
      
      // Request camera permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera access is needed for Quick Add');
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.7,
        allowsEditing: false,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const uri = result.assets[0].uri;
        
        // Persist photo
        const { persistPhoto } = await import('../utils/photo');
        const savedPhoto = await persistPhoto(uri);
        
        setPhotos(prev => [...prev, savedPhoto]);
      }
    } catch (error) {
      console.error('Quick Add photo failed:', error);
      Alert.alert('Error', 'Failed to capture photo');
    }
  };

  const handleRemovePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveAll = async () => {
    if (photos.length === 0) {
      Alert.alert('No Photos', 'Take at least one photo before saving');
      return;
    }

    try {
      setIsSaving(true);

      // Check product limit before adding multiple products
      const canAdd = await checkProductLimit(products.length + photos.length - 1, navigation);
      if (!canAdd) {
        setIsSaving(false);
        return; // User will see paywall or cancel
      }

      // Create a product for each photo
      const timestamp = new Date().toLocaleDateString();
      
      for (let i = 0; i < photos.length; i++) {
        const productData = {
          name: `${currentRoom} Item ${i + 1} - ${timestamp}`,
          category: 'Quick Add',
          room: currentRoom,
          photos: [photos[i]],
          warranty: '', // No warranty in quick mode
          purchaseDate: '',
          purchasePrice: '',
          careInstructions: '',
          isDishwasherSafe: '',
          manualUrl: '',
          cleaningTips: '',
          usageNotes: 'Added via Quick Add - edit to add details',
          specifications: '',
        };

        await addProduct(productData);
      }

      Alert.alert(
        'Success! 🎉',
        `${photos.length} ${photos.length === 1 ? 'item' : 'items'} added to ${currentRoom}.\n\nTip: Tap any item later to add warranty, price, and other details.`,
        [
          {
            text: 'Add More',
            onPress: () => {
              setPhotos([]);
              handleTakePhoto();
            },
          },
          {
            text: 'Done',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Save failed:', error);
      Alert.alert('Error', 'Failed to save products');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangeRoom = () => {
    const roomList = rooms.length > 0 ? rooms : ['Kitchen', 'Living Room', 'Bedroom', 'Bathroom', 'Garage', 'Office'];
    
    Alert.alert(
      'Select Room',
      'Which room are you in?',
      [
        ...roomList.map(room => ({
          text: room,
          onPress: () => setCurrentRoom(room),
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Quick Add</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Snap photos, skip the forms
          </Text>
        </View>
        <TouchableOpacity onPress={handleChangeRoom} style={styles.roomButton}>
          <Ionicons name="location" size={20} color={colors.accent} />
          <Text style={[styles.roomText, { color: colors.accent }]}>{currentRoom}</Text>
        </TouchableOpacity>
      </View>

      {/* Photo Grid */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.photoGrid}>
          {photos.map((photo, index) => (
            <View key={index} style={[styles.photoCard, { backgroundColor: colors.card }]}>
              <Image source={{ uri: photo }} style={styles.photoImage} />
              <TouchableOpacity
                style={[styles.removeButton, { backgroundColor: colors.error }]}
                onPress={() => handleRemovePhoto(index)}
              >
                <Ionicons name="close" size={16} color="#fff" />
              </TouchableOpacity>
              <Text style={[styles.photoLabel, { color: colors.text }]}>
                Item {index + 1}
              </Text>
            </View>
          ))}
        </View>

        {photos.length > 0 && (
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              {photos.length} {photos.length === 1 ? 'photo' : 'photos'} ready. Tap "Take Another" to add more, or "Save All" to finish.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton, { backgroundColor: colors.secondary || '#555' }]}
          onPress={handleTakePhoto}
        >
          <Ionicons name="camera" size={24} color="#fff" />
          <Text style={styles.buttonText}>Take Another</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.primaryButton,
            { backgroundColor: photos.length > 0 ? colors.accent : colors.border },
          ]}
          onPress={handleSaveAll}
          disabled={photos.length === 0 || isSaving}
        >
          <Ionicons name="checkmark-circle" size={24} color="#fff" />
          <Text style={styles.buttonText}>
            {isSaving ? 'Saving...' : `Save All (${photos.length})`}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  roomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFF4E6',
  },
  roomText: {
    fontSize: 12,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoCard: {
    width: '48%',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  photoImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoLabel: {
    padding: 8,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    marginTop: 16,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },
  secondaryButton: {
    flex: 0.8,
  },
  primaryButton: {
    flex: 1.2,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
