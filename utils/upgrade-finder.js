/**
 * Upgrade Finder - Search for newer models and upgrades
 * Uses product name/brand to find latest versions
 * Integrates with multiple data sources for accuracy
 */

// Mock product database - in production, this would call real APIs
const PRODUCT_UPGRADES = {
  'KitchenAid Stand Mixer': [
    {
      model: 'KitchenAid Artisan Series 5-Quart (2024)',
      price: 449.99,
      features: ['10 speeds', 'Larger bowl', 'New colors', 'Dishwasher-safe bowl'],
      releaseDate: '2024-03-15',
      energyRating: 'A++',
      url: 'https://www.kitchenaid.com/artisan-mixer',
      improvements: ['25% more power', 'Quieter operation', 'Better attachments included'],
    },
    {
      model: 'KitchenAid Professional 600 Series',
      price: 599.99,
      features: ['6-quart bowl', '575-watt motor', 'Commercial-grade', 'All-metal construction'],
      releaseDate: '2023-09-01',
      energyRating: 'A+',
      url: 'https://www.kitchenaid.com/professional-600',
      improvements: ['More powerful motor', 'Larger capacity', 'Professional durability'],
    },
  ],
  'Dyson Vacuum': [
    {
      model: 'Dyson V15 Detect',
      price: 749.99,
      features: ['Laser detection', 'LCD screen', '60 min runtime', 'HEPA filtration'],
      releaseDate: '2024-01-10',
      energyRating: 'A+++',
      url: 'https://www.dyson.com/v15',
      improvements: ['Laser reveals hidden dust', 'Real-time particle count', 'Auto power adjustment'],
    },
  ],
};

/**
 * Search for product upgrades by name/brand
 */
export async function findUpgrades(productName, currentModel = null) {
  try {
    // Normalize product name
    const normalized = productName.toLowerCase();
    
    // Check mock database first
    const mockResults = searchMockDatabase(normalized);
    if (mockResults.length > 0) {
      return {
        upgrades: mockResults,
        source: 'database',
      };
    }
    
    // Try online search (placeholder for real API)
    const onlineResults = await searchOnline(productName, currentModel);
    if (onlineResults.length > 0) {
      return {
        upgrades: onlineResults,
        source: 'online',
      };
    }
    
    return {
      upgrades: [],
      source: 'none',
    };
  } catch (error) {
    console.error('Upgrade search failed:', error);
    return {
      upgrades: [],
      source: 'error',
      error: error.message,
    };
  }
}

function searchMockDatabase(productName) {
  const results = [];
  
  for (const [key, upgrades] of Object.entries(PRODUCT_UPGRADES)) {
    const keyLower = key.toLowerCase();
    if (productName.includes(keyLower) || keyLower.includes(productName)) {
      results.push(...upgrades);
    }
  }
  
  return results;
}

async function searchOnline(productName, currentModel) {
  // Placeholder for real API integration
  // Could integrate with:
  // - Amazon Product Advertising API
  // - Google Shopping API
  // - Manufacturer websites
  // - Price comparison sites
  
  try {
    // Example API call structure:
    // const response = await fetch(`https://api.shopping.com/upgrades?product=${encodeURIComponent(productName)}`);
    // const data = await response.json();
    // return data.upgrades;
    
    return [];
  } catch (error) {
    console.error('Online search failed:', error);
    return [];
  }
}

/**
 * Compare two products feature-by-feature
 */
export function compareProducts(current, upgrade) {
  const comparison = {
    priceIncrease: upgrade.price - (current.purchasePrice || 0),
    priceIncreasePercent: current.purchasePrice 
      ? ((upgrade.price - current.purchasePrice) / current.purchasePrice * 100).toFixed(1)
      : null,
    newFeatures: upgrade.features || [],
    improvements: upgrade.improvements || [],
    energyRating: upgrade.energyRating || null,
    releaseDate: upgrade.releaseDate || null,
    shouldUpgrade: null,
  };
  
  // Calculate "should upgrade" recommendation
  const currentAge = current.purchaseDate 
    ? Math.floor((new Date() - new Date(current.purchaseDate)) / (365 * 24 * 60 * 60 * 1000))
    : null;
  
  const warrantyExpired = current.warranty 
    ? new Date(current.warranty) < new Date()
    : false;
  
  if (currentAge >= 5 || warrantyExpired) {
    comparison.shouldUpgrade = 'recommended';
    comparison.reason = currentAge >= 5 
      ? `Current product is ${currentAge} years old`
      : 'Warranty has expired';
  } else if (currentAge >= 3) {
    comparison.shouldUpgrade = 'consider';
    comparison.reason = 'Mid-life - new features may be worth it';
  } else {
    comparison.shouldUpgrade = 'wait';
    comparison.reason = 'Current product is still new';
  }
  
  return comparison;
}

/**
 * Calculate price tracking alert thresholds
 */
export function getPriceAlertLevels(targetPrice) {
  return {
    excellent: targetPrice * 0.8, // 20% off
    good: targetPrice * 0.9,      // 10% off
    fair: targetPrice * 0.95,     // 5% off
  };
}

/**
 * Generate upgrade recommendation score (0-100)
 */
export function getUpgradeScore(current, upgrade, comparison) {
  let score = 0;
  
  // Age factor (max 30 points)
  const currentAge = current.purchaseDate 
    ? Math.floor((new Date() - new Date(current.purchaseDate)) / (365 * 24 * 60 * 60 * 1000))
    : 0;
  score += Math.min(currentAge * 6, 30);
  
  // Warranty factor (20 points if expired)
  const warrantyExpired = current.warranty 
    ? new Date(current.warranty) < new Date()
    : false;
  if (warrantyExpired) score += 20;
  
  // Feature improvements (max 25 points)
  const improvementCount = (upgrade.improvements || []).length;
  score += Math.min(improvementCount * 5, 25);
  
  // Energy efficiency (max 15 points)
  if (upgrade.energyRating === 'A+++') score += 15;
  else if (upgrade.energyRating === 'A++') score += 12;
  else if (upgrade.energyRating === 'A+') score += 8;
  
  // Price factor (max 10 points - lower price difference = higher score)
  if (comparison.priceIncreasePercent !== null) {
    const priceIncreasePenalty = Math.min(comparison.priceIncreasePercent / 10, 10);
    score += 10 - priceIncreasePenalty;
  }
  
  return Math.min(Math.round(score), 100);
}
