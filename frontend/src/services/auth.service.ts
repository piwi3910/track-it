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
      const result = await api.auth.login(email, password);
      
      if (result.data && result.data.token) {
        this.setToken(result.data.token);
        return { data: result.data, error: null };
      }
      
      return { data: null, error: result.error || 'Login failed' };
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
      const result = await api.auth.loginWithGoogle(idToken);
      
      if (result.data && result.data.token) {
        this.setToken(result.data.token);
        return { data: result.data, error: null };
      }
      
      return { data: null, error: result.error || 'Google login failed' };
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
      const result = await api.auth.verifyGoogleToken(credential);
      
      if (result.data && result.data.valid) {
        return { 
          data: { 
            valid: true, 
            email: result.data.email, 
            name: result.data.name,
            picture: result.data.picture
          }, 
          error: null 
        };
      }
      
      return { data: { valid: false }, error: result.error || 'Invalid Google token' };
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
    
    try {
      const result = await api.auth.getCurrentUser();
      return { data: result.data, error: result.error };
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