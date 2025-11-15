/**
 * PDF Export Utility - Generate Professional Inventory Reports
 * For insurance claims, moving, and home management documentation
 */

// Dynamic import pattern for Jest compatibility
let Print;
let Sharing;
try {
  Print = require('expo-print');
  if (Print.default) Print = Print.default;
  Sharing = require('expo-sharing');
  if (Sharing.default) Sharing = Sharing.default;
} catch (e) {
  Print = null;
  Sharing = null;
}

/**
 * Format currency for display
 */
const formatCurrency = (value) => {
  if (!value) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

/**
 * Format date for display
 */
const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

/**
 * Calculate warranty status
 */
const getWarrantyStatus = (warrantyDate) => {
  if (!warrantyDate) return { status: 'No Warranty', color: '#999' };
  
  const now = new Date();
  const warranty = new Date(warrantyDate);
  const daysRemaining = Math.ceil((warranty - now) / (1000 * 60 * 60 * 24));
  
  if (daysRemaining < 0) return { status: 'Expired', color: '#999' };
  if (daysRemaining <= 30) return { status: `${daysRemaining} days left`, color: '#ff4444' };
  if (daysRemaining <= 90) return { status: `${daysRemaining} days left`, color: '#FFA500' };
  return { status: `Active (${daysRemaining} days)`, color: '#8A9A5B' };
};

/**
 * Generate HTML template for PDF
 */
const generateHTML = (products, options = {}) => {
  const {
    title = 'Home Inventory Report',
    includePhotos = true,
    includeWarranties = true,
    includeValues = false,
    groupByRoom = true,
  } = options;

  const now = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Calculate total value if requested
  let totalValue = 0;
  if (includeValues) {
    totalValue = products.reduce((sum, p) => sum + (parseFloat(p.purchasePrice) || 0), 0);
  }

  // Group products by room if requested
  let productGroups = [{ room: 'All Items', products }];
  if (groupByRoom) {
    const roomMap = {};
    products.forEach(p => {
      const room = p.room || 'Uncategorized';
      if (!roomMap[room]) roomMap[room] = [];
      roomMap[room].push(p);
    });
    productGroups = Object.entries(roomMap).map(([room, items]) => ({
      room,
      products: items,
    }));
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
            padding: 40px;
            color: #1A1A1A;
            background: #fff;
          }
          .header {
            border-bottom: 3px solid #8A9A5B;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            font-size: 32px;
            color: #8A9A5B;
            margin-bottom: 8px;
            letter-spacing: -0.5px;
          }
          .header .subtitle {
            font-size: 14px;
            color: #666;
          }
          .disclaimer {
            background: #FFF4E6;
            border-left: 4px solid #FFA500;
            padding: 12px 16px;
            margin-bottom: 30px;
            font-size: 11px;
            color: #666;
            border-radius: 4px;
          }
          .disclaimer strong {
            color: #FF8C00;
          }
          .summary {
            background: #F5F5F5;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 14px;
          }
          .summary-label {
            color: #666;
          }
          .summary-value {
            font-weight: 600;
            color: #1A1A1A;
          }
          .room-section {
            margin-bottom: 40px;
            page-break-inside: avoid;
          }
          .room-title {
            font-size: 20px;
            font-weight: 700;
            color: #8A9A5B;
            margin-bottom: 16px;
            padding-bottom: 8px;
            border-bottom: 2px solid #E5E7EB;
          }
          .product {
            border: 1px solid #E5E7EB;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
            page-break-inside: avoid;
          }
          .product-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 12px;
          }
          .product-name {
            font-size: 18px;
            font-weight: 700;
            color: #1A1A1A;
          }
          .product-category {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-top: 4px;
          }
          .product-photo {
            max-width: 200px;
            max-height: 200px;
            border-radius: 8px;
            margin-top: 12px;
            border: 1px solid #E5E7EB;
          }
          .product-details {
            margin-top: 12px;
          }
          .detail-row {
            display: flex;
            padding: 8px 0;
            border-bottom: 1px solid #F0F0F0;
            font-size: 14px;
          }
          .detail-row:last-child {
            border-bottom: none;
          }
          .detail-label {
            flex: 0 0 140px;
            color: #666;
            font-weight: 500;
          }
          .detail-value {
            flex: 1;
            color: #1A1A1A;
          }
          .warranty-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            color: #fff;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #E5E7EB;
            text-align: center;
            font-size: 12px;
            color: #999;
          }
          @media print {
            body {
              padding: 20px;
            }
            .product {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${title}</h1>
          <div class="subtitle">Generated on ${now} • ENGRAM Home Management</div>
        </div>

        <div class="disclaimer">
          <strong>⚠️ DISCLAIMER:</strong> This report is for personal reference only and is NOT an official insurance document. 
          Information accuracy is your responsibility. Consult your insurance provider for their specific documentation requirements. 
          ENGRAM is not liable for claim denials, errors, omissions, or financial losses.
        </div>

        <div class="summary">
          <div class="summary-row">
            <span class="summary-label">Total Items:</span>
            <span class="summary-value">${products.length}</span>
          </div>
          ${groupByRoom ? `
          <div class="summary-row">
            <span class="summary-label">Rooms/Locations:</span>
            <span class="summary-value">${productGroups.length}</span>
          </div>
          ` : ''}
          ${includeValues ? `
          <div class="summary-row">
            <span class="summary-label">Total Estimated Value:</span>
            <span class="summary-value">${formatCurrency(totalValue)}</span>
          </div>
          ` : ''}
          <div class="summary-row">
            <span class="summary-label">Report Type:</span>
            <span class="summary-value">Comprehensive Home Inventory</span>
          </div>
        </div>

        ${productGroups.map(group => `
          ${groupByRoom ? `<div class="room-section">
            <h2 class="room-title">📍 ${group.room}</h2>` : ''}
            
            ${group.products.map(product => {
              const warranty = getWarrantyStatus(product.warranty);
              
              return `
                <div class="product">
                  <div class="product-header">
                    <div>
                      <div class="product-name">${product.name || 'Unnamed Product'}</div>
                      ${product.category ? `<div class="product-category">${product.category}</div>` : ''}
                    </div>
                  </div>

                  ${includePhotos && product.photos && product.photos.length > 0 ? `
                    <img src="${product.photos[0]}" class="product-photo" />
                  ` : ''}

                  <div class="product-details">
                    ${product.room ? `
                    <div class="detail-row">
                      <span class="detail-label">Location:</span>
                      <span class="detail-value">${product.room}</span>
                    </div>
                    ` : ''}
                    
                    ${includeValues && product.purchasePrice ? `
                    <div class="detail-row">
                      <span class="detail-label">Purchase Price:</span>
                      <span class="detail-value">${formatCurrency(product.purchasePrice)}</span>
                    </div>
                    ` : ''}
                    
                    ${includeWarranties && product.warranty ? `
                    <div class="detail-row">
                      <span class="detail-label">Warranty Status:</span>
                      <span class="detail-value">
                        <span class="warranty-badge" style="background-color: ${warranty.color};">
                          ${warranty.status}
                        </span>
                        <span style="margin-left: 8px; color: #666;">(Expires: ${formatDate(product.warranty)})</span>
                      </span>
                    </div>
                    ` : ''}
                    
                    ${product.careInstructions ? `
                    <div class="detail-row">
                      <span class="detail-label">Care Instructions:</span>
                      <span class="detail-value">${product.careInstructions}</span>
                    </div>
                    ` : ''}
                    
                    ${product.manualUrl ? `
                    <div class="detail-row">
                      <span class="detail-label">Manual:</span>
                      <span class="detail-value">${product.manualUrl}</span>
                    </div>
                    ` : ''}

                    ${product.specifications ? `
                    <div class="detail-row">
                      <span class="detail-label">Specifications:</span>
                      <span class="detail-value">${product.specifications}</span>
                    </div>
                    ` : ''}
                  </div>
                </div>
              `;
            }).join('')}
            
          ${groupByRoom ? '</div>' : ''}
        `).join('')}

        <div class="footer">
          <p><strong>⚠️ DISCLAIMER:</strong> This report is for personal record-keeping purposes only.</p>
          <p>NOT an official insurance claim document. Contact your insurance provider for their specific requirements.</p>
          <p style="margin-top: 8px; font-size: 11px;">Generated by ENGRAM Home Management App • engram-app.com</p>
          <p style="font-size: 10px;">We are not responsible for claim denials, data accuracy, or insurance disputes.</p>
        </div>
      </body>
    </html>
  `;
};

/**
 * Export products to PDF
 * @param {Array} products - Array of product objects
 * @param {Object} options - Export options
 * @returns {Promise<string>} PDF file URI
 */
export const exportToPDF = async (products, options = {}) => {
  if (!Print) {
    throw new Error('PDF export not available in this environment');
  }

  if (!products || products.length === 0) {
    throw new Error('No products to export');
  }

  try {
    const html = generateHTML(products, options);
    
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    return uri;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
};

/**
 * Export and share PDF
 * @param {Array} products - Array of product objects
 * @param {Object} options - Export options
 */
export const exportAndSharePDF = async (products, options = {}) => {
  if (!Sharing) {
    throw new Error('Sharing not available in this environment');
  }

  const uri = await exportToPDF(products, options);

  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    return uri; // Return URI if sharing not available
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Share Home Inventory Report',
    UTI: 'com.adobe.pdf',
  });

  return uri;
};

/**
 * Generate insurance report (premium format with values)
 */
export const exportInsuranceReport = async (products) => {
  return await exportAndSharePDF(products, {
    title: 'Home Inventory - Insurance Documentation',
    includePhotos: true,
    includeWarranties: true,
    includeValues: true,
    groupByRoom: true,
  });
};

/**
 * Generate simple inventory list
 */
export const exportSimpleInventory = async (products) => {
  return await exportAndSharePDF(products, {
    title: 'Home Inventory List',
    includePhotos: false,
    includeWarranties: false,
    includeValues: false,
    groupByRoom: true,
  });
};
