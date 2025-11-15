import * as FileSystem from 'expo-file-system';
import { createWorker } from 'tesseract.js';

// Enhanced date patterns - covers most receipt formats
const DATE_PATTERNS = [
  // MM/DD/YYYY or MM-DD-YYYY
  /(?:date|purchased|sold|transaction)[\s:]*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/i,
  // DD/MM/YYYY or DD-MM-YYYY
  /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
  // YYYY-MM-DD or YYYY/MM/DD
  /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,
  // Month DD, YYYY (e.g., "Nov 12, 2025")
  /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+(\d{1,2})[\s,]+(\d{4})/i,
  // Short formats like 11/12/25
  /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})(?!\d)/,
];

// Price patterns - looks for currency amounts
const PRICE_PATTERNS = [
  // Total amount patterns
  /(?:total|amount|paid|purchase|price)[\s:]*\$?\s*(\d+[,.]?\d*\.?\d{2})/i,
  // Subtotal patterns
  /(?:subtotal|sub[\s-]?total)[\s:]*\$?\s*(\d+[,.]?\d*\.?\d{2})/i,
  // Generic price patterns (must have $ or clear label)
  /\$\s*(\d+[,.]?\d*\.?\d{2})/,
];

// Store name patterns - common retailers
const STORE_PATTERNS = [
  // Major retailers
  /(?:walmart|target|costco|best\s*buy|home\s*depot|lowes|kroger|safeway)/i,
  /(?:amazon|ebay|ikea|wayfair|williams[\s-]?sonoma)/i,
  // Generic patterns
  /(?:store|shop|market|mart)[\s:]*([A-Za-z0-9\s&']+)/i,
  /([A-Z][A-Za-z\s&']+)\s+(?:inc|llc|corp|store|shop)/i,
];

// Product name patterns
const PRODUCT_PATTERNS = [
  /(?:item|product|description)[\s:]*([A-Za-z0-9\s\-']+)/i,
  /(?:^|\n)([A-Z][A-Za-z0-9\s\-']+?)\s+\$\d+/gm, // Product name before price
];

/**
 * Parse date string into ISO format (YYYY-MM-DD)
 */
const parseDate = (dateStr) => {
  try {
    // Try different parsing strategies
    const cleanDate = dateStr.trim();
    
    // Handle "Month DD, YYYY" format
    const monthMatch = cleanDate.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+(\d{1,2})[\s,]+(\d{4})/i);
    if (monthMatch) {
      const months = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
      const month = months[monthMatch[1].toLowerCase().substring(0, 3)];
      const day = parseInt(monthMatch[2]);
      const year = parseInt(monthMatch[3]);
      return new Date(year, month, day).toISOString().split('T')[0];
    }
    
    // Handle numeric formats
    const numMatch = cleanDate.match(/(\d{1,4})[\/\-](\d{1,2})[\/\-](\d{1,4})/);
    if (numMatch) {
      let year, month, day;
      
      // YYYY-MM-DD format
      if (numMatch[1].length === 4) {
        year = parseInt(numMatch[1]);
        month = parseInt(numMatch[2]) - 1;
        day = parseInt(numMatch[3]);
      }
      // MM/DD/YYYY or DD/MM/YYYY (assume MM/DD for US receipts)
      else if (numMatch[3].length === 4) {
        month = parseInt(numMatch[1]) - 1;
        day = parseInt(numMatch[2]);
        year = parseInt(numMatch[3]);
      }
      // MM/DD/YY format
      else {
        month = parseInt(numMatch[1]) - 1;
        day = parseInt(numMatch[2]);
        year = parseInt(numMatch[3]);
        year = year < 50 ? 2000 + year : 1900 + year; // Assume 2000s for < 50
      }
      
      return new Date(year, month, day).toISOString().split('T')[0];
    }
    
    return null;
  } catch (e) {
    return null;
  }
};

/**
 * Calculate warranty expiration date (1 year from purchase)
 */
const calculateWarranty = (purchaseDate, warrantyYears = 1) => {
  try {
    const date = new Date(purchaseDate);
    date.setFullYear(date.getFullYear() + warrantyYears);
    return date.toISOString().split('T')[0];
  } catch (e) {
    return null;
  }
};

/**
 * Clean and parse price string
 */
const parsePrice = (priceStr) => {
  try {
    // Remove currency symbols, commas, and extra spaces
    const cleaned = priceStr.replace(/[$,\s]/g, '');
    const price = parseFloat(cleaned);
    return !isNaN(price) && price > 0 ? price.toFixed(2) : null;
  } catch (e) {
    return null;
  }
};

/**
 * Enhanced receipt parsing with date, price, and warranty extraction
 */
export async function parseReceipt(imageUri) {
  try {
    // Convert image URI to base64 if needed
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Initialize Tesseract worker
    const worker = await createWorker();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');

    // Recognize text with higher precision
    const { data: { text, confidence } } = await worker.recognize(`data:image/jpeg;base64,${base64}`);
    await worker.terminate();

    // Extract structured data
    const extracted = {
      text,
      confidence: Math.round(confidence),
      purchaseDate: null,
      purchasePrice: null,
      warrantyExpiration: null,
      storeName: null,
      productName: null,
      dates: [],
      prices: [],
      stores: [],
      products: [],
    };

    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    // Extract dates
    lines.forEach(line => {
      DATE_PATTERNS.forEach(pattern => {
        const match = line.match(pattern);
        if (match) {
          const parsed = parseDate(match[0]);
          if (parsed) {
            extracted.dates.push({ raw: match[0], parsed });
          }
        }
      });
    });

    // Extract prices
    lines.forEach(line => {
      PRICE_PATTERNS.forEach(pattern => {
        const match = line.match(pattern);
        if (match && match[1]) {
          const parsed = parsePrice(match[1]);
          if (parsed) {
            extracted.prices.push({ raw: match[0], parsed });
          }
        }
      });
    });

    // Extract store names
    lines.forEach(line => {
      STORE_PATTERNS.forEach(pattern => {
        const match = line.match(pattern);
        if (match) {
          const storeName = match[1] ? match[1].trim() : match[0].trim();
          if (storeName.length > 2 && storeName.length < 50) {
            extracted.stores.push(storeName);
          }
        }
      });
    });

    // Extract product names
    lines.forEach(line => {
      PRODUCT_PATTERNS.forEach(pattern => {
        const matches = pattern.global ? [...line.matchAll(pattern)] : [line.match(pattern)];
        matches.forEach(match => {
          if (match && match[1]) {
            const productName = match[1].trim();
            if (productName.length > 3 && productName.length < 100) {
              extracted.products.push(productName);
            }
          }
        });
      });
    });

    // Select best candidates
    if (extracted.dates.length > 0) {
      // Pre-parse date strings to Date objects for efficient sorting
      extracted.dates.forEach(d => { d._parsedDate = new Date(d.parsed); });
      // Use the most recent date (likely purchase date)
      extracted.dates.sort((a, b) => b._parsedDate - a._parsedDate);
      extracted.purchaseDate = extracted.dates[0].parsed;
      
      // Calculate warranty (1 year default)
      extracted.warrantyExpiration = calculateWarranty(extracted.purchaseDate, 1);
      // Clean up temporary _parsedDate property
      extracted.dates.forEach(d => { delete d._parsedDate; });
    }

    if (extracted.prices.length > 0) {
      // Use the highest price (likely total)
      extracted.prices.sort((a, b) => parseFloat(b.parsed) - parseFloat(a.parsed));
      extracted.purchasePrice = extracted.prices[0].parsed;
    }

    if (extracted.stores.length > 0) {
      // Use first store name found (usually at top of receipt)
      extracted.storeName = extracted.stores[0];
    }

    if (extracted.products.length > 0) {
      // Use most prominent product name
      extracted.productName = extracted.products[0];
    }

    // Remove duplicates from arrays
    extracted.dates = [...new Map(extracted.dates.map(d => [d.parsed, d])).values()];
    extracted.prices = [...new Map(extracted.prices.map(p => [p.parsed, p])).values()];
    extracted.stores = [...new Set(extracted.stores)];
    extracted.products = [...new Set(extracted.products)];

    return extracted;
  } catch (e) {
    console.warn('Receipt parsing failed:', e);
    return {
      text: '',
      confidence: 0,
      purchaseDate: null,
      purchasePrice: null,
      warrantyExpiration: null,
      storeName: null,
      productName: null,
      dates: [],
      prices: [],
      stores: [],
      products: [],
      error: e.message,
    };
  }
}

/*
Example usage:
const result = await parseReceipt(imageUri);
console.log(result.purchaseDate);        // '2025-11-09'
console.log(result.warrantyExpiration);  // '2026-11-09'
console.log(result.purchasePrice);       // '149.99'
console.log(result.storeName);           // 'Home Depot'
console.log(result.productName);         // 'KitchenAid Stand Mixer'
*/