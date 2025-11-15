import { parseReceipt } from '../utils/receipt-ocr';

// Mock expo-file-system
jest.mock('expo-file-system');

// tesseract.js mock will be auto-discovered from __mocks__/tesseract.js

describe('Enhanced Receipt OCR', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mock expo-file-system
    const FileSystem = require('expo-file-system');
    FileSystem.readAsStringAsync.mockResolvedValue('base64data');
  });

  it('extracts purchase date correctly', async () => {
    const result = await parseReceipt('test-uri');
    
    expect(result.purchaseDate).toBe('2025-11-12');
  });

  it('extracts purchase price (total) correctly', async () => {
    const result = await parseReceipt('test-uri');
    
    expect(result.purchasePrice).toBe('394.39');
  });

  it('extracts store name correctly', async () => {
    const result = await parseReceipt('test-uri');
    
    expect(result.storeName).toContain('HOME DEPOT');
  });

  it('extracts product name correctly', async () => {
    const result = await parseReceipt('test-uri');
    
    expect(result.productName).toContain('KitchenAid Stand Mixer');
  });

  it('calculates warranty expiration (1 year from purchase)', async () => {
    const result = await parseReceipt('test-uri');
    
    expect(result.warrantyExpiration).toBe('2026-11-12');
  });

  it('returns all extracted dates', async () => {
    const result = await parseReceipt('test-uri');
    
    expect(result.dates).toHaveLength(1);
    expect(result.dates[0].parsed).toBe('2025-11-12');
  });

  it('returns all extracted prices', async () => {
    const result = await parseReceipt('test-uri');
    
    // Should find multiple prices (item price, total, etc.)
    expect(result.prices.length).toBeGreaterThan(0);
    expect(result.prices[0].parsed).toBe('394.39'); // Highest (total) should be first
  });

  it('handles OCR failure gracefully', async () => {
    const tesseract = require('tesseract.js');
    tesseract.__mockWorker.loadLanguage.mockRejectedValueOnce(new Error('OCR failed'));

    const result = await parseReceipt('test-uri');
    
    expect(result.error).toBeDefined();
    expect(result.purchaseDate).toBeNull();
    expect(result.purchasePrice).toBeNull();
  });

  it('returns full OCR text for reference', async () => {
    const result = await parseReceipt('test-uri');
    
    expect(result.text).toContain('HOME DEPOT');
    expect(result.text).toContain('KitchenAid Stand Mixer');
  });

  it('includes confidence score', async () => {
    const result = await parseReceipt('test-uri');
    
    expect(result.confidence).toBe(85);
  });
});
