// Google Cloud Vision API integration stub for OCR.
// Requires GOOGLE_CLOUD_VISION_API_KEY in environment or config.
// Returns { text, dates, vendors, confidence, source: 'google-vision' } or null on error.

export async function runGoogleVisionOCR(imageUri) {
  const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY || '';
  if (!apiKey) {
    console.warn('Google Vision API key not configured');
    return null;
  }

  try {
    // Convert imageUri to base64 (assume helper or fetch from file system)
    let FileSystem;
    try {
      FileSystem = require('expo-file-system');
      // Handle CommonJS default export
      if (FileSystem.default) FileSystem = FileSystem.default;
    } catch (e) {
      FileSystem = await import('expo-file-system');
    }
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const body = JSON.stringify({
      requests: [{
        image: { content: base64 },
        features: [{ type: 'TEXT_DETECTION', maxResults: 1 }],
      }],
    });

    const resp = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    if (!resp.ok) {
      console.warn('Google Vision API error', resp.status);
      return null;
    }

    const json = await resp.json();
    const annotation = json.responses?.[0]?.fullTextAnnotation;
    if (!annotation) return null;

    const text = annotation.text || '';
    // Extract dates/vendors from text using simple patterns (reuse from receipt-ocr if desired)
    const dates = [];
    const vendors = [];
    // Placeholder: implement parsing logic or call common helper
    return { text, dates, vendors, confidence: 'high', source: 'google-vision' };
  } catch (e) {
    console.warn('Google Vision OCR failed', e?.message);
    return null;
  }
}
