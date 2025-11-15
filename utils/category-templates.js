// Category-specific templates for quick product entry
// Provides common care instructions and defaults based on product category

export const CATEGORY_TEMPLATES = {
  'Cookware': {
    icon: '🍳',
    commonFields: {
      isDishwasherSafe: 'Hand wash recommended',
      careInstructions: 'Avoid metal utensils, hand wash only',
      cleaningTips: 'Use Bar Keeper\'s Friend for stains, avoid abrasive scrubbers',
    },
    suggestions: {
      usageNotes: ['Oven safe to 450°F', 'Induction compatible', 'Not induction compatible'],
      specifications: ['Non-stick coating', 'Stainless steel', 'Cast iron', 'Copper core'],
    }
  },
  'Appliance': {
    icon: '🔌',
    commonFields: {
      careInstructions: 'Unplug before cleaning, wipe with damp cloth',
      cleaningTips: 'Clean regularly to prevent buildup',
    },
    suggestions: {
      usageNotes: ['Check voltage requirements', 'Allow to cool before storing'],
      specifications: ['Wattage', 'Voltage', 'Capacity'],
    }
  },
  'Kitchen Tool': {
    icon: '🔪',
    commonFields: {
      isDishwasherSafe: 'Top rack only',
      careInstructions: 'Hand wash and dry immediately',
    },
    suggestions: {
      cleaningTips: ['Sharpen regularly', 'Oil wooden handles'],
      usageNotes: ['Not dishwasher safe', 'Keep blade sharp'],
    }
  },
  'Dinnerware': {
    icon: '🍽️',
    commonFields: {
      isDishwasherSafe: 'Yes',
      careInstructions: 'Dishwasher safe, avoid extreme temperature changes',
      cleaningTips: 'Safe for microwave and dishwasher',
    },
    suggestions: {
      usageNotes: ['Microwave safe', 'Oven safe', 'Not microwave safe'],
      specifications: ['Porcelain', 'Ceramic', 'Stoneware', 'Glass'],
    }
  },
  'Laundry': {
    icon: '👕',
    commonFields: {
      careInstructions: 'Clean lint trap regularly, check hoses quarterly',
      cleaningTips: 'Run cleaning cycle monthly, wipe door seal',
    },
    suggestions: {
      usageNotes: ['HE detergent only', 'Steam cycle available'],
      specifications: ['Capacity', 'Energy Star rated', 'Gas/Electric'],
    }
  },
  'Electronics': {
    icon: '📱',
    commonFields: {
      isDishwasherSafe: 'No',
      careInstructions: 'Keep away from water, clean with microfiber cloth',
      cleaningTips: 'Use screen-safe cleaner, avoid harsh chemicals',
    },
    suggestions: {
      usageNotes: ['Charge regularly', 'Keep firmware updated'],
      specifications: ['Battery life', 'Warranty period', 'Model number'],
    }
  },
  'Furniture': {
    icon: '🪑',
    commonFields: {
      careInstructions: 'Dust regularly, avoid direct sunlight',
      cleaningTips: 'Use appropriate cleaner for material type',
    },
    suggestions: {
      usageNotes: ['Weight capacity', 'Assembly required'],
      specifications: ['Dimensions', 'Material', 'Weight limit'],
    }
  },
  'Tool': {
    icon: '🔧',
    commonFields: {
      careInstructions: 'Keep clean and dry, oil moving parts',
      cleaningTips: 'Wipe down after use, store in dry place',
    },
    suggestions: {
      usageNotes: ['Requires safety equipment', 'Regular maintenance needed'],
      specifications: ['Power source', 'Torque rating', 'Battery type'],
    }
  },
  'Storage': {
    icon: '📦',
    commonFields: {
      isDishwasherSafe: 'Top rack only',
      careInstructions: 'Wash before first use, hand wash lids',
    },
    suggestions: {
      usageNotes: ['Microwave safe (remove lid)', 'Freezer safe', 'BPA free'],
      specifications: ['Capacity', 'Material', 'Stackable'],
    }
  },
};

// Get template for a category (case-insensitive, fuzzy match)
export function getCategoryTemplate(category) {
  if (!category) return null;
  
  const normalized = category.toLowerCase().trim();
  
  // Exact match
  const exactMatch = Object.keys(CATEGORY_TEMPLATES).find(
    key => key.toLowerCase() === normalized
  );
  if (exactMatch) return { ...CATEGORY_TEMPLATES[exactMatch], category: exactMatch };
  
  // Partial match
  const partialMatch = Object.keys(CATEGORY_TEMPLATES).find(
    key => normalized.includes(key.toLowerCase()) || key.toLowerCase().includes(normalized)
  );
  if (partialMatch) return { ...CATEGORY_TEMPLATES[partialMatch], category: partialMatch };
  
  return null;
}

// Get all available categories for quick selection
export function getAllCategories() {
  return Object.keys(CATEGORY_TEMPLATES).map(key => ({
    name: key,
    icon: CATEGORY_TEMPLATES[key].icon,
  }));
}

// Apply template to product data
export function applyTemplate(productData, template) {
  if (!template) return productData;
  
  return {
    ...productData,
    // Only fill empty fields
    isDishwasherSafe: productData.isDishwasherSafe || template.commonFields.isDishwasherSafe || '',
    careInstructions: productData.careInstructions || template.commonFields.careInstructions || '',
    cleaningTips: productData.cleaningTips || template.commonFields.cleaningTips || '',
  };
}
