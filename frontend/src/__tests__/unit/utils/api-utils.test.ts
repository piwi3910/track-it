import { combineResponses, isApiAvailable } from '@/utils/api-utils';
import { describe, it, expect, beforeAll, afterEach, afterAll } from '@jest/globals';
import { jest } from '@jest/globals';

describe('combineResponses', () => {
  it('should combine data from multiple successful responses', () => {
    const responses = {
      user: { data: { id: 1, name: 'Test User' }, error: null },
      settings: { data: { theme: 'dark' }, error: null },
    };
    const result = combineResponses(responses);
    expect(result).toEqual({
      data: {
        user: { id: 1, name: 'Test User' },
        settings: { theme: 'dark' },
      },
      error: null,
    });
  });

  it('should return an error if any response has an error', () => {
    const responses = {
      user: { data: { id: 1, name: 'Test User' }, error: null },
      settings: { data: null, error: 'Failed to load settings' },
    };
    const result = combineResponses(responses);
    expect(result).toEqual({
      data: null,
      error: 'settings: Failed to load settings',
    });
  });

  it('should combine multiple errors if present', () => {
    const responses = {
      user: { data: null, error: 'Failed to load user' },
      settings: { data: null, error: 'Failed to load settings' },
    };
    const result = combineResponses(responses);
    expect(result).toEqual({
      data: null,
      error: 'user: Failed to load user, settings: Failed to load settings',
    });
  });

  it('should handle empty responses object', () => {
    const responses = {};
    const result = combineResponses(responses);
    expect(result).toEqual({ data: {}, error: null });
  });

  it('should handle responses with undefined data', () => {
    const responses = {
      data1: { data: undefined, error: null },
      data2: { data: 'some string', error: null },
    };
    const result = combineResponses(responses);
    expect(result).toEqual({
      data: { data1: undefined, data2: 'some string' },
      error: null,
    });
  });
});

describe('isApiAvailable', () => {
  const originalFetch = global.fetch;
  const originalViteApiUrlDescriptor = Object.getOwnPropertyDescriptor(import.meta.env, 'VITE_API_URL');

  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
    // Restore original VITE_API_URL property
    if (originalViteApiUrlDescriptor) {
      Object.defineProperty(import.meta.env, 'VITE_API_URL', originalViteApiUrlDescriptor);
    } else {
      delete import.meta.env.VITE_API_URL;
    }
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  // Helper to set VITE_API_URL for tests
  const setViteApiUrl = (value: string | undefined) => {
    Object.defineProperty(import.meta.env, 'VITE_API_URL', {
      value,
      writable: true,
      configurable: true,
    });
  };

  it('should return true if API is available (response.ok is true)', async () => {
    setViteApiUrl('http://localhost:3001/trpc'); // Set a default for this test

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ status: 'ok' }),
        headers: new Headers(),
        redirected: false,
        statusText: 'OK',
        type: 'basic',
        url: '',
        clone: () => ({}) as Response,
      }) as Promise<Response>
    );

    const result = await isApiAvailable();
    expect(result).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/health'), expect.objectContaining({}) as RequestInit);
  });

  it('should return false if API is not available (response.ok is false)', async () => {
    setViteApiUrl('http://localhost:3001/trpc'); // Set a default for this test

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Internal Server Error' }),
        headers: new Headers(),
        redirected: false,
        statusText: 'Internal Server Error',
        type: 'basic',
        url: '',
        clone: () => ({}) as Response,
      }) as Promise<Response>
    );

    const result = await isApiAvailable();
    expect(result).toBe(false);
  });

  it('should return false if fetch throws a network error', async () => {
    setViteApiUrl('http://localhost:3001/trpc'); // Set a default for this test

    global.fetch = jest.fn(() => Promise.reject(new TypeError('Network error')));

    const result = await isApiAvailable();
    expect(result).toBe(false);
  });

  it('should return false if fetch times out', async () => {
    setViteApiUrl('http://localhost:3001/trpc'); // Set a default for this test

    jest.useFakeTimers();
    global.fetch = jest.fn(() => Promise.reject(new DOMException('The user aborted a request.', 'AbortError')));

    const promise = isApiAvailable();
    jest.advanceTimersByTime(5000); // Advance timers by 5 seconds

    const result = await promise;
    expect(result).toBe(false);
    expect(console.log).toHaveBeenCalledWith('API health check timed out after 5 seconds');
    jest.useRealTimers();
  });

  it('should handle VITE_API_URL without /trpc suffix', async () => {
    setViteApiUrl('http://localhost:4000');

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ status: 'ok' }),
        headers: new Headers(),
        redirected: false,
        statusText: 'OK',
        type: 'basic',
        url: '',
        clone: () => ({}) as Response,
      }) as Promise<Response>
    );

    await isApiAvailable();
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:4000/health', expect.objectContaining({}) as RequestInit);
  });

  it('should handle VITE_API_URL with /trpc suffix', async () => {
    setViteApiUrl('http://localhost:3001/trpc');

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ status: 'ok' }),
        headers: new Headers(),
        redirected: false,
        statusText: 'OK',
        type: 'basic',
        url: '',
        clone: () => ({}) as Response,
      }) as Promise<Response>
    );

    await isApiAvailable();
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/health', expect.objectContaining({}) as RequestInit);
  });

  it('should use default localhost:3001 if VITE_API_URL is not set', async () => {
    setViteApiUrl(undefined);

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ status: 'ok' }),
        headers: new Headers(),
        redirected: false,
        statusText: 'OK',
        type: 'basic',
        url: '',
        clone: () => ({}) as Response,
      }) as Promise<Response>
    );

    await isApiAvailable();
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/health', expect.objectContaining({}) as RequestInit);
  });
});