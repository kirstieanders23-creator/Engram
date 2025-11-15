import { fetchOpenFoodFacts } from '../utils/upc-api';

// Mock fetch globally
global.fetch = jest.fn();

describe('upc-api', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns product info for valid barcode', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 1,
        product: { product_name: 'Test Product', brands: 'Test Brand' },
      }),
    });

    const info = await fetchOpenFoodFacts('123456');
    expect(info).not.toBeNull();
    expect(info.name).toBe('Test Product');
    expect(info.brand).toBe('Test Brand');
  });

  it('returns null for not found', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 0 }),
    });

    const info = await fetchOpenFoodFacts('999999');
    expect(info).toBeNull();
  });
});
