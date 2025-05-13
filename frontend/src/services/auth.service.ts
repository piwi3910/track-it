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
    
    // Dispatch custom event for auth state change
    window.dispatchEvent(new CustomEvent('auth_state_change', {
      detail: { isAuthenticated: true }
    }));
  },
  
  /**
   * Clear the authentication token
   */
  clearToken(): void {
    localStorage.removeItem('token');
    
    // Dispatch custom event for auth state change
    window.dispatchEvent(new CustomEvent('auth_state_change', {
      detail: { isAuthenticated: false }
    }));
  },
  
  /**
   * Authenticate with email and password
   * @param email The user's email
   * @param password The user's password
   * @returns A promise with the login response
   */
  async login(email: string, password: string) {
    try {
      // For demo purposes, use hardcoded credentials check
      if (email === 'demo@example.com' && password === 'password123') {
        // Mock successful login
        const demoUser = {
          id: 'demo-user',
          name: 'Demo User',
          email: 'demo@example.com',
          role: 'admin',
          token: 'demo-token-' + Math.random().toString(36).substring(2)
        };
        
        this.setToken(demoUser.token);
        return { data: demoUser, error: null };
      }
      
      // Try with API if we're not using demo credentials
      try {
        // First try the tRPC-style API
        if (api.auth.login && typeof api.auth.login.mutate === 'function') {
          const response = await api.auth.login.mutate({ email, password });
          
          if (response && response.token) {
            this.setToken(response.token);
            return { data: response, error: null };
          }
        } 
        // Fall back to mock API style
        else if (typeof api.auth.login === 'function') {
          const response = await api.auth.login({ email, password });
          
          if (response && response.token) {
            this.setToken(response.token);
            return { data: response, error: null };
          }
        } else {
          throw new Error('Login method not available');
        }
      } catch (apiError) {
        console.warn('API login failed, but we have demo mode available:', apiError);
        // If API login fails but credentials match demo, still allow login
        if (email === 'demo@example.com' && password === 'password123') {
          return this.login(email, password);
        }
        throw apiError;
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
   * Authenticate with Google Identity token
   * @param idToken The Google Identity token
   * @returns A promise with the login response
   */
  async loginWithGoogle(idToken: string) {
    try {
      const response = await api.auth.loginWithGoogle.mutate({ idToken });
      
      if (response && response.token) {
        this.setToken(response.token);
        return { data: response, error: null };
      }
      
      return { data: null, error: 'Google login failed' };
    } catch (error) {
      console.error('Google login error:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Google authentication failed' 
      };
    }
  },
  
  /**
   * Verify Google token on the backend
   * @param credential The Google credential
   * @returns A promise with verification response
   */
  async verifyGoogleToken(credential: string) {
    try {
      const response = await api.auth.verifyGoogleToken.mutate({ credential });
      
      if (response && response.valid) {
        return { 
          data: { 
            valid: true, 
            email: response.email, 
            name: response.name,
            picture: response.picture
          }, 
          error: null 
        };
      }
      
      return { data: { valid: false }, error: 'Invalid Google token' };
    } catch (error) {
      console.error('Google token verification error:', error);
      return { 
        data: { valid: false }, 
        error: error instanceof Error ? error.message : 'Token verification failed' 
      };
    }
  },
  
  /**
   * Log the user out
   */
  logout(): void {
    this.clearToken();
    
    // If we have Google auth loaded, sign out from Google too
    if (window.google?.accounts?.id) {
      // This method only exists in newer versions of the Google Identity Services
      try {
        // @ts-ignore - This method might not exist in all versions
        if (typeof window.google.accounts.id.revoke === 'function') {
          window.google.accounts.id.revoke();
        }
        window.google.accounts.id.disableAutoSelect();
      } catch (e) {
        console.error('Error signing out from Google:', e);
      }
    }
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
    
    // Check if we have a demo token
    const token = this.getToken();
    if (token && token.startsWith('demo-token-')) {
      // Return demo user data
      return {
        data: {
          id: 'demo-user',
          name: 'Demo User',
          email: 'demo@example.com',
          role: 'admin',
          avatarUrl: 'https://ui-avatars.com/api/?name=Demo+User&background=random',
          preferences: {
            theme: 'light',
            defaultView: 'dashboard'
          }
        },
        error: null
      };
    }
    
    try {
      // Try both API styles
      let response;
      
      try {
        // First try tRPC style
        if (api.auth.getCurrentUser && typeof api.auth.getCurrentUser.query === 'function') {
          response = await api.auth.getCurrentUser.query();
        } 
        // Fall back to mock API style
        else if (typeof api.auth.getCurrentUser === 'function') {
          response = await api.auth.getCurrentUser();
        } else {
          throw new Error('getCurrentUser method not available');
        }
      } catch (apiError) {
        console.warn('API getCurrentUser failed, falling back to demo mode if applicable:', apiError);
        
        // If this is a demo token that doesn't match the format we expect, let's still return the demo user
        if (token && 
            (token.includes('demo') || 
             token === 'mock-token' || 
             token.length < 20)) {
          return this.getCurrentUser(); // Re-run to hit the demo user check
        }
        
        throw apiError;
      }
      
      return { data: response, error: null };
    } catch (error) {
      console.error('Error getting current user:', error);
      
      // If the error is authentication related, clear the token
      if (error instanceof Error && 
          (error.message.includes('unauthorized') || 
           error.message.includes('Unauthorized') || 
           error.message.includes('token') || 
           error.message.includes('session'))) {
        this.clearToken();
      }
      
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to get user data' 
      };
    }
  }
};