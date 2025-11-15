// Open Food Facts API integration for barcode/UPC lookup.
// Returns { name, brand, image_url, categories } or null if not found.

export async function fetchOpenFoodFacts(barcode) {
  const code = String(barcode || '').trim();
  if (!code) return null;

  try {
    const url = `https://world.openfoodfacts.org/api/v0/product/${code}.json`;
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const json = await resp.json();
    if (json.status !== 1) return null;

    const product = json.product;
    return {
      name: product.product_name || product.product_name_en || '',
      brand: product.brands || '',
      image_url: product.image_url || '',
      categories: product.categories || '',
    };
  } catch (e) {
    console.warn('Open Food Facts lookup failed', e?.message);
    return null;
  }
}
