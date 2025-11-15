import { runGoogleVisionOCR } from '../utils/ocr-remote';

jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///tmp/',
  readAsStringAsync: jest.fn(async () => 'base64string'),
  EncodingType: { Base64: 'base64' },
}));

global.fetch = jest.fn();

describe('ocr-remote', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns null if API key not configured', async () => {
    delete process.env.GOOGLE_CLOUD_VISION_API_KEY;
    const res = await runGoogleVisionOCR('file:///tmp/img.jpg');
    expect(res).toBeNull();
  });

  it('returns OCR result on success', async () => {
    process.env.GOOGLE_CLOUD_VISION_API_KEY = 'test-key';
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        responses: [{ fullTextAnnotation: { text: 'Sample receipt text' } }],
      }),
    });

    const res = await runGoogleVisionOCR('file:///tmp/img.jpg');
    expect(res).not.toBeNull();
    expect(res.text).toBe('Sample receipt text');
    expect(res.source).toBe('google-vision');
  });

  it('returns null on API error', async () => {
    process.env.GOOGLE_CLOUD_VISION_API_KEY = 'test-key';
    global.fetch.mockResolvedValueOnce({ ok: false, status: 500 });

    const res = await runGoogleVisionOCR('file:///tmp/img.jpg');
    expect(res).toBeNull();
  });
});
