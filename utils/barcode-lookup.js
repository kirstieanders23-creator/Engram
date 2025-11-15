// External barcode lookup stub.
// Replace with real API integration as needed. Returns null if not found.

export async function fetchProductInfo(barcode) {
  const code = String(barcode || '').trim();
  if (!code) return null;

  // Try Open Food Facts first
  try {
    const upcModule = await import('./upc-api');
    const info = await upcModule.fetchOpenFoodFacts(code);
    if (info && info.name) {
      return { barcode: code, name: info.name, vendor: info.brand || '' };
    }
  } catch (e) {
    console.warn('UPC API lookup failed, falling back to mock', e?.message);
  }

  // Mock demo dataset fallback
  const MOCK = {
    '012345678905': { name: 'Refrigerator', vendor: 'Acme Appliances' },
    '036000291452': { name: 'Toaster Oven', vendor: 'KitchenPro' },
  };

  if (MOCK[code]) {
    return { barcode: code, ...MOCK[code] };
  }

  // Simulate not found
  return null;
}
