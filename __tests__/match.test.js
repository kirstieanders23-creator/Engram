import { findBestProductMatch } from '../utils/match';

// Simple mock products
const products = [
  { id: '1', name: 'Refrigerator' },
  { id: '2', name: 'Washing Machine' },
  { id: '3', name: 'Toaster Oven' },
];

// Helper to run async match
async function match(text) {
  return await findBestProductMatch(products, text);
}

describe('findBestProductMatch', () => {
  it('returns null on empty text', async () => {
    const res = await match('');
    expect(res).toBeNull();
  });

  it('finds an exact substring match', async () => {
    const res = await match('The Refrigerator unit model XYZ');
    expect(res).not.toBeNull();
    expect(res.product.name).toBe('Refrigerator');
    expect(res.score).toBeGreaterThanOrEqual(0.5);
  });

  it('handles slight misspelling via Levenshtein', async () => {
    const res = await match('Refirgerator cooling system'); // misspelled refrigerator
    expect(res).not.toBeNull();
    expect(res.product.name).toBe('Refrigerator');
  });

  it('returns the best among multiple candidates', async () => {
    const res = await match('I cleaned the washing machine and the toaster');
    expect(res).not.toBeNull();
    // One of them might rank higher; ensure it's one of the mentioned items.
    expect(['Washing Machine', 'Toaster Oven']).toContain(res.product.name);
  });

  it('fails when distance too large', async () => {
    const res = await match('Unrelated Text Without Products');
    expect(res).toBeNull();
  });
});
