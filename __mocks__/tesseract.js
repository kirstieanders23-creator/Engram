// Mock tesseract.js for Jest tests
// Realistic mock OCR output for receipt-ocr.test.js
const mockOcrText = `HOME DEPOT\n11/12/2025\nKitchenAid Stand Mixer $394.39\nTotal: $394.39`;

const mockWorker = {
  loadLanguage: jest.fn(() => Promise.resolve()),
  initialize: jest.fn(() => Promise.resolve()),
  recognize: jest.fn(() => Promise.resolve({
    data: {
      text: mockOcrText,
      confidence: 85,
    },
  })),
  terminate: jest.fn(() => Promise.resolve()),
};

const createWorker = jest.fn(() => mockWorker);

module.exports = {
  createWorker,
  __mockWorker: mockWorker, // Expose for test manipulation
};
