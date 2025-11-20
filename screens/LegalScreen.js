import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../providers/ThemeProvider';

export const LegalScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState('disclaimer');

  const tabs = [
    { key: 'disclaimer', label: 'Disclaimer', icon: 'warning' },
    { key: 'terms', label: 'Terms', icon: 'document-text' },
    { key: 'privacy', label: 'Privacy', icon: 'shield-checkmark' },
  ];

  const DisclaimerContent = () => (
    <View style={styles.content}>
      <Text style={[styles.title, { color: colors.text }]}>⚠️ Important Disclaimer</Text>
      
      <Text style={[styles.sectionTitle, { color: colors.text }]}>This App Does NOT Replace Professional Advice</Text>
      <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
        Engram is a personal organization tool. It is NOT legal advice, insurance claim preparation, or financial planning software.
      </Text>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Warranty Tracking Limitations</Text>
      <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
        <Text style={{ fontWeight: 'bold' }}>We Are NOT Responsible For:{'\n'}</Text>
        • Missed warranty expirations or notification failures{'\n'}
        • Incorrect warranty calculations based on your entered dates{'\n'}
        • Denied warranty claims or disputes{'\n'}
        • Financial losses from expired warranties{'\n'}
        • Push notification delivery issues
      </Text>

      <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
        <Text style={{ fontWeight: 'bold' }}>Your Responsibility:{'\n'}</Text>
        • Verify all warranty dates are accurate{'\n'}
        • Keep original receipts and warranty documents{'\n'}
        • Set up notifications as reminders, not guarantees{'\n'}
        • File warranty claims directly with manufacturers{'\n'}
        • Check warranty status regularly
      </Text>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>OCR Accuracy</Text>
      <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
        Optical Character Recognition (OCR) is not 100% accurate. Text extraction from receipts may contain errors. Always verify manually.
      </Text>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>PDF Export</Text>
      <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
        Generated PDF reports are for personal use only. They are NOT official insurance claim documents and may not be accepted by all insurance companies.
      </Text>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Data Backups</Text>
      <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
        YOU are responsible for backing up your data. We are not liable for data loss due to device failure, app uninstallation, or other causes.
      </Text>

      <View style={[styles.warningBox, { backgroundColor: colors.error + '20', borderColor: colors.error }]}>
        <Ionicons name="warning" size={20} color={colors.error} />
        <Text style={[styles.warningText, { color: colors.error }]}>
          The App is provided "AS IS" without warranties. Use at your own risk.
        </Text>
      </View>
    </View>
  );

  const TermsContent = () => (
    <View style={styles.content}>
      <Text style={[styles.title, { color: colors.text }]}>Terms of Service</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Last Updated: November 12, 2025</Text>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>1. Acceptance of Terms</Text>
      <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
        By using Engram, you agree to these Terms of Service. If you do not agree, do not use the App.
      </Text>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>2. Description of Service</Text>
      <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
        Engram is a personal home inventory management tool for tracking products, warranties, and household items.
      </Text>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>3. Limitation of Liability</Text>
      <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, we are NOT liable for:{'\n\n'}
        • Missed warranty claims or financial losses{'\n'}
        • Data loss or corruption{'\n'}
        • Insurance claim denials{'\n'}
        • Reliance on OCR accuracy{'\n'}
        • Third-party service failures
      </Text>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>4. Subscription Terms</Text>
      <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
        <Text style={{ fontWeight: 'bold' }}>Free Tier:</Text> Core product tracking, local storage{'\n'}
        <Text style={{ fontWeight: 'bold' }}>Premium Tier:</Text> Notifications, PDF export, cloud sync{'\n\n'}
        Subscriptions auto-renew unless cancelled 24 hours before renewal. No refunds for current billing period.
      </Text>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>5. User Responsibilities</Text>
      <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
        You agree to:{'\n'}
        • Provide accurate information{'\n'}
        • Verify all dates and warranties manually{'\n'}
        • Maintain original warranty documents{'\n'}
        • Back up your data regularly{'\n'}
        • Comply with all applicable laws
      </Text>

      <Text style={[styles.paragraph, { color: colors.textSecondary, fontStyle: 'italic' }]}>
        Full Terms of Service available in app documentation.
      </Text>
    </View>
  );

  const PrivacyContent = () => (
    <View style={styles.content}>
      <Text style={[styles.title, { color: colors.text }]}>Privacy Policy</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Last Updated: November 12, 2025</Text>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Information We Collect</Text>
      <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
        <Text style={{ fontWeight: 'bold' }}>You Provide:{'\n'}</Text>
        • Product data (names, photos, warranty dates, prices){'\n'}
        • Account info (email if using cloud sync){'\n'}
        • Device settings (theme, notification preferences){'\n\n'}
        
        <Text style={{ fontWeight: 'bold' }}>Automatically Collected:{'\n'}</Text>
        • Device info (for bug reports only){'\n'}
        • Push notification tokens (for warranty alerts){'\n'}
        • Usage analytics (if you opt-in)
      </Text>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>What We Do NOT Collect</Text>
      <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
        • We do NOT access your contacts, location, or other apps{'\n'}
        • We do NOT sell your data to third parties{'\n'}
        • We do NOT use your data for advertising
      </Text>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>How We Use Your Data</Text>
      <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
        • Store your inventory locally on your device{'\n'}
        • Calculate warranty dates and send notifications{'\n'}
        • Generate PDF reports{'\n'}
        • Sync data across devices (Premium only){'\n'}
        • Improve app performance and fix bugs
      </Text>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Data Storage</Text>
      <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
        <Text style={{ fontWeight: 'bold' }}>Free Tier:{'\n'}</Text>
        All data stored locally on your device. Deleted when you uninstall.{'\n\n'}
        
        <Text style={{ fontWeight: 'bold' }}>Premium Tier:{'\n'}</Text>
        Data stored in Firebase (encrypted in transit and at rest). Subject to Google Cloud Platform security practices.
      </Text>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Rights</Text>
      <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
        • Access and export your data anytime{'\n'}
        • Delete individual products or entire account{'\n'}
        • Control notification settings{'\n'}
        • Toggle cloud sync on/off (Premium)
      </Text>

      <View style={[styles.infoBox, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}>
        <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
        <Text style={[styles.infoText, { color: colors.text }]}>
          We respect your privacy. Your personal product inventory is never sold or used for advertising.
        </Text>
      </View>

      <Text style={[styles.paragraph, { color: colors.textSecondary, fontStyle: 'italic' }]}>
        Full Privacy Policy available in app documentation.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} accessible accessibilityLabel="Legal Information Screen">
      <View style={styles.header} accessible accessibilityRole="header">
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} allowFontScaling accessibilityLabel="Legal Information">Legal Information</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabContainer} accessible accessibilityRole="tablist" accessibilityLabel="Legal tabs">
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && { borderBottomColor: colors.accent, borderBottomWidth: 2 }
            ]}
            onPress={() => setActiveTab(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === tab.key }}
            accessibilityLabel={tab.label}
          >
            <Ionicons 
              name={tab.icon} 
              size={20} 
              color={activeTab === tab.key ? colors.accent : colors.textSecondary} 
            />
            <Text style={[
              styles.tabLabel,
              { color: activeTab === tab.key ? colors.accent : colors.textSecondary }
            ]} allowFontScaling accessibilityLabel={tab.label}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scrollView} accessible accessibilityLabel="Legal content">
        {activeTab === 'disclaimer' && <DisclaimerContent />}
        {activeTab === 'terms' && <TermsContent />}
        {activeTab === 'privacy' && <PrivacyContent />}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 20,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
  },
});
