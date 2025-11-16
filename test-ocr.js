// test-ocr.js
// Standalone test for the parseReceipt OCR function

const { parseReceipt } = require('./utils/receipt-ocr');

(async () => {
  // Replace with a valid local image URI or path
  const imageUri = './sample-receipt.jpg';
  try {
    const result = await parseReceipt(imageUri);
    console.log('Purchase Date:', result.purchaseDate);
    console.log('Warranty Expiration:', result.warrantyExpiration);
    console.log('Purchase Price:', result.purchasePrice);
    console.log('Store Name:', result.storeName);
    console.log('Product Name:', result.productName);
    console.log('Full Result:', result);
  } catch (e) {
    console.error('OCR test failed:', e);
  }
})();
