
const mockEncodingType = { Base64: 'base64', base64: 'base64' };

const mockReadAsStringAsync = jest.fn(async (uri, opts) => {
  // If encoding is Base64, return the string expected by the test
  if (opts && opts.encoding === 'base64') {
    return 'base64data';
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



// Attach EncodingType to all possible exports for compatibility
mockModule.EncodingType = mockEncodingType;
export default mockModule;
module.exports = mockModule;
module.exports.EncodingType = mockEncodingType;
