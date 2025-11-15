// Mock tesseract.js for Jest tests
const mockWorker = {
  loadLanguage: jest.fn(() => Promise.resolve()),
  initialize: jest.fn(() => Promise.resolve()),
  recognize: jest.fn(() => Promise.resolve({
    data: {
      text: 'Mock OCR text',
      confidence: 80,
    },
  })),
  terminate: jest.fn(() => Promise.resolve()),
};

const createWorker = jest.fn(() => mockWorker);

module.exports = {
  createWorker,
  __mockWorker: mockWorker, // Expose for test manipulation
};
