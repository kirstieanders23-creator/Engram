import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../providers/ThemeProvider';
import { useDatabase } from '../providers/DatabaseProvider';
import { usePremium } from '../providers/PremiumProvider';

/**
 * Room Wizard - Guided room-by-room inventory setup
 * Makes adding 50+ items feel like a game with progress tracking
 * Perfect for new users to get started quickly
 */

const DEFAULT_ROOMS = [
  { name: 'Kitchen', icon: 'restaurant', color: '#FF6B6B' },
  { name: 'Living Room', icon: 'tv', color: '#4ECDC4' },
  { name: 'Bedroom', icon: 'bed', color: '#95E1D3' },
  { name: 'Bathroom', icon: 'water', color: '#3D84A8' },
  { name: 'Office', icon: 'desktop', color: '#46C2CB' },
  { name: 'Garage', icon: 'car', color: '#F38181' },
  { name: 'Laundry', icon: 'shirt', color: '#AA96DA' },
  { name: 'Dining Room', icon: 'wine', color: '#FCBAD3' },
  { name: 'Basement', icon: 'archive', color: '#786FA6' },
  { name: 'Attic', icon: 'cube', color: '#F8B500' },
];

export const RoomWizardScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { addProduct, products } = useDatabase();
  const { checkProductLimit } = usePremium();
  
  const [step, setStep] = useState('welcome'); // welcome, select-room, capture, review, complete
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [capturedPhotos, setCapturedPhotos] = useState([]);
  const [photoMetadata, setPhotoMetadata] = useState({}); // Store OCR results per photo
  const [completedRooms, setCompletedRooms] = useState([]);
  const [totalItemsAdded, setTotalItemsAdded] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Welcome Step
  const WelcomeStep = () => (
    <View style={styles.welcomeContainer}>
      <View style={styles.welcomeIcon}>
        <Ionicons name="home" size={80} color={colors.accent} />
      </View>
      
      <Text style={[styles.welcomeTitle, { color: colors.text }]}>
        Welcome to Your Home Inventory!
      </Text>
      
      <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
        Let's walk through your home room by room. This should only take 10-15 minutes.
      </Text>

      <View style={styles.benefitsBox}>
        <View style={styles.benefitRow}>
          <Ionicons name="flash" size={24} color={colors.accent} />
          <Text style={[styles.benefitText, { color: colors.text }]}>
            Quick photos, no typing required
          </Text>
        </View>
        <View style={styles.benefitRow}>
          <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
          <Text style={[styles.benefitText, { color: colors.text }]}>
            Track progress as you go
          </Text>
        </View>
        <View style={styles.benefitRow}>
          <Ionicons name="construct" size={24} color="#FF6B6B" />
          <Text style={[styles.benefitText, { color: colors.text }]}>
            Add details later if needed
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: colors.accent }]}
        onPress={() => setStep('select-room')}
      >
        <Text style={styles.primaryButtonText}>Let's Get Started!</Text>
        <Ionicons name="arrow-forward" size={24} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.skipButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={[styles.skipText, { color: colors.textSecondary }]}>
          I'll do this later
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Room Selection Step
  const SelectRoomStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.progressHeader}>
        <Text style={[styles.stepTitle, { color: colors.text }]}>
          Choose a Room to Start
        </Text>
        <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
          {completedRooms.length > 0 
            ? `${completedRooms.length} ${completedRooms.length === 1 ? 'room' : 'rooms'} completed • ${totalItemsAdded} items added`
            : 'Start with any room'}
        </Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.roomGrid}
        showsVerticalScrollIndicator={false}
      >
        {DEFAULT_ROOMS.map((room) => {
          const isCompleted = completedRooms.includes(room.name);
          
          return (
            <TouchableOpacity
              key={room.name}
              style={[
                styles.roomCard,
                { backgroundColor: colors.card, borderColor: isCompleted ? colors.primary : colors.border },
                isCompleted && styles.roomCardCompleted,
              ]}
              onPress={() => {
                setSelectedRoom(room);
                setStep('capture');
              }}
            >
              <View style={[styles.roomIconContainer, { backgroundColor: room.color + '20' }]}>
                <Ionicons name={room.icon} size={32} color={room.color} />
              </View>
              <Text style={[styles.roomName, { color: colors.text }]}>
                {room.name}
              </Text>
              {isCompleted && (
                <View style={styles.completedBadge}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: colors.border }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
            {completedRooms.length > 0 ? 'Finish Later' : 'Cancel'}
          </Text>
        </TouchableOpacity>
        
        {completedRooms.length > 0 && (
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.accent }]}
            onPress={() => setStep('complete')}
          >
            <Text style={styles.primaryButtonText}>Done</Text>
            <Ionicons name="checkmark" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // Capture Photos Step
  const CaptureStep = () => {
    const handleTakePhoto = async () => {
      try {
        const ImagePicker = await import('expo-image-picker');
        
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Camera access is needed');
          return;
        }

        const result = await ImagePicker.launchCameraAsync({
          quality: 0.7,
          allowsEditing: false,
        });

        if (!result.canceled && result.assets && result.assets[0]) {
          setIsProcessing(true);
          
          const { persistPhoto } = await import('../utils/photo');
          const savedPhoto = await persistPhoto(result.assets[0].uri);
          
          // Run OCR to identify brand and product
          try {
            const { recognizeProduct } = await import('../utils/ocr');
            const ocrResult = await recognizeProduct(savedPhoto);
            
            // Store metadata for this photo
            setPhotoMetadata(prev => ({
              ...prev,
              [savedPhoto]: {
                productName: ocrResult.productName || null,
                brand: ocrResult.brand || null,
                confidence: ocrResult.confidence || 0,
              }
            }));
          } catch (ocrError) {
            console.error('OCR identification failed:', ocrError);
            // Continue without OCR data
          }
          
          setCapturedPhotos(prev => [...prev, savedPhoto]);
          setIsProcessing(false);
        }
      } catch (error) {
        console.error('Photo capture failed:', error);
        Alert.alert('Error', 'Failed to capture photo');
        setIsProcessing(false);
      }
    };

    const handleRemovePhoto = (index) => {
      setCapturedPhotos(prev => prev.filter((_, i) => i !== index));
    };

    const handleNext = () => {
      if (capturedPhotos.length === 0) {
        Alert.alert('No Photos', 'Take at least one photo before continuing');
        return;
      }
      setStep('review');
    };

    return (
      <View style={styles.stepContainer}>
        <View style={styles.progressHeader}>
          <TouchableOpacity onPress={() => setStep('select-room')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <View style={[styles.roomBadge, { backgroundColor: selectedRoom.color + '20' }]}>
              <Ionicons name={selectedRoom.icon} size={20} color={selectedRoom.color} />
              <Text style={[styles.roomBadgeText, { color: selectedRoom.color }]}>
                {selectedRoom.name}
              </Text>
            </View>
            <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
              {capturedPhotos.length > 0 
                ? `${capturedPhotos.length} ${capturedPhotos.length === 1 ? 'item' : 'items'} photographed`
                : 'Snap photos of items in this room'}
            </Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.photoGrid}>
          {capturedPhotos.map((photo, index) => (
            <View key={index} style={[styles.photoCard, { backgroundColor: colors.card }]}>
              <Image source={{ uri: photo }} style={styles.photoImage} />
              <TouchableOpacity
                style={[styles.removePhotoButton, { backgroundColor: colors.error }]}
                onPress={() => handleRemovePhoto(index)}
              >
                <Ionicons name="close" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        <View style={styles.captureFooter}>
          <TouchableOpacity
            style={[styles.cameraButton, { backgroundColor: isProcessing ? colors.border : colors.accent }]}
            onPress={handleTakePhoto}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Processing...</Text>
            ) : (
              <Ionicons name="camera" size={32} color="#fff" />
            )}
          </TouchableOpacity>
          
          {capturedPhotos.length > 0 && (
            <TouchableOpacity
              style={[styles.nextButton, { backgroundColor: colors.primary }]}
              onPress={handleNext}
              disabled={isProcessing}
            >
              <Text style={styles.nextButtonText}>
                Continue ({capturedPhotos.length})
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // Review Step
  const ReviewStep = () => {
    const handleSave = async () => {
      try {
        // Check product limit before adding multiple products
        const canAdd = await checkProductLimit(products.length + capturedPhotos.length - 1, navigation);
        if (!canAdd) {
          return; // User will see paywall or cancel
        }

        const timestamp = new Date().toLocaleDateString();
        
        for (let i = 0; i < capturedPhotos.length; i++) {
          const photoUri = capturedPhotos[i];
          const metadata = photoMetadata[photoUri] || {};
          
          // Generate smart name based on OCR results
          let productName;
          if (metadata.brand && metadata.productName) {
            productName = `${metadata.brand} ${metadata.productName}`;
          } else if (metadata.brand) {
            productName = `${metadata.brand} ${selectedRoom.name} Item`;
          } else if (metadata.productName) {
            productName = metadata.productName;
          } else {
            productName = `${selectedRoom.name} Item ${i + 1} - ${timestamp}`;
          }
          
          const productData = {
            name: productName,
            category: 'Room Wizard',
            room: selectedRoom.name,
            photos: [photoUri],
            warranty: '',
            purchaseDate: '',
            purchasePrice: '',
            careInstructions: '',
            isDishwasherSafe: '',
            manualUrl: '',
            cleaningTips: '',
            usageNotes: metadata.brand || metadata.productName 
              ? 'Added via Room Wizard - auto-identified from photo'
              : 'Added via Room Wizard - edit to add details',
            specifications: '',
          };

          await addProduct(productData);
        }

        setCompletedRooms(prev => [...prev, selectedRoom.name]);
        setTotalItemsAdded(prev => prev + capturedPhotos.length);
        setCapturedPhotos([]);
        setSelectedRoom(null);
        
        Alert.alert(
          'Room Complete! 🎉',
          `${capturedPhotos.length} items added to ${selectedRoom.name}.`,
          [
            {
              text: 'Next Room',
              onPress: () => setStep('select-room'),
            },
            {
              text: 'All Done',
              onPress: () => setStep('complete'),
            },
          ]
        );
      } catch (error) {
        console.error('Save failed:', error);
        Alert.alert('Error', 'Failed to save items');
      }
    };

    return (
      <View style={styles.stepContainer}>
        <View style={styles.progressHeader}>
          <TouchableOpacity onPress={() => setStep('capture')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Review & Save</Text>
            <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
              {capturedPhotos.length} items ready for {selectedRoom.name}
            </Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.reviewGrid}>
          {capturedPhotos.map((photo, index) => {
            const metadata = photoMetadata[photo] || {};
            const hasIdentification = metadata.brand || metadata.productName;
            
            return (
              <View key={index} style={[styles.reviewCard, { backgroundColor: colors.card }]}>
                <Image source={{ uri: photo }} style={styles.reviewImage} />
                {hasIdentification && (
                  <View style={styles.identificationBadge}>
                    <Ionicons name="checkmark-circle" size={12} color="#4CAF50" />
                  </View>
                )}
                <View style={styles.reviewLabelContainer}>
                  {metadata.brand && (
                    <Text style={[styles.reviewBrand, { color: colors.primary }]} numberOfLines={1}>
                      {metadata.brand}
                    </Text>
                  )}
                  <Text style={[styles.reviewLabel, { color: colors.text }]} numberOfLines={2}>
                    {metadata.productName || `Item ${index + 1}`}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.accent, flex: 1 }]}
            onPress={handleSave}
          >
            <Ionicons name="checkmark-circle" size={24} color="#fff" />
            <Text style={styles.primaryButtonText}>
              Save {selectedRoom.name}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Complete Step
  const CompleteStep = () => (
    <View style={styles.welcomeContainer}>
      <View style={styles.successIcon}>
        <Ionicons name="trophy" size={80} color="#FFD700" />
      </View>
      
      <Text style={[styles.welcomeTitle, { color: colors.text }]}>
        Inventory Complete! 🎉
      </Text>
      
      <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
        You've added {totalItemsAdded} items across {completedRooms.length} {completedRooms.length === 1 ? 'room' : 'rooms'}.
        Your home is now organized!
      </Text>

      <View style={[styles.statsBox, { backgroundColor: colors.card }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: colors.accent }]}>{totalItemsAdded}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Items Added</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: colors.primary }]}>{completedRooms.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Rooms Done</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: colors.accent }]}
        onPress={() => navigation.navigate('Products')}
      >
        <Text style={styles.primaryButtonText}>View My Inventory</Text>
        <Ionicons name="arrow-forward" size={24} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.secondaryButton, { borderColor: colors.border, marginTop: 12 }]}
        onPress={() => navigation.navigate('Dashboard')}
      >
        <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
          Back to Dashboard
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Main Render
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {step === 'welcome' && <WelcomeStep />}
      {step === 'select-room' && <SelectRoomStep />}
      {step === 'capture' && <CaptureStep />}
      {step === 'review' && <ReviewStep />}
      {step === 'complete' && <CompleteStep />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  welcomeContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeIcon: {
    marginBottom: 24,
  },
  successIcon: {
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  benefitsBox: {
    width: '100%',
    gap: 16,
    marginBottom: 32,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    fontSize: 16,
    flex: 1,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 2,
    flex: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    marginTop: 16,
  },
  skipText: {
    fontSize: 14,
  },
  stepContainer: {
    flex: 1,
  },
  progressHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    marginBottom: 12,
  },
  headerCenter: {
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  roomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  roomCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  roomCardCompleted: {
    borderWidth: 3,
  },
  roomIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  roomName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  completedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  roomBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  roomBadgeText: {
    fontSize: 16,
    fontWeight: '700',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
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
  removePhotoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    alignItems: 'center',
  },
  cameraButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    borderRadius: 12,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  reviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  reviewCard: {
    width: '31%',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reviewImage: {
    width: '100%',
    height: 100,
    resizeMode: 'cover',
  },
  identificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  reviewLabelContainer: {
    padding: 8,
  },
  reviewBrand: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  reviewLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  statsBox: {
    flexDirection: 'row',
    width: '100%',
    padding: 24,
    borderRadius: 16,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 16,
  },
});
