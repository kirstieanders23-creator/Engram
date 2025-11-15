/**
 * CSV Parser - Import product data from Amazon Order History and other sources
 */

/**
 * Parse Amazon Order History CSV
 * Expected columns: Order Date, Order ID, Title, Category, ASIN/ISBN, Price, Seller
 */
export const parseAmazonCSV = (csvText) => {
  try {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      return {
        success: false,
        error: 'CSV file is empty or invalid',
      };
    }

    // Parse header row
    const headers = parseCSVLine(lines[0]);
    const headerMap = mapAmazonHeaders(headers);

    if (!headerMap.title) {
      return {
        success: false,
        error: 'CSV missing required column: Title or Product Name',
      };
    }

    // Parse data rows
    const products = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = parseCSVLine(lines[i]);
        const product = parseAmazonRow(values, headerMap);
        
        if (product) {
          products.push(product);
        }
      } catch (error) {
        errors.push({
          row: i + 1,
          error: error.message,
        });
      }
    }

    return {
      success: true,
      products,
      totalRows: lines.length - 1,
      successCount: products.length,
      errorCount: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    console.error('CSV parse error:', error);
    return {
      success: false,
      error: 'Failed to parse CSV file',
    };
  }
};

/**
 * Parse a single CSV line (handles quoted fields with commas)
 */
const parseCSVLine = (line) => {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"' && nextChar === '"') {
      // Escaped quote
      current += '"';
      i++; // Skip next quote
    } else if (char === '"') {
      // Toggle quote mode
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      // Field separator
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Add final field
  values.push(current.trim());

  return values;
};

/**
 * Map Amazon CSV headers to standard field names
 */
const mapAmazonHeaders = (headers) => {
  const map = {};

  headers.forEach((header, index) => {
    const lower = header.toLowerCase();

    if (lower.includes('order date') || lower.includes('orderdate')) {
      map.orderDate = index;
    } else if (lower.includes('order id') || lower.includes('orderid')) {
      map.orderId = index;
    } else if (lower.includes('title') || lower.includes('product name') || lower.includes('item')) {
      map.title = index;
    } else if (lower.includes('category')) {
      map.category = index;
    } else if (lower.includes('asin') || lower.includes('isbn')) {
      map.asin = index;
    } else if (lower.includes('price') || lower.includes('total') || lower.includes('amount')) {
      map.price = index;
    } else if (lower.includes('seller') || lower.includes('vendor') || lower.includes('brand')) {
      map.seller = index;
    } else if (lower.includes('quantity')) {
      map.quantity = index;
    }
  });

  return map;
};

/**
 * Parse a single product row from Amazon CSV
 */
const parseAmazonRow = (values, headerMap) => {
  const title = values[headerMap.title];
  if (!title || title.trim() === '') {
    return null; // Skip empty rows
  }

  const product = {
    name: cleanProductName(title),
    originalTitle: title,
    source: 'amazon',
  };

  // Order date → purchase date
  if (headerMap.orderDate !== undefined) {
    const dateStr = values[headerMap.orderDate];
    const parsedDate = parseAmazonDate(dateStr);
    if (parsedDate) {
      product.purchaseDate = parsedDate;
    }
  }

  // Category
  if (headerMap.category !== undefined) {
    const category = values[headerMap.category];
    if (category) {
      product.category = mapAmazonCategory(category);
      product.originalCategory = category;
    }
  }

  // Price
  if (headerMap.price !== undefined) {
    const priceStr = values[headerMap.price];
    const price = parsePrice(priceStr);
    if (price) {
      product.purchasePrice = price;
      product.originalPrice = priceStr;
    }
  }

  // Seller/Brand
  if (headerMap.seller !== undefined) {
    const seller = values[headerMap.seller];
    if (seller) {
      product.purchaseLocation = seller;
    }
  }

  // ASIN (for future product lookup)
  if (headerMap.asin !== undefined) {
    const asin = values[headerMap.asin];
    if (asin) {
      product.asin = asin;
    }
  }

  // Quantity
  if (headerMap.quantity !== undefined) {
    const quantity = parseInt(values[headerMap.quantity], 10);
    if (quantity > 1) {
      product.quantity = quantity;
    }
  }

  return product;
};

/**
 * Clean product names (remove extra info, parentheses, etc.)
 */
const cleanProductName = (name) => {
  // Remove parenthetical info at end
  let cleaned = name.replace(/\s*\([^)]*\)\s*$/g, '');
  
  // Remove common suffixes
  cleaned = cleaned.replace(/,\s*(Black|White|Silver|Red|Blue|Gray).*$/i, '');
  cleaned = cleaned.replace(/\s*-\s*(Black|White|Silver|Red|Blue|Gray).*$/i, '');
  
  // Trim
  cleaned = cleaned.trim();
  
  return cleaned;
};

/**
 * Parse Amazon date formats
 * Common formats: "MM/DD/YYYY", "YYYY-MM-DD", "Month DD, YYYY"
 */
const parseAmazonDate = (dateStr) => {
  if (!dateStr) return null;

  try {
    // Try ISO format first
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      return dateStr.split('T')[0]; // Return just YYYY-MM-DD
    }

    // Try MM/DD/YYYY
    const slashMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (slashMatch) {
      const [, month, day, year] = slashMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // Try Month DD, YYYY
    const monthMatch = dateStr.match(/^([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})/);
    if (monthMatch) {
      const [, monthName, day, year] = monthMatch;
      const month = parseMonthName(monthName);
      if (month) {
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }

    return null;
  } catch (error) {
    console.error('Date parse error:', error);
    return null;
  }
};

/**
 * Parse month name to number
 */
const parseMonthName = (name) => {
  const months = {
    jan: '01', january: '01',
    feb: '02', february: '02',
    mar: '03', march: '03',
    apr: '04', april: '04',
    may: '05',
    jun: '06', june: '06',
    jul: '07', july: '07',
    aug: '08', august: '08',
    sep: '09', september: '09',
    oct: '10', october: '10',
    nov: '11', november: '11',
    dec: '12', december: '12',
  };

  return months[name.toLowerCase()];
};

/**
 * Parse price from various formats
 * Examples: "$49.99", "49.99", "$1,234.56"
 */
const parsePrice = (priceStr) => {
  if (!priceStr) return null;

  try {
    // Remove currency symbols and commas
    const cleaned = priceStr.replace(/[$,]/g, '');
    const price = parseFloat(cleaned);

    if (isNaN(price) || price < 0) {
      return null;
    }

    // Return number rounded to 2 decimals
    return Math.round(price * 100) / 100;
  } catch (error) {
    return null;
  }
};

/**
 * Map Amazon categories to Engram categories
 */
const mapAmazonCategory = (amazonCategory) => {
  const lower = amazonCategory.toLowerCase();

  // Kitchen
  if (lower.includes('kitchen') || lower.includes('cookware') || lower.includes('appliance')) {
    if (lower.includes('cookware') || lower.includes('pan') || lower.includes('pot')) {
      return 'Cookware';
    }
    if (lower.includes('utensil') || lower.includes('tool')) {
      return 'Kitchen Tool';
    }
    if (lower.includes('dinnerware') || lower.includes('plate') || lower.includes('bowl')) {
      return 'Dinnerware';
    }
    return 'Appliance';
  }

  // Electronics
  if (lower.includes('electronic') || lower.includes('computer') || lower.includes('tv')) {
    return 'Electronics';
  }

  // Home & Garden
  if (lower.includes('furniture') || lower.includes('home') || lower.includes('garden')) {
    return 'Furniture';
  }

  // Tools
  if (lower.includes('tool') || lower.includes('hardware')) {
    return 'Tool';
  }

  // Default
  return 'Other';
};

/**
 * Detect if product is likely still owned (vs consumable/one-time use)
 * This helps pre-select items in the import UI
 */
export const isLikelyStillOwned = (product) => {
  const name = product.name.toLowerCase();
  const category = (product.category || '').toLowerCase();

  // Consumables (unlikely to still own)
  const consumableKeywords = [
    'batteries', 'filter', 'bag', 'cartridge', 'refill',
    'paper', 'food', 'supplement', 'vitamin', 'snack',
    'shampoo', 'soap', 'lotion', 'cream',
  ];

  for (const keyword of consumableKeywords) {
    if (name.includes(keyword)) {
      return false;
    }
  }

  // Durables (likely to still own)
  const durableKeywords = [
    'mixer', 'blender', 'toaster', 'vacuum', 'tv',
    'chair', 'table', 'desk', 'lamp', 'speaker',
    'coffee maker', 'air fryer', 'microwave',
  ];

  for (const keyword of durableKeywords) {
    if (name.includes(keyword) || category.includes(keyword)) {
      return true;
    }
  }

  // Check price (expensive items likely durables)
  if (product.purchasePrice) {
    const price = parseFloat(product.purchasePrice);
    if (price >= 50) {
      return true;
    }
  }

  // Default: assume durable if from relevant categories
  const durableCategories = ['appliance', 'electronics', 'furniture', 'tool', 'cookware'];
  for (const cat of durableCategories) {
    if (category.includes(cat)) {
      return true;
    }
  }

  return false; // Default to not checked
};

/**
 * Generate warranty estimate based on product type and category
 */
export const estimateWarranty = (product) => {
  const category = (product.category || '').toLowerCase();
  const purchaseDate = product.purchaseDate;

  if (!purchaseDate) return null;

  let warrantyYears = 1; // Default

  // Electronics typically have 1-2 year warranties
  if (category.includes('electronics') || category.includes('appliance')) {
    warrantyYears = 1;
  }

  // Furniture may have longer warranties
  if (category.includes('furniture')) {
    warrantyYears = 2;
  }

  // Calculate warranty expiration
  const purchase = new Date(purchaseDate);
  const warranty = new Date(purchase);
  warranty.setFullYear(warranty.getFullYear() + warrantyYears);

  return warranty.toISOString().split('T')[0];
};
