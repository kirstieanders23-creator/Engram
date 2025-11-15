// Fuzzy product matching helper.
// Dynamic import of 'fast-levenshtein' to avoid breaking test environments if not installed.
// Usage:
//   const { findBestProductMatch } = require('./match');
//   const match = await findBestProductMatch(products, ocrText);
// Returns { product, score, method } or null.

const SUBSTRING_WEIGHT = 0.4; // weight added if name appears as substring
const MAX_DISTANCE_FOR_MATCH = 6; // max edit distance for consideration
const MIN_CONFIDENCE_SCORE = 0.5; // composite threshold

function normalize(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

async function levenshtein(a, b) {
  // Dynamic import attempt; fallback simple implementation if module missing
  try {
    const mod = await import('fast-levenshtein');
    return mod.get(a, b);
  } catch (e) {
    // Fallback minimal Levenshtein
    const s = a;
    const t = b;
    const m = s.length;
    const n = t.length;
    if (m === 0) return n;
    if (n === 0) return m;
    const d = Array.from({ length: m + 1 }, () => new Array(n + 1));
    for (let i = 0; i <= m; i++) d[i][0] = i;
    for (let j = 0; j <= n; j++) d[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = s[i - 1] === t[j - 1] ? 0 : 1;
        d[i][j] = Math.min(
          d[i - 1][j] + 1,
          d[i][j - 1] + 1,
          d[i - 1][j - 1] + cost
        );
      }
    }
    return d[m][n];
  }
}

export async function findBestProductMatch(products, rawText) {
  const text = normalize(rawText);
  if (!text) return null;

  let best = null;

  for (const product of products) {
    const nameNorm = normalize(product.name);
    if (!nameNorm) continue;

    const substring = text.includes(nameNorm);

    let distance = 0;
    if (!substring) {
      // Compare to the best slice of text of equal length to product name
      const L = nameNorm.length;
      let bestDist = Infinity;
      for (let i = 0; i <= Math.max(0, text.length - L); i++) {
        const slice = text.slice(i, i + L);
        // eslint-disable-next-line no-await-in-loop
        const d = await levenshtein(nameNorm, slice);
        if (d < bestDist) bestDist = d;
        if (bestDist === 0) break;
      }
      distance = isFinite(bestDist) ? bestDist : L;
      if (distance > MAX_DISTANCE_FOR_MATCH) continue;
    }

    const lenFactor = Math.min(nameNorm.length / Math.max(text.length, 1), 1);
    // Convert distance to similarity [0,1]
    const similarity = substring ? 1 : 1 - distance / Math.max(nameNorm.length, distance || 1);
    const score = similarity * 0.6 + lenFactor * 0.2 + (substring ? SUBSTRING_WEIGHT : 0);

    if (!best || score > best.score) {
      best = { product, score, method: substring ? 'substring' : 'levenshtein-window' };
    }
  }

  if (best && best.score >= MIN_CONFIDENCE_SCORE) return best;
  return null;
}

export const MATCH_CONSTANTS = {
  SUBSTRING_WEIGHT,
  MAX_DISTANCE_FOR_MATCH,
  MIN_CONFIDENCE_SCORE,
};
