import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Modal,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import PropTypes from 'prop-types';
// NOTE: This file uses expo-image-picker for camera access and the project's
// OCR helper. Install locally with:
//   expo install expo-image-picker
// and ensure `tesseract.js` and `expo-file-system` are available for OCR.
// Image picking and OCR are dynamically imported inside the scan handler so
// tests that don't have expo modules installed won't fail at module load.
import { useTheme } from '../providers/ThemeProvider';
import { useDatabase } from '../providers/DatabaseProvider';
import { usePremium } from '../providers/PremiumProvider';
import { findBestProductMatch } from '../utils/match';
import { persistPhoto } from '../utils/photo';
import { useDebounce } from '../utils/useDebounce';
import { getAllCategories, getCategoryTemplate, applyTemplate } from '../utils/category-templates';
import { QuickView } from '../components/QuickView';
import UrgentMealSuggestion from '../components/UrgentMealSuggestion';

// Helper function to calculate warranty status
function getWarrantyStatus(warrantyDate) {
  if (!warrantyDate) return null;
  const now = new Date();
  const target = new Date(warrantyDate);
  if (isNaN(target.getTime())) return null;
  
  const daysRemaining = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysRemaining < 0) {
    return { status: 'expired', color: '#999', label: 'Expired', daysRemaining };
  } else if (daysRemaining <= 30) {
    return { status: 'expiring-soon', color: '#ff4444', label: `${daysRemaining} days left`, daysRemaining };
  } else if (daysRemaining <= 90) {
    return { status: 'warning', color: '#ffaa00', label: `${daysRemaining} days left`, daysRemaining };
  } else {
    return { status: 'active', color: '#44ff44', label: `${daysRemaining} days left`, daysRemaining };
  }
}

const ProductModal = ({ visible, onClose, onSave, onDelete, isEditing, colors, product }) => {
  const [formData, setFormData] = useState(product || { 
    name: '', 
    category: '', 
    room: '', 
    warranty: '',
    purchaseDate: '',
    purchasePrice: '',
    photos: [],
    careInstructions: '',
    isDishwasherSafe: '',
    manualUrl: '',
    cleaningTips: '',
    usageNotes: '',
    specifications: ''
  });
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // Keep internal form in sync when a product/prefill is passed or when modal opens.
  useEffect(() => {
    setFormData(product || { 
      name: '', 
      category: '', 
      room: '', 
      warranty: '',
      purchaseDate: '',
      purchasePrice: '',
      photos: [],
      careInstructions: '',
      isDishwasherSafe: '',
      manualUrl: '',
      cleaningTips: '',
      usageNotes: '',
      specifications: ''
    });
  }, [product, visible]);

  const handleCategorySelect = (categoryName) => {
    const template = getCategoryTemplate(categoryName);
    if (template) {
      const updatedData = {
        ...formData,
        category: categoryName,
        // Apply template defaults only to empty fields
        isDishwasherSafe: formData.isDishwasherSafe || template.commonFields.isDishwasherSafe || '',
        careInstructions: formData.careInstructions || template.commonFields.careInstructions || '',
        cleaningTips: formData.cleaningTips || template.commonFields.cleaningTips || '',
      };
      setFormData(updatedData);
    } else {
      setFormData({ ...formData, category: categoryName });
    }
    setShowCategoryPicker(false);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      Alert.alert('Validation', 'Product name is required');
      return;
    }
    if (!formData.category.trim()) {
      Alert.alert('Validation', 'Category is required');
      return;
    }
    onSave(formData);
    setFormData({ 
      name: '', 
      category: '', 
      room: '', 
      warranty: '',
      purchaseDate: '',
      purchasePrice: '',
      photos: [],
      careInstructions: '',
      isDishwasherSafe: '',
      manualUrl: '',
      cleaningTips: '',
      usageNotes: '',
      specifications: ''
    });
  };

  const handleAddPhoto = async (source = 'camera') => {
    try {
      const ImagePicker = await import('expo-image-picker');
      if (source === 'camera') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (perm.status !== 'granted') return;
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (perm.status !== 'granted') return;
      }
      const options = { quality: 0.7, allowsEditing: false };
      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
      if (result.cancelled) return;
      const uri = result.uri;
      const { persistPhoto } = await import('../utils/photo');
      const saved = await persistPhoto(uri);
      setFormData(prev => ({ ...prev, photos: [...(prev.photos || []), saved] }));
    } catch (e) {
      console.warn('Add photo failed', e);
    }
  };

  const handleRemovePhoto = (idx) => {
    setFormData(prev => ({ ...prev, photos: (prev.photos || []).filter((_, i) => i !== idx) }));
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {isEditing ? 'Edit Product' : 'Add Product'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={[styles.closeButton, { color: colors.text }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { color: colors.text }]}>Product Name *</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
            ]}
            placeholder="e.g. Refrigerator"
            placeholderTextColor={colors.text}
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
          />

          <Text style={[styles.label, { color: colors.text }]}>Category *</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
            ]}
            placeholder="e.g. Appliance"
            placeholderTextColor={colors.text}
            value={formData.category}
            onChangeText={(text) => setFormData({ ...formData, category: text })}
          />
          
          {/* Quick Category Selection */}
          <TouchableOpacity 
            onPress={() => setShowCategoryPicker(!showCategoryPicker)}
            style={[styles.quickSelectButton, { backgroundColor: colors.secondary || '#555' }]}
          >
            <Text style={{ color: '#fff', fontSize: 12 }}>
              {showCategoryPicker ? '▼ Hide Quick Categories' : '▶ Quick Select Category'}
            </Text>
          </TouchableOpacity>
          
          {showCategoryPicker && (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryQuickSelect}
            >
              {getAllCategories().map(({ name, icon }) => (
                <TouchableOpacity
                  key={name}
                  style={[
                    styles.categoryChip,
                    { 
                      backgroundColor: formData.category === name ? colors.primary : colors.card,
                      borderColor: colors.border 
                    }
                  ]}
                  onPress={() => handleCategorySelect(name)}
                >
                  <Text style={{ color: formData.category === name ? '#fff' : colors.text }}>
                    {icon} {name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <Text style={[styles.label, { color: colors.text }]}>Room</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
            ]}
            placeholder="e.g. Kitchen"
            placeholderTextColor={colors.text}
            value={formData.room}
            onChangeText={(text) => setFormData({ ...formData, room: text })}
          />

          <Text style={[styles.label, { color: colors.text }]}>Warranty Until</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
            ]}
            placeholder="e.g. 2026-12-31"
            placeholderTextColor={colors.text}
            value={formData.warranty}
            onChangeText={(text) => setFormData({ ...formData, warranty: text })}
          />

          <Text style={[styles.label, { color: colors.text }]}>Purchase Date</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
            ]}
            placeholder="e.g. 2025-11-12"
            placeholderTextColor={colors.text}
            value={formData.purchaseDate || ''}
            onChangeText={(text) => setFormData({ ...formData, purchaseDate: text })}
          />

          <Text style={[styles.label, { color: colors.text }]}>Purchase Price</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
            ]}
            placeholder="e.g. 149.99"
            placeholderTextColor={colors.text}
            keyboardType="decimal-pad"
            value={formData.purchasePrice || ''}
            onChangeText={(text) => setFormData({ ...formData, purchasePrice: text })}
          />

          <Text style={[styles.label, { color: colors.text }]}>Care Instructions</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
            ]}
            placeholder="e.g. Hand wash only, Do not microwave"
            placeholderTextColor={colors.text}
            value={formData.careInstructions}
            onChangeText={(text) => setFormData({ ...formData, careInstructions: text })}
            multiline
          />

          <Text style={[styles.label, { color: colors.text }]}>Dishwasher Safe?</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
            ]}
            placeholder="Yes, No, or Top rack only"
            placeholderTextColor={colors.text}
            value={formData.isDishwasherSafe}
            onChangeText={(text) => setFormData({ ...formData, isDishwasherSafe: text })}
          />

          <Text style={[styles.label, { color: colors.text }]}>Manual/Instructions Link</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
            ]}
            placeholder="https://..."
            placeholderTextColor={colors.text}
            value={formData.manualUrl}
            onChangeText={(text) => setFormData({ ...formData, manualUrl: text })}
          />

          <Text style={[styles.label, { color: colors.text }]}>Cleaning Tips</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
            ]}
            placeholder="e.g. Use Bar Keeper's Friend for copper pots"
            placeholderTextColor={colors.text}
            value={formData.cleaningTips}
            onChangeText={(text) => setFormData({ ...formData, cleaningTips: text })}
            multiline
          />

          <Text style={[styles.label, { color: colors.text }]}>Usage Notes</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
            ]}
            placeholder="e.g. Max temp 450°F, Induction compatible"
            placeholderTextColor={colors.text}
            value={formData.usageNotes}
            onChangeText={(text) => setFormData({ ...formData, usageNotes: text })}
            multiline
          />

          <Text style={[styles.label, { color: colors.text }]}>Specifications</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
            ]}
            placeholder="e.g. 12qt, 1500W, 10x8x6 inches"
            placeholderTextColor={colors.text}
            value={formData.specifications}
            onChangeText={(text) => setFormData({ ...formData, specifications: text })}
            multiline
          />

          {/* Photos section */}
          <Text style={[styles.label, { color: colors.text }]}>Photos</Text>
          <ScrollView horizontal contentContainerStyle={styles.photosRow}>
            {(formData.photos || []).map((uri, idx) => (
              <View key={`${uri}-${idx}`} style={styles.photoWrap}>
                <View style={[styles.photoBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={{ color: colors.text, fontSize: 10, marginBottom: 4 }} numberOfLines={1}>
                    {uri.split('/').pop()}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleRemovePhoto(idx)}>
                  <Text style={{ color: colors.error, fontWeight: 'bold', textAlign: 'center' }}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.secondary || '#555' }]}
              onPress={() => handleAddPhoto('camera')}
            >
              <Text style={styles.buttonText}>+ Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.secondary || '#666' }]}
              onPress={() => handleAddPhoto('library')}
            >
              <Text style={styles.buttonText}>+ Library</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.error }]}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            {isEditing && onDelete && (
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.error }]}
                onPress={onDelete}
              >
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.primary }]}
              onPress={handleSave}
            >
              <Text style={styles.buttonText}>{isEditing ? 'Update' : 'Add'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

ProductModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onDelete: PropTypes.func,
  isEditing: PropTypes.bool,
  colors: PropTypes.object.isRequired,
  product: PropTypes.object,
};

export const HomeScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { products, isLoading, addProduct, updateProduct, deleteProduct } = useDatabase();
  const { checkProductLimit } = usePremium();
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [prefillProduct, setPrefillProduct] = useState(null);
  const [barcodeVisible, setBarcodeVisible] = useState(false);
  const [isBarcodeScanning, setIsBarcodeScanning] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState('All');
  const [quickViewVisible, setQuickViewVisible] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  const debouncedQuery = useDebounce(searchQuery, 250);

  // Get unique rooms from products
  const rooms = ['All', ...new Set(products.filter(p => p.room).map(p => p.room))];
  const filteredProducts = products.filter((p) => {
    // Search filter
    const matchesSearch = p.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(debouncedQuery.toLowerCase());
    
    // Room filter
    const matchesRoom = selectedRoom === 'All' || p.room === selectedRoom;
    
    return matchesSearch && matchesRoom;
  });

  // Basic image -> OCR -> match flow. Attempts to find an existing product by
  // matching OCR text with product names. If found, opens edit modal. If not,
  // opens Add modal with prefilled fields.
  const handleScan = async () => {
    try {
      setIsScanning(true);

      // Dynamic import to avoid requiring expo-image-picker in test envs.
      const ImagePicker = await import('expo-image-picker');

      const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraPerm.status !== 'granted') {
        Alert.alert('Permission required', 'Camera access is required to scan items');
        setIsScanning(false);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
      if (result.cancelled) {
        setIsScanning(false);
        return;
      }

  // Parse image with OCR helper via abstraction (returns enhanced data)
  const ocrModule = await import('../utils/ocr');
  const ocr = await ocrModule.runOCR(result.uri);
      const ocrText = ocr.text || '';

      // Fuzzy match against existing products
      const match = await findBestProductMatch(products, ocrText);

      if (match) {
        // Show quick view instead of edit modal
        setQuickViewProduct(match.product);
        setQuickViewVisible(true);
      } else {
        // Build prefill from enhanced OCR extraction
        const suggestedName = ocr.productName || ocrText.split('\n').map(l => l.trim()).filter(Boolean)[0] || '';
        const suggestedVendor = ocr.storeName || '';
        const suggestedPrice = ocr.purchasePrice || '';
        const suggestedWarranty = ocr.warrantyExpiration || '';
        const suggestedPurchaseDate = ocr.purchaseDate || '';

        // Show success message with extracted data
        let message = 'Receipt scanned!';
        if (ocr.purchaseDate) message += `\n📅 Date: ${ocr.purchaseDate}`;
        if (ocr.purchasePrice) message += `\n💵 Price: $${ocr.purchasePrice}`;
        if (ocr.warrantyExpiration) message += `\n⏰ Warranty: ${ocr.warrantyExpiration}`;
        if (ocr.storeName) message += `\n🏪 Store: ${ocr.storeName}`;
        
        Alert.alert('Receipt Parsed', message);

        // Persist photo for reliability before attaching
        const savedPhoto = await persistPhoto(result.uri);
        setPrefillProduct({ 
          name: suggestedName, 
          category: suggestedVendor || '', 
          room: '', 
          warranty: suggestedWarranty,
          purchaseDate: suggestedPurchaseDate,
          purchasePrice: suggestedPrice,
          photos: [savedPhoto] 
        });
        setEditingProduct(null);
        setModalVisible(true);
      }
    } catch (e) {
      console.warn('Scan failed', e);
      Alert.alert('Scan failed', e.message || 'Unable to scan image');
    } finally {
      setIsScanning(false);
    }
  };

  // Barcode scanning flow using dynamic import to avoid hard dependency in tests.
  const handleStartBarcode = async () => {
    try {
      setIsBarcodeScanning(true);
      const BarcodeScanner = await import('expo-barcode-scanner');
      const { status } = await BarcodeScanner.BarCodeScanner.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Camera access is required for barcode scanning');
        setIsBarcodeScanning(false);
        return;
      }
      setBarcodeVisible(true);
    } catch (e) {
      console.warn('Barcode init failed', e);
      Alert.alert('Barcode error', e.message || 'Unable to start barcode scanner');
      setIsBarcodeScanning(false);
    }
  };

  const handleBarCodeScanned = async ({ data, type }) => {
    try {
      setBarcodeVisible(false);
      setIsBarcodeScanning(false);
      const code = String(data).trim();
      // Attempt direct match on stored products barcode field if exists
      const direct = products.find(p => p.barcode && String(p.barcode).trim() === code);
      if (direct) {
        // Show quick view instead of edit modal
        setQuickViewProduct(direct);
        setQuickViewVisible(true);
        return;
      }
      // External lookup attempt
      try {
        const lookupModule = await import('../utils/barcode-lookup');
        const info = await lookupModule.fetchProductInfo(code);
        if (info) {
          setPrefillProduct({ name: info.name, category: info.vendor || '', room: '', warranty: '', barcode: code, photos: [] });
          setEditingProduct(null);
          setModalVisible(true);
          return;
        }
      } catch (lookupErr) {
        console.warn('Barcode external lookup failed', lookupErr?.message);
      }
      // Fallback: prefill with barcode only
      setPrefillProduct({ name: '', category: '', room: '', warranty: '', barcode: code, photos: [] });
      setEditingProduct(null);
      setModalVisible(true);
    } catch (e) {
      console.warn('Barcode processing failed', e);
      Alert.alert('Error', e.message || 'Failed to process barcode');
    }
  };

  const handleAddProduct = async (formData) => {
    try {
      // Check product limit before adding
      const canAdd = await checkProductLimit(products.length, navigation);
      if (!canAdd) {
        return; // User will see paywall or cancel
      }
      
      const photos = (prefillProduct && prefillProduct.photos) || [];
      await addProduct({ ...formData, photos });
      setModalVisible(false);
      setPrefillProduct(null);
      Alert.alert('Success', 'Product added successfully');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to add product');
    }
  };

  const handleUpdateProduct = async (formData) => {
    try {
      await updateProduct(editingProduct.id, formData);
      setEditingProduct(null);
      setModalVisible(false);
      Alert.alert('Success', 'Product updated successfully');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update product');
    }
  };

  const handleDeleteProduct = async () => {
    Alert.alert('Delete Product', 'Are you sure?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            await deleteProduct(editingProduct.id);
            setEditingProduct(null);
            setModalVisible(false);
            Alert.alert('Success', 'Product deleted successfully');
          } catch (error) {
            Alert.alert('Error', error.message || 'Failed to delete product');
          }
        },
      },
    ]);
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setModalVisible(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setModalVisible(true);
  };

  const renderProductItem = ({ item }) => {
    const warrantyStatus = getWarrantyStatus(item.warranty);
    
    return (
      <TouchableOpacity
        onPress={() => openEditModal(item)}
        onLongPress={() => navigation.navigate('ProductDetail', { product: item })}
        delayLongPress={300}
        style={[styles.productCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        {/* Large Product Image */}
        {item.photos && item.photos.length > 0 ? (
          <Image source={{ uri: item.photos[0] }} style={styles.productImage} />
        ) : (
          <View style={[styles.productImagePlaceholder, { backgroundColor: colors.border + '30' }]}>
            <Text style={{ fontSize: 40, opacity: 0.3 }}>📦</Text>
          </View>
        )}
        
        {/* Product Info Overlay */}
        <View style={styles.productOverlay}>
          <Text style={[styles.productName, { color: colors.text }]} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={[styles.productCategory, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.category}
          </Text>
          
          {/* Warranty Badge */}
          {warrantyStatus && (
            <View style={[styles.warrantyBadge, { backgroundColor: colors.accent }]}>
              <Text style={styles.warrantyBadgeText}>{warrantyStatus.label}</Text>
            </View>
          )}
          
          {/* Room Tag */}
          {item.room && (
            <View style={[styles.roomTag, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.roomTagText, { color: colors.primary }]}>
                🏠 {item.room}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>My Home</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.scanButton, { backgroundColor: colors.secondary || '#555' }]}
            onPress={handleScan}
            disabled={isScanning}
          >
            {isScanning ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.addButtonText}>📷 Scan</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.scanButton, { backgroundColor: colors.secondary || '#444' }]}
            onPress={handleStartBarcode}
            disabled={isBarcodeScanning}
          >
            {isBarcodeScanning ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.addButtonText}>🔍 Barcode</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={openAddModal}
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.secondary || '#666' }]}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.addButtonText}>⚙</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TextInput
        style={[
          styles.searchInput,
          { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
        ]}
        placeholder="Search products..."
        placeholderTextColor={colors.text}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {/* 🚀 SMART MEAL SUGGESTION - Only shows when ingredients expiring ≤3 days */}
      <UrgentMealSuggestion navigation={navigation} />

      {/* Room Filter */}
      {rooms.length > 1 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.roomFilterContainer}
        >
          {rooms.map((room) => (
            <TouchableOpacity
              key={room}
              style={[
                styles.roomFilterButton,
                { 
                  backgroundColor: selectedRoom === room ? colors.accent : colors.card,
                  shadowOpacity: selectedRoom === room ? 0.25 : 0.05,
                  elevation: selectedRoom === room ? 4 : 2,
                }
              ]}
              onPress={() => setSelectedRoom(room)}
            >
              <Text 
                style={[
                  styles.roomFilterText, 
                  { 
                    color: selectedRoom === room ? '#1A1A1A' : colors.textSecondary,
                    fontWeight: selectedRoom === room ? '800' : '600',
                  }
                ]}
              >
                {room === 'All' ? '🏠 All' : room}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.text }]}>No products yet</Text>
          <TouchableOpacity
            style={[styles.emptyButton, { backgroundColor: colors.primary }]}
            onPress={openAddModal}
          >
            <Text style={styles.buttonText}>Add your first product</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.listContent}
        />
      )}

      <ProductModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setPrefillProduct(null);
        }}
        onSave={editingProduct ? handleUpdateProduct : handleAddProduct}
        onDelete={editingProduct ? handleDeleteProduct : null}
        isEditing={!!editingProduct}
        colors={colors}
        product={editingProduct || prefillProduct}
      />

      <QuickView
        visible={quickViewVisible}
        product={quickViewProduct}
        colors={colors}
        onClose={() => {
          setQuickViewVisible(false);
          setQuickViewProduct(null);
        }}
        onEdit={(product) => {
          setEditingProduct(product);
          setModalVisible(true);
        }}
      />

      {barcodeVisible && (
        <Modal visible animationType="fade" transparent onRequestClose={() => setBarcodeVisible(false)}>
          <SafeAreaView style={[styles.barcodeContainer, { backgroundColor: '#000000aa' }]}>
            <View style={styles.barcodeInner}>
              <Text style={[styles.barcodeTitle, { color: '#fff' }]}>Scan Barcode</Text>
              {/* Dynamically render BarcodeScanner */}
              <View style={styles.barcodeScannerBox}>
                {/* Lazy inline component since we can't declare hooks after conditional */}
                <DynamicBarcode onScanned={handleBarCodeScanned} />
              </View>
              <TouchableOpacity style={styles.barcodeClose} onPress={() => setBarcodeVisible(false)}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
  );
};

HomeScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -0.5,
    flex: 1,
  },
  addButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  searchInput: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
    height: 50,
    borderWidth: 0,
    borderRadius: 15,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  roomFilterContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  roomFilterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 0,
    marginRight: 10,
    shadowColor: '#B8860B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  roomFilterText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  gridRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  productCard: {
    flex: 1,
    maxWidth: '48%',
    marginBottom: 16,
    marginHorizontal: 4,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  productImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  productImagePlaceholder: {
    width: '100%',
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productOverlay: {
    padding: 12,
  },
  productName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  productCategory: {
    fontSize: 11,
    opacity: 0.6,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  warrantyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    marginBottom: 6,
    shadowColor: '#B8860B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  warrantyBadgeText: {
    color: '#1A1A1A',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  roomTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roomTagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    marginBottom: 20,
  },
  emptyButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
  },
  modalContent: {
    padding: 20,
    paddingTop: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    fontSize: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  quickSelectButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  categoryQuickSelect: {
    paddingVertical: 8,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 25,
    marginBottom: 30,
  },
  modalButton: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photosRow: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  photoWrap: {
    width: 90,
    marginRight: 10,
    alignItems: 'center',
  },
  photoBox: {
    width: 90,
    height: 60,
    borderWidth: 1,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  barcodeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  barcodeInner: {
    width: '90%',
    maxWidth: 500,
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
  },
  barcodeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  barcodeScannerBox: {
    height: 300,
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: '#000',
    marginBottom: 16,
  },
  barcodeClose: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#333',
    borderRadius: 8,
  },
});

// Dynamic barcode component separated to avoid hook order issues.
function DynamicBarcode({ onScanned }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [scannerReady, setScannerReady] = useState(false);
  const [moduleRef, setModuleRef] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const BarcodeScanner = await import('expo-barcode-scanner');
        if (!mounted) return;
        setModuleRef(BarcodeScanner);
        const { status } = await BarcodeScanner.BarCodeScanner.requestPermissionsAsync();
        if (!mounted) return;
        setHasPermission(status === 'granted');
        setScannerReady(true);
      } catch (e) {
        console.warn('Barcode dynamic import failed', e);
        if (mounted) setHasPermission(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (hasPermission === false) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: '#fff' }}>No camera permission</Text></View>;
  }
  if (!scannerReady || !moduleRef) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color="#fff" /></View>;
  }

  const Scanner = moduleRef.BarCodeScanner;
  return (
    <Scanner
      style={{ flex: 1 }}
      onBarCodeScanned={(event) => onScanned(event)}
    />
  );
}

DynamicBarcode.propTypes = {
  onScanned: PropTypes.func.isRequired,
};
