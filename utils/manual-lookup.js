/**
 * Product Manual Lookup - Search for user manuals and care information
 * Uses product name/brand to find official documentation
 * Integrates with multiple manual databases and manufacturer sites
 */

// Mock manual database - in production, would integrate with real APIs
const MANUAL_DATABASE = {
  'KitchenAid': {
    baseUrl: 'https://www.kitchenaid.com/support',
    manuals: [
      {
        model: 'Stand Mixer',
        manualUrl: 'https://www.kitchenaid.com/manuals/stand-mixer.pdf',
        careGuide: 'https://www.kitchenaid.com/care/stand-mixer',
        tips: [
          'Wipe base with damp cloth after each use',
          'Bowl and attachments are dishwasher safe',
          'Use only KitchenAid-approved attachments',
          'Store in dry place when not in use',
        ],
      },
    ],
  },
  'Dyson': {
    baseUrl: 'https://www.dyson.com/support',
    manuals: [
      {
        model: 'Vacuum',
        manualUrl: 'https://www.dyson.com/manuals/vacuum.pdf',
        careGuide: 'https://www.dyson.com/support/vacuum-care',
        tips: [
          'Empty bin when debris reaches MAX line',
          'Wash filter monthly under cold water',
          'Check for blockages if suction reduces',
          'Store on charging dock',
        ],
      },
    ],
  },
  'Samsung': {
    baseUrl: 'https://www.samsung.com/support',
    manuals: [
      {
        model: 'TV',
        manualUrl: 'https://www.samsung.com/manuals/tv.pdf',
        careGuide: 'https://www.samsung.com/support/tv-care',
        tips: [
          'Clean screen with microfiber cloth only',
          'Avoid pressing on screen surface',
          'Keep away from direct sunlight',
          'Update firmware regularly',
        ],
      },
    ],
  },
};

// Common care tips by product category
const CATEGORY_CARE_TIPS = {
  'Appliance': [
    'Unplug before cleaning',
    'Check power cord regularly for damage',
    'Follow manufacturer cleaning instructions',
    'Keep vents clear of dust',
  ],
  'Cookware': [
    'Hand wash recommended for longevity',
    'Avoid metal utensils on non-stick surfaces',
    'Let cool before washing',
    'Dry thoroughly to prevent rust',
  ],
  'Electronics': [
    'Keep away from water and moisture',
    'Use surge protector',
    'Update software/firmware regularly',
    'Clean with appropriate electronics cleaner',
  ],
  'Furniture': [
    'Dust regularly with soft cloth',
    'Avoid direct sunlight to prevent fading',
    'Use coasters and placemats',
    'Tighten hardware periodically',
  ],
};

/**
 * Search for product manual by name and brand
 */
export async function searchManual(productName, brand = null) {
  try {
    const results = {
      manualUrl: null,
      careGuideUrl: null,
      careTips: [],
      source: 'none',
    };

    // Check mock database
    if (brand && MANUAL_DATABASE[brand]) {
      const brandData = MANUAL_DATABASE[brand];
      
      for (const manual of brandData.manuals) {
        if (productName.toLowerCase().includes(manual.model.toLowerCase())) {
          results.manualUrl = manual.manualUrl;
          results.careGuideUrl = manual.careGuide;
          results.careTips = manual.tips;
          results.source = 'manufacturer';
          return results;
        }
      }
    }

    // Try online search
    const onlineResults = await searchOnlineManuals(productName, brand);
    if (onlineResults.manualUrl) {
      return { ...results, ...onlineResults, source: 'online' };
    }

    // Fallback to generic care tips
    const category = detectCategory(productName);
    if (category && CATEGORY_CARE_TIPS[category]) {
      results.careTips = CATEGORY_CARE_TIPS[category];
      results.source = 'generic';
    }

    return results;
  } catch (error) {
    console.error('Manual search failed:', error);
    return {
      manualUrl: null,
      careGuideUrl: null,
      careTips: [],
      source: 'error',
      error: error.message,
    };
  }
}

async function searchOnlineManuals(productName, brand) {
  // Placeholder for real API integration
  // Could integrate with:
  // - ManualsLib API
  // - Google Custom Search API (site:manufacturer.com manual)
  // - Manufacturer API endpoints
  
  try {
    // Example API structure:
    // const query = `${brand} ${productName} manual`;
    // const response = await fetch(`https://api.manualslib.com/search?q=${encodeURIComponent(query)}`);
    // const data = await response.json();
    // return { manualUrl: data.results[0]?.pdfUrl, careTips: data.results[0]?.tips };
    
    return {
      manualUrl: null,
      careGuideUrl: null,
      careTips: [],
    };
  } catch (error) {
    console.error('Online manual search failed:', error);
    return {
      manualUrl: null,
      careGuideUrl: null,
      careTips: [],
    };
  }
}

function detectCategory(productName) {
  const name = productName.toLowerCase();
  
  if (name.match(/blender|mixer|toaster|coffee|microwave|oven|dishwasher|refrigerator|washer|dryer/)) {
    return 'Appliance';
  }
  if (name.match(/pan|pot|skillet|wok|cookware|baking/)) {
    return 'Cookware';
  }
  if (name.match(/tv|monitor|computer|phone|tablet|speaker|camera|printer|router/)) {
    return 'Electronics';
  }
  if (name.match(/chair|table|desk|sofa|bed|dresser|cabinet|shelf/)) {
    return 'Furniture';
  }
  
  return null;
}

/**
 * Extract cleaning instructions from manual text (if we have OCR'd manual)
 */
export function extractCleaningInstructions(manualText) {
  if (!manualText) return [];
  
  const instructions = [];
  const lines = manualText.split('\n');
  
  let inCleaningSection = false;
  const cleaningKeywords = ['cleaning', 'care', 'maintenance', 'wash', 'clean'];
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    // Detect cleaning section
    if (cleaningKeywords.some(keyword => lowerLine.includes(keyword))) {
      inCleaningSection = true;
    }
    
    // Stop at next major section
    if (inCleaningSection && lowerLine.match(/^(troubleshooting|specifications|warranty|parts)/)) {
      break;
    }
    
    // Extract instructions
    if (inCleaningSection && line.trim().length > 10) {
      instructions.push(line.trim());
    }
  }
  
  return instructions.slice(0, 10); // Limit to 10 instructions
}

/**
 * Generate care tips based on product attributes
 */
export function generateCareTips(product) {
  const tips = [];
  
  // Dishwasher safe items
  if (product.isDishwasherSafe === 'Yes') {
    tips.push('✓ Dishwasher safe - place on top rack');
    tips.push('Remove before heated dry cycle for best results');
  } else if (product.isDishwasherSafe === 'No') {
    tips.push('✗ Hand wash only to preserve finish');
  }
  
  // Based on category
  if (product.category) {
    const categoryTips = CATEGORY_CARE_TIPS[product.category];
    if (categoryTips) {
      tips.push(...categoryTips.slice(0, 3));
    }
  }
  
  // Based on material (if we had that field)
  // if (product.material === 'Stainless Steel') tips.push('Polish with stainless steel cleaner');
  
  return tips;
}

/**
 * Get warranty information from manufacturer
 */
export async function getWarrantyInfo(brand, productName) {
  // Placeholder for warranty lookup
  // Would integrate with manufacturer APIs or databases
  
  const commonWarranties = {
    'KitchenAid': { years: 1, details: 'One-year hassle-free replacement warranty' },
    'Dyson': { years: 2, details: 'Two-year parts and labor warranty' },
    'Samsung': { years: 1, details: 'One-year limited warranty on parts and labor' },
  };
  
  return commonWarranties[brand] || { years: 1, details: 'Standard manufacturer warranty' };
}

/**
 * Find replacement parts information
 */
export async function findReplacementParts(productName, brand) {
  // Placeholder for parts finder
  // Would integrate with:
  // - Manufacturer parts sites
  // - Amazon Parts & Accessories
  // - RepairClinic API
  // - PartsSelect API
  
  return {
    available: false,
    partsUrl: null,
    commonParts: [],
  };
}
