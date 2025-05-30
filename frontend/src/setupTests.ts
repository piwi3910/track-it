/**
 * Jest Setup File
 * 
 * This file contains setup code that runs before each test.
 * It sets up mocks for browser APIs and other global objects.
 */

// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
import '@testing-library/jest-dom';

// Import cross-fetch for API testing
import crossFetch from 'cross-fetch';

// Import jest
import { jest } from '@jest/globals';

// Mock the window object
global.window = (global.window || {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
  CustomEvent: jest.fn((event: string, options: CustomEventInit<unknown>) => ({
    type: event,
    detail: options?.detail,
    bubbles: options?.bubbles || false,
    cancelable: options?.cancelable || false,
  })),
}) as Window & typeof globalThis;

// Mock matchMedia for responsive UI tests
window.matchMedia = (window.matchMedia || function() {
  return {
    matches: false,
    addListener: function() {},
    removeListener: function() {},
    addEventListener: function() {},
    removeEventListener: function() {},
    dispatchEvent: function() {},
    media: '',
    onchange: null,
  };
}) as typeof window.matchMedia;

// Mock localStorage implementation
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: jest.fn((key: string) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
    key: jest.fn((index: number) => Object.keys(store)[index] || null),
    length: 0,
  };
})();

// Add length property getter to localStorage mock
Object.defineProperty(localStorageMock, 'length', {
  get: () => Object.keys(localStorageMock).length,
});

global.localStorage = localStorageMock;

// Mock sessionStorage with same implementation
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: jest.fn((key: string) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
    key: jest.fn((index: number) => Object.keys(store)[index] || null),
    length: 0,
  };
})();

// Add length property getter to sessionStorage mock
Object.defineProperty(sessionStorageMock, 'length', {
  get: () => Object.keys(sessionStorageMock).length,
});

global.sessionStorage = sessionStorageMock;

// Mock fetch API with cross-fetch for API testing
global.fetch = crossFetch as unknown as typeof fetch;

// Mock ResizeObserver for UI tests
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
})) as unknown as typeof ResizeObserver;

// Mock IntersectionObserver for UI tests
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
  takeRecords: jest.fn(),
})) as unknown as typeof IntersectionObserver;

// Mock URL.createObjectURL for file uploads
global.URL.createObjectURL = jest.fn(() => 'mock-object-url');
global.URL.revokeObjectURL = jest.fn();

// Mock console methods for cleaner test output
if (process.env.SUPPRESS_LOG_ERRORS) {
  global.console.error = jest.fn();
  global.console.warn = jest.fn();
}

// Mock AbortController and AbortSignal for fetch request cancellation
const MockAbortSignal = function() {
  this.aborted = false;
  this.onabort = null;
  this.addEventListener = jest.fn();
  this.removeEventListener = jest.fn();
  this.dispatchEvent = jest.fn();
};

// Create proper inheritance chain for instanceof checks
Object.setPrototypeOf(MockAbortSignal.prototype, Object.getPrototypeOf(Object.prototype));
global.AbortSignal = MockAbortSignal as unknown as typeof AbortSignal;

// Mock AbortController using the AbortSignal
global.AbortController = jest.fn().mockImplementation(() => {
  return {
    signal: new MockAbortSignal(),
    abort: jest.fn()
  };
}) as unknown as typeof AbortController;

// Mock crypto for secure random values
if (!global.crypto) {
  global.crypto = {
    getRandomValues: jest.fn((arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
    // Add minimal subtle crypto API
    subtle: {
      digest: jest.fn(),
      encrypt: jest.fn(),
      decrypt: jest.fn(),
      sign: jest.fn(),
      verify: jest.fn(),
      generateKey: jest.fn(),
      deriveKey: jest.fn(),
      deriveBits: jest.fn(),
      importKey: jest.fn(),
      exportKey: jest.fn(),
      wrapKey: jest.fn(),
      unwrapKey: jest.fn(),
    },
  } as unknown as Crypto;
}

// Mock environment variables
process.env.VITE_API_URL = 'http://localhost:3001/trpc';

// Mock import.meta.env for Jest
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      env: {
        VITE_API_URL: 'http://localhost:3001/trpc',
        MODE: 'test',
        BASE_URL: '/',
        DEV: false,
        PROD: false,
      },
    },
  },
  writable: true,
});

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  
  // Reset localStorage and sessionStorage
  localStorageMock.clear();
  sessionStorageMock.clear();
});