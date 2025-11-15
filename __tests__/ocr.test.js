import { runOCR, runLocalOCR, runRemoteOCR } from '../utils/ocr';

jest.mock('../utils/receipt-ocr', () => ({
  parseReceipt: jest.fn(async (uri) => ({ text: 'Sample Vendor 2026-12-31', dates: ['2026-12-31'], vendors: ['Sample Vendor'] }))
}));

describe('OCR abstraction', () => {
  it('runLocalOCR returns local parse result', async () => {
    const res = await runLocalOCR('file:///tmp/photo.jpg');
    expect(res.text).toContain('Sample Vendor');
    expect(Array.isArray(res.dates)).toBe(true);
  });

  it('runOCR falls back to local when remote returns null', async () => {
    const res = await runOCR('file:///tmp/photo.jpg');
    expect(res.text).toContain('Sample Vendor');
    expect(res.source).toBe('local');
  });
});
