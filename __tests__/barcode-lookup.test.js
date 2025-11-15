import { fetchProductInfo } from '../utils/barcode-lookup';

describe('barcode lookup stub', () => {
  it('returns product info for known barcode', async () => {
    const info = await fetchProductInfo('012345678905');
    expect(info).not.toBeNull();
    expect(info.name).toBe('Refrigerator');
  });

  it('returns null for unknown barcode', async () => {
    const info = await fetchProductInfo('999999999999');
    expect(info).toBeNull();
  });
});
