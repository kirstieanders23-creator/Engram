const mockEncodingType = { Base64: 'base64' };

const mockReadAsStringAsync = jest.fn(async (uri, opts) => {
  // If encoding is Base64, return base64 string for OCR tests
  if (opts && opts.encoding === 'base64') {
    return 'base64string';
  }
  // Otherwise return valid JSON for backup tests
  return JSON.stringify({ products: [], rooms: [], settings: {}, user: null, exportedAt: Date.now() });
});

const mockWriteAsStringAsync = jest.fn(async () => {});
const mockCopyAsync = jest.fn(async () => {});

const mockModule = {
  documentDirectory: 'file:///tmp/',
  readAsStringAsync: mockReadAsStringAsync,
  writeAsStringAsync: mockWriteAsStringAsync,
  copyAsync: mockCopyAsync,
  EncodingType: mockEncodingType,
};

// Export for ES modules
export const documentDirectory = mockModule.documentDirectory;
export const readAsStringAsync = mockModule.readAsStringAsync;
export const writeAsStringAsync = mockModule.writeAsStringAsync;
export const copyAsync = mockModule.copyAsync;
export const EncodingType = mockModule.EncodingType;

// Export default for CommonJS require()
export default mockModule;
module.exports = mockModule;
