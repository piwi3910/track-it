// @ts-nocheck - Temporarily disable type checking in this file
import { api } from '@/api';

/**
 * Authentication service
 * Handles all authentication-related functions
 */
export const authService = {
  /**
   * Check if the user is authenticated
   * @returns true if the user has a token
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  },
  
  /**
   * Get the current authentication token
   * @returns The token or null
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  },
  
  /**
   * Store the authentication token
   * @param token The token to store
   */
  setToken(token: string): void {
    localStorage.setItem('token', token);
  },
  
  /**
   * Clear the authentication token
   */
  clearToken(): void {
    localStorage.removeItem('token');
  },
  
  /**
   * Authenticate with email and password
   * @param email The user's email
   * @param password The user's password
   * @returns A promise with the login response
   */
  async login(email: string, password: string) {
    try {
      const response = await api.auth.login.mutate({ email, password });
      
      if (response && response.token) {
        this.setToken(response.token);
        return { data: response, error: null };
      }
      
      return { data: null, error: 'Login failed' };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Authentication failed' 
      };
    }
  },
  
  /**
   * Log the user out
   */
  logout(): void {
    this.clearToken();
    // Additional cleanup if needed
  },
  
  /**
   * Get the current user
   * @returns A promise with the current user
   */
  async getCurrentUser() {
    // Only attempt to get user if we have a token
    if (!this.isAuthenticated()) {
      return { data: null, error: 'Not authenticated' };
    }
    
    try {
      const response = await api.auth.getCurrentUser.query();
      return { data: response, error: null };
    } catch (error) {
      console.error('Error getting current user:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to get user data' 
      };
    }
  }
};