import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Share, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useTheme } from '../providers/ThemeProvider';
import { usePremium } from '../providers/PremiumProvider';
import { PREMIUM_FEATURES } from '../utils/monetization';
import {
  generateTransferLink,
  generateTransferQRData,
  getMyTransfers,
  deleteTransfer,
  getTransferStats,
  formatTransferMessage,
} from '../utils/transfer-generator';

/**
 * Transfer Screen - Generate shareable product links for home sales
 * "Carfax for Homes" seller view
 */

export const TransferScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { checkFeatureAccess } = usePremium();
  const product = route.params?.product;
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [transferLink, setTransferLink] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [includePrice, setIncludePrice] = useState(false);
  const [includeNotes, setIncludeNotes] = useState(false);
  const [expirationHours, setExpirationHours] = useState(48);

  // Check premium access on mount
  useEffect(() => {
    const verifyAccess = async () => {
      const hasAccess = await checkFeatureAccess(PREMIUM_FEATURES.TRANSFER, navigation);
      if (!hasAccess) return;
    };
    verifyAccess();
  }, []);

  const handleGenerateLink = async () => {
    setIsGenerating(true);
    
    try {
      const result = await generateTransferLink(product, {
        expirationHours,
        includePrice,
        includeNotes,
      });
      
      if (result.success) {
        setTransferLink(result.link);
        setQrData(generateTransferQRData(result.transferId));
        
        Alert.alert(
          'Transfer Link Created! ✓',
          `Link expires in ${expirationHours} hours`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to generate link');
      }
      
      setIsGenerating(false);
    } catch (error) {
      console.error('Generate link error:', error);
      setIsGenerating(false);
      Alert.alert('Error', 'Failed to generate transfer link');
    }
  };

  const handleShare = async () => {
    if (!transferLink) return;
    
    try {
      const message = formatTransferMessage(product, transferLink, Date.now() + (expirationHours * 60 * 60 * 1000));
      
      await Share.share({
        message,
        title: `Product Transfer: ${product.name}`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleCopyLink = () => {
    if (!transferLink) return;
    
    // In a real app, use Clipboard API
    Alert.alert('Copied!', 'Link copied to clipboard', [{ text: 'OK' }]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Transfer Product</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView>
        {/* Product Info */}
        <View style={[styles.productCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.productName, { color: colors.text }]}>
            {product?.name}
          </Text>
          <Text style={[styles.productMeta, { color: colors.textSecondary }]}>
            {product?.category} • {product?.room}
          </Text>
          {product?.photos && product.photos.length > 0 && (
            <View style={styles.photoBadge}>
              <Ionicons name="images" size={16} color={colors.primary} />
              <Text style={[styles.photoBadgeText, { color: colors.primary }]}>
                {product.photos.length} {product.photos.length === 1 ? 'photo' : 'photos'} included
              </Text>
            </View>
          )}
        </View>

        {/* Info Section */}
        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={32} color={colors.primary} />
            <Text style={[styles.infoTitle, { color: colors.text }]}>
              What Gets Shared?
            </Text>
          </View>
          <View style={styles.infoList}>
            <View style={styles.infoRow}>
              <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.text }]}>
                Product name, category, room
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.text }]}>
                Purchase & warranty dates
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.text }]}>
                Care instructions & cleaning tips
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.text }]}>
                Manual link & specifications
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.text }]}>
                Up to 3 photos
              </Text>
            </View>
          </View>
        </View>

        {/* Privacy Options */}
        <View style={[styles.optionsCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.optionsTitle, { color: colors.text }]}>
            Privacy Options
          </Text>
          
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => setIncludePrice(!includePrice)}
          >
            <View style={styles.optionLeft}>
              <Ionicons name="cash-outline" size={24} color={colors.text} />
              <Text style={[styles.optionText, { color: colors.text }]}>
                Include purchase price
              </Text>
            </View>
            <Ionicons
              name={includePrice ? 'checkbox' : 'square-outline'}
              size={24}
              color={includePrice ? colors.primary : colors.border}
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => setIncludeNotes(!includeNotes)}
          >
            <View style={styles.optionLeft}>
              <Ionicons name="document-text-outline" size={24} color={colors.text} />
              <Text style={[styles.optionText, { color: colors.text }]}>
                Include personal notes
              </Text>
            </View>
            <Ionicons
              name={includeNotes ? 'checkbox' : 'square-outline'}
              size={24}
              color={includeNotes ? colors.primary : colors.border}
            />
          </TouchableOpacity>
        </View>

        {/* Expiration Options */}
        <View style={[styles.optionsCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.optionsTitle, { color: colors.text }]}>
            Link Expiration
          </Text>
          
          <View style={styles.expirationOptions}>
            {[24, 48, 72].map(hours => (
              <TouchableOpacity
                key={hours}
                style={[
                  styles.expirationButton,
                  {
                    backgroundColor: expirationHours === hours ? colors.primary : colors.background,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setExpirationHours(hours)}
              >
                <Text
                  style={[
                    styles.expirationText,
                    {
                      color: expirationHours === hours ? '#fff' : colors.text,
                    },
                  ]}
                >
                  {hours / 24} {hours === 24 ? 'day' : 'days'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Generate Button */}
        {!transferLink && (
          <TouchableOpacity
            style={[styles.generateButton, { backgroundColor: colors.accent }]}
            onPress={handleGenerateLink}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="link" size={24} color="#fff" />
                <Text style={styles.generateButtonText}>Generate Transfer Link</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Transfer Link Result */}
        {transferLink && (
          <View style={[styles.resultCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.resultTitle, { color: colors.text }]}>
              Transfer Link Ready! ✓
            </Text>
            
            {/* QR Code */}
            {qrData && (
              <View style={styles.qrContainer}>
                <QRCode
                  value={qrData}
                  size={200}
                  backgroundColor="white"
                  color={colors.primary}
                />
              </View>
            )}
            
            {/* Link Display */}
            <View style={[styles.linkContainer, { backgroundColor: colors.background }]}>
              <Text style={[styles.linkText, { color: colors.textSecondary }]} numberOfLines={1}>
                {transferLink}
              </Text>
            </View>
            
            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={handleShare}
              >
                <Ionicons name="share-social" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Share</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.accent }]}
                onPress={handleCopyLink}
              >
                <Ionicons name="copy" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Copy Link</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.expiryNote, { color: colors.textSecondary }]}>
              Link expires in {expirationHours} hours
            </Text>
          </View>
        )}
      </ScrollView>
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
  productCard: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  productName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  productMeta: {
    fontSize: 14,
    marginBottom: 12,
  },
  photoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  photoBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  infoCard: {
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  infoList: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  optionsCard: {
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  optionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  optionText: {
    fontSize: 15,
  },
  expirationOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  expirationButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  expirationText: {
    fontSize: 14,
    fontWeight: '600',
  },
  generateButton: {
    margin: 16,
    marginTop: 8,
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
  generateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  resultCard: {
    margin: 16,
    marginTop: 8,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
    gap: 20,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  qrContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 16,
  },
  linkContainer: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
  },
  linkText: {
    fontSize: 12,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  expiryNote: {
    fontSize: 13,
    textAlign: 'center',
  },
});
