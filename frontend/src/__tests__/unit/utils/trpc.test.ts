import { 
  getAuthToken, 
  setAuthToken, 
  clearAuthToken, 
  apiHandler 
} from '../../../utils/trpc';
import { TRPCClientError } from '@trpc/client';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { jest } from '@jest/globals';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('Auth token utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAuthToken', () => {
    it('should get token from localStorage', () => {
      const mockToken = 'test-token';
      localStorageMock.getItem.mockReturnValue(mockToken);

      const result = getAuthToken();

      expect(localStorageMock.getItem).toHaveBeenCalledWith('token');
      expect(result).toBe(mockToken);
    });

    it('should return null when no token exists', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = getAuthToken();

      expect(localStorageMock.getItem).toHaveBeenCalledWith('token');
      expect(result).toBeNull();
    });
  });

  describe('setAuthToken', () => {
    it('should set token in localStorage', () => {
      const testToken = 'new-token';

      setAuthToken(testToken);

      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', testToken);
    });
  });

  describe('clearAuthToken', () => {
    it('should remove token from localStorage', () => {
      clearAuthToken();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
    });
  });
});

describe('apiHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.dispatchEvent
    Object.defineProperty(window, 'dispatchEvent', {
      value: jest.fn(),
      writable: true
    });
  });

  it('should return data on successful API call', async () => {
    const mockData = { id: 1, name: 'Test' };
    const mockApiCall = jest.fn().mockResolvedValue(mockData);

    const result = await apiHandler(mockApiCall);

    expect(result).toEqual({ data: mockData, error: null });
    expect(mockApiCall).toHaveBeenCalledTimes(1);
  });

  it('should handle TRPCClientError with connection issues', async () => {
    const mockError = new TRPCClientError('Failed to fetch');
    const mockApiCall = jest.fn().mockRejectedValue(mockError);

    const result = await apiHandler(mockApiCall);

    expect(result.data).toBeNull();
    expect(result.error).toBe('Cannot connect to the server. Please ensure the backend is running.');
    expect(window.dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'api_connection_error' }) as CustomEvent
    );
  });

  it('should handle TRPCClientError with authorization issues', async () => {
    const mockError = new TRPCClientError('UNAUTHORIZED');
    const mockApiCall = jest.fn().mockRejectedValue(mockError);

    const result = await apiHandler(mockApiCall);

    expect(result.data).toBeNull();
    expect(result.error).toBe('Authentication error. Please try logging in again.');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
    expect(window.dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'auth_error'
      })
    );
  });

  it('should handle TRPCClientError with input too large', async () => {
    const mockError = new TRPCClientError('Input is too big for a single dispatch');
    const mockApiCall = jest.fn().mockRejectedValue(mockError);

    const result = await apiHandler(mockApiCall);

    expect(result.data).toBeNull();
    expect(result.error).toBe('Request data is too large. Try with a smaller batch size.');
  });

  it('should handle TRPCClientError with transform issues', async () => {
    const mockError = new TRPCClientError('Unable to transform response');
    const mockApiCall = jest.fn().mockRejectedValue(mockError);

    const result = await apiHandler(mockApiCall);

    expect(result.data).toBeNull();
    expect(result.error).toBe('Connection issue. The API response could not be processed.');
    expect(window.dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'api_connection_error'
      })
    );
  });

  it('should handle TRPCClientError with not found issues', async () => {
    const mockError = new TRPCClientError('No procedure found');
    const mockApiCall = jest.fn().mockRejectedValue(mockError);

    const result = await apiHandler(mockApiCall);

    expect(result.data).toBeNull();
    expect(result.error).toBe('API endpoint not found: No procedure found');
  });

  it('should handle generic JavaScript errors', async () => {
    const mockError = new Error('Generic error');
    const mockApiCall = jest.fn().mockRejectedValue(mockError);

    const result = await apiHandler(mockApiCall);

    expect(result.data).toBeNull();
    expect(result.error).toBe('Generic error');
  });

  it('should handle non-Error objects', async () => {
    const mockError = 'String error';
    const mockApiCall = jest.fn().mockRejectedValue(mockError);

    const result = await apiHandler(mockApiCall);

    expect(result.data).toBeNull();
    expect(result.error).toBe('Unknown error occurred');
  });

  it('should handle TRPCClientError with data containing error code', async () => {
    const mockError = new TRPCClientError('Server error');
    mockError.data = { code: 'INTERNAL_SERVER_ERROR', httpStatus: 500 };
    const mockApiCall = jest.fn().mockRejectedValue(mockError);

    const result = await apiHandler(mockApiCall);

    expect(result.data).toBeNull();
    expect(result.error).toBe('Server error');
  });
});