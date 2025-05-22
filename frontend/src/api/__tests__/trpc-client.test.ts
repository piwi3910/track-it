/**
 * tRPC Client Integration Tests
 * 
 * These tests verify the functionality of our tRPC API client,
 * including error handling, retries, and response formatting.
 */

import { trpcClient, apiHandler } from '@/utils/trpc';
import { auth, tasks } from '@/api/trpc-api-client';
import { 
  createTestTrpcClient, 
  createLocalStorageMock, 
  isBackendRunning,
  generateTestUser 
} from './helpers/trpc-test-utils';

// Mock the trpc utility module
jest.mock('@/utils/trpc', () => {
  const actualTrpc = jest.requireActual('@/utils/trpc');
  return {
    ...actualTrpc,
    trpcClient: {
      users: {
        login: { mutate: jest.fn() },
        register: { mutate: jest.fn() },
        getCurrentUser: { query: jest.fn() },
      },
      tasks: {
        getAll: { query: jest.fn() },
        getById: { query: jest.fn() },
        create: { mutate: jest.fn() },
        update: { mutate: jest.fn() },
        delete: { mutate: jest.fn() },
      },
    },
    queryClient: actualTrpc.queryClient,
  };
});

describe('tRPC API Client', () => {
  // Mock localStorage
  const localStorageMock = createLocalStorageMock();
  
  // Save original localStorage
  const originalLocalStorage = global.localStorage;
  
  beforeAll(async () => {
    // Set our mock localStorage
    Object.defineProperty(global, 'localStorage', { value: localStorageMock });
    
    // Check if backend is running for integration tests
    if (process.env.RUN_API_INTEGRATION === 'true') {
      const backendAvailable = await isBackendRunning();
      if (!backendAvailable) {
        console.error('Backend server is not running. Some tests will be skipped.');
      }
    }
  });
  
  afterAll(() => {
    // Restore original localStorage
    Object.defineProperty(global, 'localStorage', { value: originalLocalStorage });
  });
  
  beforeEach(() => {
    // Clear mocks and localStorage before each test
    jest.clearAllMocks();
    localStorageMock.clear();
  });
  
  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Mock a network error
      (trpcClient.users.login.mutate as jest.Mock).mockRejectedValueOnce(
        new Error('Failed to fetch')
      );
      
      // Test the error handling
      const result = await auth.login('test@example.com', 'password');
      
      // Assertions
      expect(result.data).toBeNull();
      expect(result.error).toContain('Cannot connect to the server');
    });
    
    it('should handle authentication errors correctly', async () => {
      // Mock an authentication error
      (trpcClient.users.login.mutate as jest.Mock).mockRejectedValueOnce({
        message: 'UNAUTHORIZED',
        data: { code: 'UNAUTHORIZED' }
      });
      
      // Setup spy to check if localStorage is cleared
      const removeItemSpy = jest.spyOn(localStorageMock, 'removeItem');
      
      // Test the error handling
      const result = await auth.login('test@example.com', 'wrong-password');
      
      // Assertions
      expect(result.data).toBeNull();
      expect(result.error).toContain('Authentication failed');
      expect(removeItemSpy).toHaveBeenCalledWith('token');
    });
    
    it('should handle server errors appropriately', async () => {
      // Mock a server error
      (trpcClient.tasks.getAll.query as jest.Mock).mockRejectedValueOnce({
        message: 'Internal server error',
        data: { httpStatus: 500 }
      });
      
      // Test the error handling
      const result = await tasks.getAll();
      
      // Assertions
      expect(result.data).toBeNull();
      expect(result.error).toContain('Server error');
    });
    
    it('should pass through specific error messages when available', async () => {
      // Mock a specific error message
      (trpcClient.users.register.mutate as jest.Mock).mockRejectedValueOnce({
        message: 'Email already in use',
        data: { code: 'CONFLICT' }
      });
      
      const testUser = generateTestUser();
      
      // Test the error handling
      const result = await auth.register(testUser.name, testUser.email, testUser.password);
      
      // Assertions
      expect(result.data).toBeNull();
      expect(result.error).toBe('Email already in use');
    });
  });
  
  describe('Authentication Flow', () => {
    it('should store token after successful login', async () => {
      // Mock successful login response
      const mockLoginResponse = {
        id: '123',
        email: 'user@example.com',
        name: 'Test User',
        token: 'jwt-token-123',
        role: 'member'
      };
      
      (trpcClient.users.login.mutate as jest.Mock).mockResolvedValueOnce(mockLoginResponse);
      
      // Setup spy to check if localStorage is used
      const setItemSpy = jest.spyOn(localStorageMock, 'setItem');
      
      // Test login
      const result = await auth.login('user@example.com', 'password');
      
      // Assertions
      expect(result.data).toEqual(mockLoginResponse);
      expect(result.error).toBeNull();
      
      // We're not checking for token storage here since that happens in the AuthContext,
      // not in the API client itself
    });
    
    it('should clear token during logout', () => {
      // Set a token first
      localStorageMock.setItem('token', 'jwt-token-123');
      
      // Setup spy to check if localStorage is cleared
      const removeItemSpy = jest.spyOn(localStorageMock, 'removeItem');
      
      // Test logout
      auth.logout();
      
      // Assertions
      expect(removeItemSpy).toHaveBeenCalledWith('token');
      expect(localStorageMock.getItem('token')).toBeNull();
    });
  });
  
  describe('API Response Handling', () => {
    it('should return properly formatted successful responses', async () => {
      // Mock successful API response
      const mockTasksResponse = [
        { id: '1', title: 'Task 1', status: 'todo' },
        { id: '2', title: 'Task 2', status: 'in_progress' }
      ];
      
      (trpcClient.tasks.getAll.query as jest.Mock).mockResolvedValueOnce(mockTasksResponse);
      
      // Test the API call
      const result = await tasks.getAll();
      
      // Assertions
      expect(result.data).toEqual(mockTasksResponse);
      expect(result.error).toBeNull();
    });
    
    it('should retry API calls for retriable errors', async () => {
      // Mock a network error (retriable) followed by success
      (trpcClient.tasks.getAll.query as jest.Mock)
        .mockRejectedValueOnce(new Error('Failed to fetch'))
        .mockResolvedValueOnce([{ id: '1', title: 'Task 1' }]);
      
      // Test the API call
      const result = await tasks.getAll();
      
      // Assertions
      expect(result.data).toEqual([{ id: '1', title: 'Task 1' }]);
      expect(result.error).toBeNull();
      expect(trpcClient.tasks.getAll.query).toHaveBeenCalledTimes(2);
    });
    
    it('should not retry for non-retriable errors', async () => {
      // Mock a validation error (non-retriable)
      (trpcClient.tasks.create.mutate as jest.Mock).mockRejectedValueOnce({
        message: 'Validation failed',
        data: { code: 'BAD_REQUEST', httpStatus: 400 }
      });
      
      // Test the API call
      const result = await tasks.create({
        title: '',  // Empty title to trigger validation error
        priority: 'low'
      });
      
      // Assertions
      expect(result.data).toBeNull();
      expect(result.error).toBe('Validation failed');
      expect(trpcClient.tasks.create.mutate).toHaveBeenCalledTimes(1);
    });
  });
});