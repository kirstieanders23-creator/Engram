// HomeScreen.js
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import PropTypes from 'prop-types';
import { useTheme } from '../providers/ThemeProvider';
import { useDatabase } from '../providers/DatabaseProvider';
import { usePremium } from '../providers/PremiumProvider';
import { findBestProductMatch } from '../utils/match';
import { persistPhoto } from '../utils/photo';
import { useDebounce } from '../utils/useDebounce';
import { getAllCategories, getCategoryTemplate } from '../utils/category-templates';
import { QuickView } from '../components/QuickView';
import UrgentMealSuggestion from '../components/UrgentMealSuggestion';
import QuickNoteWidget from '../components/QuickNoteWidget';

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
          {/* Add your modal fields here as needed */}
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

const HomeScreen = ({ navigation }) => {
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
  const [checkLaterIds, setCheckLaterIds] = useState([]);

  const debouncedQuery = useDebounce(searchQuery, 250);

  const rooms = ['All', ...new Set(products.filter(p => p.room).map(p => p.room))];
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(debouncedQuery.toLowerCase());
    const matchesRoom = selectedRoom === 'All' || p.room === selectedRoom;
    return matchesSearch && matchesRoom;
  });

  // Add your scan, barcode, add/edit/delete, and modal logic here as needed

  const renderProductItem = ({ item }) => {
    const warrantyStatus = getWarrantyStatus(item.warranty);
    return (
      <TouchableOpacity
        onPress={() => setEditingProduct(item)}
        onLongPress={() => navigation.navigate('ProductDetail', { product: item })}
        delayLongPress={300}
        style={[styles.productCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        {item.photos && item.photos.length > 0 ? (
          <Image source={{ uri: item.photos[0] }} style={styles.productImage} />
        ) : (
          <View style={[styles.productImagePlaceholder, { backgroundColor: colors.border + '30' }]}>
            <Text style={{ fontSize: 40, opacity: 0.3 }}>📦</Text>
          </View>
        )}
        <View style={styles.productOverlay}>
          <Text style={[styles.productName, { color: colors.text }]} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={[styles.productCategory, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.category}
          </Text>
          {warrantyStatus && (
            <View style={[styles.warrantyBadge, { backgroundColor: colors.accent }]}>
              <Text style={styles.warrantyBadgeText}>{warrantyStatus.label}</Text>
            </View>
          )}
          {item.room && (
            <View style={[styles.roomTag, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.roomTagText, { color: colors.primary }]}>
                🏠 {item.room}
              </Text>
            </View>
          )}
        </View>
            <TouchableOpacity onPress={() => handleCheckLater(item.id)}>
              <Text style={{ color: checkLaterIds.includes(item.id) ? 'red' : 'blue' }}>
                {checkLaterIds.includes(item.id) ? 'Unmark Check Later' : 'Check Later'}
              </Text>
            </TouchableOpacity>
      </TouchableOpacity>
    );
  };

   return (
     <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}
       accessible accessibilityLabel="Home Screen">
       <QuickNoteWidget />
       <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
         accessible accessibilityRole="header">
         <Text style={[styles.title, { color: colors.text }]}>My Home</Text>
         {/* Add header buttons here if needed */}
       </View>
       <TextInput
         style={[
           styles.searchInput,
           { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
         ]}
         placeholder="Search products..."
         placeholderTextColor={colors.textSecondary}
         value={searchQuery}
         onChangeText={setSearchQuery}
         accessibilityLabel="Search products"
         allowFontScaling
       />
       <UrgentMealSuggestion navigation={navigation} />

       {/* Dedicated Check Later Section */}
       {checkLaterProducts.length > 0 && (
         <View style={[styles.checkLaterSection, { backgroundColor: colors.surface, borderColor: colors.border }]}
           accessible accessibilityLabel="Check Later Section">
           <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
             <Text style={[styles.sectionTitle, { color: colors.primary }]}>Check Later</Text>
             <TouchableOpacity
               onPress={async () => {
                 setCheckLaterIds([]);
                 await AsyncStorage.setItem('CHECK_LATER_IDS', JSON.stringify([]));
               }}
               style={[styles.clearCheckLaterBtn, { backgroundColor: colors.accent }]}
               accessibilityLabel="Clear all check later items"
             >
               <Text style={{ color: colors.buttonText || '#fff' }}>Clear All</Text>
             </TouchableOpacity>
           </View>
           <FlatList
             data={checkLaterProducts}
             renderItem={renderProductItem}
             keyExtractor={(item) => item.id}
             numColumns={2}
             columnWrapperStyle={styles.gridRow}
             contentContainerStyle={{ paddingVertical: 8 }}
             accessibilityLabel="Check later products list"
           />
         </View>
       )}

       {/* Main Product List */}
       {rooms.length > 1 && (
         <ScrollView
           horizontal
           showsHorizontalScrollIndicator={false}
           contentContainerStyle={styles.roomFilterContainer}
           accessibilityLabel="Room filter"
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
               accessibilityLabel={`Filter by room: ${room}`}
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
       ) : mainProducts.length === 0 ? (
         <View style={styles.emptyContainer}>
           <Text style={[styles.emptyText, { color: colors.text }]}>No products yet</Text>
           <TouchableOpacity
             style={[styles.emptyButton, { backgroundColor: colors.primary }]}
             onPress={() => setModalVisible(true)}
             accessibilityLabel="Add your first product"
           >
             <Text style={styles.buttonText}>Add your first product</Text>
           </TouchableOpacity>
         </View>
       ) : (
         <FlatList
           data={mainProducts}
           renderItem={renderProductItem}
           keyExtractor={(item) => item.id}
           numColumns={2}
           columnWrapperStyle={styles.gridRow}
           contentContainerStyle={styles.listContent}
           accessibilityLabel="Main products list"
         />
       )}
       {/* Add modals and other components as needed */}
     </SafeAreaView>
   );
};

HomeScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
};

 const styles = StyleSheet.create({
    checkLaterSection: {
      marginHorizontal: 16,
      marginTop: 16,
      marginBottom: 8,
      padding: 12,
      backgroundColor: '#e6f2e6',
      borderRadius: 14,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 2,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    clearCheckLaterBtn: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: '#b2c8b2',
      borderRadius: 8,
      marginLeft: 8,
    },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 18,
    backgroundColor: '#F6F8F7',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E4E2',
    minHeight: 64,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D3A35',
    letterSpacing: -0.2,
    flex: 1,
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
});

export default HomeScreen;