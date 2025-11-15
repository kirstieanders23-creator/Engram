// OCR abstraction: chooses local Tesseract implementation or a remote API stub.
// Usage: const { runOCR } = require('./ocr'); const { text, vendors, dates } = await runOCR(uri);
// For remote API integrate inside runRemoteOCR.

export async function runLocalOCR(imageUri) {
  // Prefer require in Jest/Node to avoid dynamic import vm module flag
  let receipt;
  try {
    // eslint-disable-next-line global-require
    receipt = require('./receipt-ocr');
  } catch (e) {
    receipt = await import('./receipt-ocr');
  }
  return await receipt.parseReceipt(imageUri);
}

// Placeholder remote OCR - returns null to indicate not configured.
export async function runRemoteOCR(imageUri) {
  try {
    const remote = await import('./ocr-remote');
    return await remote.runGoogleVisionOCR(imageUri);
  } catch (e) {
    console.warn('Remote OCR module not available', e?.message);
    return null;
  }
}

export async function runOCR(imageUri) {
  try {
    const remote = await runRemoteOCR(imageUri);
    if (remote && remote.text) return { ...remote, source: 'remote' };
  } catch (e) {
    console.warn('Remote OCR failed, falling back to local', e?.message);
  }
  const local = await runLocalOCR(imageUri);
  return { ...local, source: 'local' };
}

// Brand patterns for product identification
const COMMON_BRANDS = [
  // Appliances
  'KitchenAid', 'Cuisinart', 'Instant Pot', 'Ninja', 'Hamilton Beach', 'Black+Decker',
  'Breville', 'Oster', 'Whirlpool', 'GE', 'Samsung', 'LG', 'Frigidaire', 'Kenmore',
  // Electronics
  'Sony', 'Apple', 'Dell', 'HP', 'Canon', 'Epson', 'Logitech', 'Microsoft', 'Roku',
  'Amazon', 'Google', 'Nest', 'Ring', 'Dyson',
  // Furniture & Home
  'IKEA', 'Ashley', 'Wayfair', 'West Elm', 'Pottery Barn', 'Crate & Barrel',
  // Tools
  'DeWalt', 'Craftsman', 'Milwaukee', 'Bosch', 'Makita', 'Stanley', 'Black & Decker',
  // Cookware
  'Lodge', 'Le Creuset', 'Calphalon', 'T-fal', 'All-Clad', 'Pyrex', 'Corningware',
  // Vacuum & Cleaning
  'Dyson', 'Shark', 'Bissell', 'Hoover', 'iRobot', 'Roomba',
];

// Product type keywords
const PRODUCT_KEYWORDS = [
  'Blender', 'Mixer', 'Toaster', 'Coffee Maker', 'Microwave', 'Oven', 'Refrigerator',
  'Vacuum', 'Air Fryer', 'Slow Cooker', 'Pressure Cooker', 'Food Processor',
  'Stand Mixer', 'Hand Mixer', 'Kettle', 'Iron', 'Fan', 'Heater', 'Humidifier',
  'Lamp', 'Chair', 'Table', 'Desk', 'Sofa', 'Bed', 'Dresser', 'Cabinet',
  'Drill', 'Saw', 'Wrench', 'Hammer', 'Screwdriver', 'Ladder', 'Toolbox',
  'TV', 'Monitor', 'Printer', 'Speaker', 'Keyboard', 'Mouse', 'Router', 'Camera',
  'Pan', 'Pot', 'Skillet', 'Wok', 'Dutch Oven', 'Baking Sheet', 'Cutting Board',
];

/**
 * Recognize product brand and name from photo (for Room Wizard)
 * Focuses on identifying what the item is, not warranty/price info
 */
export async function recognizeProduct(imageUri) {
  try {
    const ocrResult = await runOCR(imageUri);
    const text = ocrResult.text || '';
    
    // Extract brand
    let brand = null;
    const upperText = text.toUpperCase();
    for (const brandName of COMMON_BRANDS) {
      if (upperText.includes(brandName.toUpperCase())) {
        brand = brandName;
        break;
      }
    }
    
    // Extract product type
    let productName = null;
    const words = text.split(/\s+/);
    for (const keyword of PRODUCT_KEYWORDS) {
      const keywordUpper = keyword.toUpperCase();
      if (upperText.includes(keywordUpper)) {
        productName = keyword;
        break;
      }
    }
    
    // If we found product keywords, try to get more context
    if (productName && !productName.includes(' ')) {
      // Look for model numbers or descriptive words near the product type
      const productIndex = upperText.indexOf(productName.toUpperCase());
      if (productIndex !== -1) {
        // Get surrounding context (30 chars before and after)
        const contextStart = Math.max(0, productIndex - 30);
        const contextEnd = Math.min(text.length, productIndex + productName.length + 30);
        const context = text.substring(contextStart, contextEnd);
        
        // Look for model-like patterns (e.g., "KSM150" or "Series 5")
        const modelMatch = context.match(/[A-Z]{2,}\d{2,}|Series\s+\d+|Model\s+[\w-]+/i);
        if (modelMatch) {
          productName = `${productName} ${modelMatch[0]}`;
        }
      }
    }
    
    return {
      brand: brand,
      productName: productName,
      confidence: ocrResult.confidence || 0,
      text: text,
    };
  } catch (error) {
    console.error('Product recognition failed:', error);
    return {
      brand: null,
      productName: null,
      confidence: 0,
      text: '',
    };
  }
}
