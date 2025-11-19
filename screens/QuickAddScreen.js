import React, { useState, useEffect } from 'react';
import Toast from '../components/Toast';
import Banner from '../components/Banner';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { ToastAndroid } from 'react-native';


import React, { useState, useRef } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, Alert } from 'react-native';
import { Camera } from 'expo-camera';
import Button from '../components/MasterKit/Button';
import Card from '../components/MasterKit/Card';

export default function QuickAddScreen({ navigation }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const cameraRef = useRef(null);

  React.useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleSnap = async () => {
    if (cameraRef.current) {
      setLoading(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({ base64: true });
        // Simulate OCR/barcode detection and auto-population
        // Replace this with your actual detection logic
        setTimeout(() => {
          setResult({
            name: 'Sample Product',
            category: 'Groceries',
            detected: true,
          });
          setLoading(false);
          // Auto-save and reopen camera for next snap
          setTimeout(() => {
            setResult(null);
            setScanning(true);
          }, 1200);
        }, 1200);
      } catch (e) {
        Alert.alert('Error', 'Could not take picture.');
        setLoading(false);
      }
    }
  };

  if (hasPermission === null) {
    return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  }
  if (hasPermission === false) {
    return <View style={styles.center}><Text>No access to camera</Text></View>;
  }

  return (
    <View style={styles.container}>
      {(!scanning && !result) && (
        <Card style={styles.card}>
          <Text style={styles.title}>Quick Add</Text>
          <Button title="Start Quick Snap" onPress={() => setScanning(true)} />
        </Card>
      )}
      {(scanning || loading) && (
        <Camera
          ref={cameraRef}
          style={styles.camera}
          ratio="16:9"
          autoFocus={Camera.Constants.AutoFocus.on}
        >
          <View style={styles.snapOverlay}>
            <Button title={loading ? 'Processing...' : 'Snap'} onPress={handleSnap} loading={loading} />
          </View>
        </Camera>
      )}
      {result && (
        <Card style={styles.card}>
          <Text style={styles.resultTitle}>Detected:</Text>
          <Text style={styles.resultText}>{result.name} ({result.category})</Text>
          <Text style={styles.resultSaved}>Saved! Reopening camera...</Text>
        </Card>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8F7',
    justifyContent: 'center',
  },
  card: {
    margin: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#6B8E7D',
    marginBottom: 16,
  },
  camera: {
    flex: 1,
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  snapOverlay: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B8E7D',
    marginBottom: 8,
  },
  resultText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  resultSaved: {
    fontSize: 14,
    color: '#9BB092',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
        navigation.goBack();
        return;
      }
    }
  };

  // Show toast with Move/Undo after each snap
  const showMoveUndoToast = () => {
    setToastMessage('Added! Move | Undo');
    setToastType('success');
    setShowToast(true);
    if (toastTimeout) clearTimeout(toastTimeout);
    const timeout = setTimeout(() => setShowToast(false), 2000);
    setToastTimeout(timeout);
  };

  // Move last product to a different room
  const handleMoveLast = () => {
    if (!lastProductId) return;
    const roomList = rooms.length > 0 ? rooms : ['Kitchen', 'Living Room', 'Bedroom', 'Bathroom', 'Garage', 'Office'];
    Alert.alert(
      'Move Item',
      'Select a room:',
      [
        ...roomList.map(room => ({
          text: room,
          onPress: async () => {
            await updateProduct(lastProductId, { room });
            setLastProductRoom(room);
            setShowToast(false);
          },
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // Undo last add (delete product)
  const handleUndoLast = async () => {
    if (!lastProductId) return;
    // Remove product from DB (assumes deleteProduct is available)
    if (typeof products === 'object' && products.find) {
      const prod = products.find(p => p.id === lastProductId);
      if (prod && prod.deleteProduct) {
        await prod.deleteProduct(lastProductId);
      }
    }
    setShowToast(false);
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

  // Minimal UI: just a header and room selector, no photo grid or save all
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
      <Banner visible={showBanner} message={bannerMessage} type={bannerType} onHide={() => setShowBanner(false)} />
      <Toast visible={showToast} message={toastMessage} type={toastType} onHide={() => setShowToast(false)} />
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
        {/* Batch Review Button */}
        <View style={{ alignItems: 'center', marginVertical: 8 }}>
          <TouchableOpacity
            style={{ backgroundColor: colors.accent, borderRadius: 8, padding: 12, flexDirection: 'row', alignItems: 'center' }}
            onPress={() => navigation.navigate('BatchReview')}
          >
            <Ionicons name="list" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Batch Review New Items</Text>
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
