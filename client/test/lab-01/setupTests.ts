import '@testing-library/jest-dom'
import '@testing-library/jest-dom';

// Suppress React act() warnings in tests
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  const msg = typeof args[0] === 'string' ? args[0] : '';
  if (
    msg.includes('was not wrapped in act') ||
    msg.includes('inside a test was not wrapped in act')
  ) {
    return;
  }
  originalConsoleError(...args);
};
