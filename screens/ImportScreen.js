import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '../providers/ThemeProvider';
import { useDatabase } from '../providers/DatabaseProvider';
import { usePremium } from '../providers/PremiumProvider';
import { PREMIUM_FEATURES } from '../utils/monetization';
import { parseAmazonCSV, isLikelyStillOwned, estimateWarranty } from '../utils/csv-parser';

/**
 * Import Screen - Import products from Amazon Order History CSV
 */

export const ImportScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { addProduct } = useDatabase();
  const { checkFeatureAccess } = usePremium();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [parsedProducts, setParsedProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [parseStats, setParseStats] = useState(null);

  // Check premium access on mount
  useEffect(() => {
    const verifyAccess = async () => {
      const hasAccess = await checkFeatureAccess(PREMIUM_FEATURES.CSV_IMPORT, navigation);
      if (!hasAccess) return;
    };
    verifyAccess();
  }, []);

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/csv',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        await processCSV(file.uri);
      }
    } catch (error) {
      console.error('File picker error:', error);
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const processCSV = async (uri) => {
    setIsProcessing(true);

    try {
      // Read file
      const response = await fetch(uri);
      const csvText = await response.text();

      // Parse CSV
      const result = parseAmazonCSV(csvText);

      if (!result.success) {
        Alert.alert('Parse Error', result.error || 'Failed to parse CSV');
        setIsProcessing(false);
        return;
      }

      // Pre-select durable items
      const selected = new Set();
      result.products.forEach((product, index) => {
        if (isLikelyStillOwned(product)) {
          selected.add(index);
        }
      });

      setParsedProducts(result.products);
      setSelectedProducts(selected);
      setParseStats({
        totalRows: result.totalRows,
        successCount: result.successCount,
        errorCount: result.errorCount,
      });

      setIsProcessing(false);
    } catch (error) {
      console.error('CSV process error:', error);
      setIsProcessing(false);
      Alert.alert('Error', 'Failed to process CSV file');
    }
  };

  const toggleProduct = (index) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedProducts(newSelected);
  };

  const handleImport = async () => {
    if (selectedProducts.size === 0) {
      Alert.alert('No Items Selected', 'Please select at least one item to import');
      return;
    }

    setIsImporting(true);

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const index of selectedProducts) {
        const product = parsedProducts[index];

        try {
          const productData = {
            name: product.name,
            category: product.category || 'Other',
            room: '', // User will fill in later
            purchaseDate: product.purchaseDate || '',
            purchasePrice: product.purchasePrice || '',
            purchaseLocation: product.purchaseLocation || '',
            warrantyDate: estimateWarranty(product) || '',
            photos: [],
            careInstructions: '',
            isDishwasherSafe: '',
            cleaningTips: '',
            usageNotes: `Imported from ${product.source}`,
            manualUrl: '',
            specifications: '',
            asin: product.asin || '',
          };

          await addProduct(productData);
          successCount++;
        } catch (error) {
          console.error('Add product error:', error);
          errorCount++;
        }
      }

      setIsImporting(false);

      Alert.alert(
        'Import Complete! ✓',
        `Successfully imported ${successCount} ${successCount === 1 ? 'product' : 'products'}` +
        (errorCount > 0 ? `\n${errorCount} failed` : ''),
        [
          {
            text: 'View Products',
            onPress: () => navigation.navigate('Main', { screen: 'Home' }),
          },
        ]
      );
    } catch (error) {
      console.error('Import error:', error);
      setIsImporting(false);
      Alert.alert('Error', 'Failed to import products');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Import Products</Text>
        <View style={{ width: 28 }} />
      </View>

      {parsedProducts.length === 0 ? (
        <ScrollView contentContainerStyle={styles.emptyContainer}>
          {/* Instructions */}
          <View style={[styles.instructionCard, { backgroundColor: colors.card }]}>
            <Ionicons name="information-circle" size={48} color={colors.primary} />
            <Text style={[styles.instructionTitle, { color: colors.text }]}>
              Import from Amazon Order History
            </Text>
            <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
              1. Go to Amazon.com → Accounts & Lists → Download order reports
            </Text>
            <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
              2. Select date range (e.g., past 2 years)
            </Text>
            <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
              3. Download CSV file
            </Text>
            <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
              4. Tap button below to select file
            </Text>
          </View>

          {/* Pick File Button */}
          <TouchableOpacity
            style={[styles.pickButton, { backgroundColor: colors.accent }]}
            onPress={handlePickFile}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="cloud-upload" size={24} color="#fff" />
                <Text style={styles.pickButtonText}>Select CSV File</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Example */}
          <View style={[styles.exampleCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.exampleTitle, { color: colors.text }]}>
              Supported Formats
            </Text>
            <View style={styles.exampleRow}>
              <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              <Text style={[styles.exampleText, { color: colors.text }]}>
                Amazon Order History CSV
              </Text>
            </View>
            <View style={styles.exampleRow}>
              <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              <Text style={[styles.exampleText, { color: colors.text }]}>
                Any CSV with "Title" and "Order Date" columns
              </Text>
            </View>
            <Text style={[styles.exampleNote, { color: colors.textSecondary }]}>
              More formats coming soon!
            </Text>
          </View>
        </ScrollView>
      ) : (
        <>
          <ScrollView>
            {/* Parse Stats */}
            <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: colors.primary }]}>
                    {parseStats.successCount}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Found
                  </Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: colors.accent }]}>
                    {selectedProducts.size}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Selected
                  </Text>
                </View>
                {parseStats.errorCount > 0 && (
                  <View style={styles.statBox}>
                    <Text style={[styles.statValue, { color: '#F44336' }]}>
                      {parseStats.errorCount}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                      Errors
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Product List */}
            <View style={styles.productList}>
              {parsedProducts.map((product, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.productCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: selectedProducts.has(index) ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => toggleProduct(index)}
                >
                  <View style={styles.productHeader}>
                    <View style={styles.productInfo}>
                      <Text style={[styles.productName, { color: colors.text }]}>
                        {product.name}
                      </Text>
                      <Text style={[styles.productMeta, { color: colors.textSecondary }]}>
                        {product.category}
                        {product.purchaseDate && ` • ${new Date(product.purchaseDate).toLocaleDateString()}`}
                      </Text>
                      {product.purchasePrice && (
                        <Text style={[styles.productPrice, { color: colors.accent }]}>
                          ${product.purchasePrice}
                        </Text>
                      )}
                    </View>
                    <Ionicons
                      name={selectedProducts.has(index) ? 'checkbox' : 'square-outline'}
                      size={32}
                      color={selectedProducts.has(index) ? colors.primary : colors.border}
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Select All / None */}
            <View style={styles.bulkActions}>
              <TouchableOpacity
                style={[styles.bulkButton, { backgroundColor: colors.primary }]}
                onPress={() => {
                  const allSelected = new Set();
                  parsedProducts.forEach((_, index) => allSelected.add(index));
                  setSelectedProducts(allSelected);
                }}
              >
                <Text style={styles.bulkButtonText}>Select All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.bulkButton, { backgroundColor: colors.border }]}
                onPress={() => setSelectedProducts(new Set())}
              >
                <Text style={styles.bulkButtonText}>Clear All</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Import Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.importButton, { backgroundColor: colors.accent }]}
              onPress={handleImport}
              disabled={isImporting || selectedProducts.size === 0}
            >
              {isImporting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="download" size={24} color="#fff" />
                  <Text style={styles.importButtonText}>
                    Import {selectedProducts.size} {selectedProducts.size === 1 ? 'Product' : 'Products'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  emptyContainer: {
    padding: 16,
    gap: 20,
  },
  instructionCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  instructionTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  pickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  pickButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  exampleCard: {
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  exampleTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  exampleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 14,
  },
  exampleNote: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
  statsCard: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  productList: {
    padding: 16,
    paddingTop: 0,
    gap: 12,
  },
  productCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  productMeta: {
    fontSize: 13,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '700',
  },
  bulkActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingTop: 8,
  },
  bulkButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  bulkButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  importButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
