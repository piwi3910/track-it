import { useState, useCallback, useEffect, useRef } from 'react';
import { useApp } from './useApp';
import { authService } from '@/services/auth.service';
import { useStore } from './useStore';

// Google Identity Services types
interface GoogleCredentialResponse {
  credential: string;
  clientId: string;
  select_by: string;
}

interface GoogleUser {
  email: string;
  name: string;
  picture: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, options: any) => void;
          prompt: (notification?: any) => void;
          disableAutoSelect: () => void;
          storeCredential: (credential: any, callback: () => void) => void;
          cancel: () => void;
          onGoogleLibraryLoad: () => void;
        };
      };
    };
  }
}

interface UseGoogleAuthResult {
  login: () => Promise<boolean>;
  renderButton: (elementId: string) => void;
  isGoogleLoaded: boolean;
  loading: boolean;
  error: string | null;
  connected: boolean;
  connectedEmail: string | null;
}

// Google client ID from environment variables or use a default for development
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 
  '123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com';

export function useGoogleAuth(): UseGoogleAuthResult {
  const { googleStore } = useStore();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [connected, setConnected] = useState(googleStore?.connected || false);
  const [connectedEmail, setConnectedEmail] = useState<string | null>(googleStore?.connectedEmail || null);
  const googleInitialized = useRef(false);

  // Sync with Zustand store
  useEffect(() => {
    if (googleStore) {
      setConnected(googleStore.connected);
      setConnectedEmail(googleStore.connectedEmail);
    }
  }, [googleStore?.connected, googleStore?.connectedEmail]);

  // Initialize Google Identity Services
  useEffect(() => {
    // Only load script once
    if (document.getElementById('google-auth-script')) {
      if (window.google?.accounts) {
        setIsGoogleLoaded(true);
        initializeGoogleAuth();
      }
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-auth-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setIsGoogleLoaded(true);
      initializeGoogleAuth();
    };
    script.onerror = () => {
      setError('Failed to load Google Identity Services');
    };
    
    document.body.appendChild(script);
    
    return () => {
      // Script cleanup is not recommended as it can break other components
      // that depend on Google Identity Services, but we'll keep this reference
      const scriptElement = document.getElementById('google-auth-script');
      if (scriptElement?.parentNode === document.body) {
        // document.body.removeChild(scriptElement);
      }
    };
  }, []);

  // Initialize Google Auth after script is loaded
  const initializeGoogleAuth = useCallback(() => {
    if (!window.google?.accounts?.id || googleInitialized.current) return;

    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      googleInitialized.current = true;
      console.log('Google Identity Services initialized');
    } catch (err) {
      console.error('Error initializing Google Identity Services:', err);
      setError('Failed to initialize Google authentication');
    }
  }, []);

  // Handle the response from Google Identity Services
  const handleCredentialResponse = useCallback(async (response: GoogleCredentialResponse) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Google authentication successful, processing credential...');
      
      // Send the Google credential to your backend for verification
      const { data, error } = await authService.loginWithGoogle(response.credential);
      
      if (error) {
        throw new Error(error);
      }
      
      // Check that we got a valid response with token
      if (!data || !data.token) {
        throw new Error('Invalid login response');
      }
      
      console.log('Login successful with Google authentication');
      
      // Link Google account if the user has Zustand store
      if (googleStore?.linkAccount) {
        try {
          // In a real implementation, we would extract an auth code from the response
          // Here we'll simulate it with the token
          await googleStore.linkAccount(data.token);
        } catch (linkError) {
          console.warn('Linking Google account failed but login succeeded:', linkError);
          // We still continue since auth worked
        }
      }
      
      // Dispatch custom event for auth state change
      window.dispatchEvent(new CustomEvent('auth_state_change', {
        detail: { isAuthenticated: true }
      }));
    } catch (err) {
      console.error('Google login processing failed:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }, [googleStore]);

  // Trigger Google login (shows the Google One Tap dialog)
  const login = useCallback(async () => {
    if (!window.google?.accounts?.id) {
      setError('Google Identity Services not loaded');
      return false;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Create a promise that will resolve when login completes
      const loginPromise = new Promise<boolean>((resolve) => {
        // Store the original callback
        const originalCallback = handleCredentialResponse;
        
        // Create a wrapped callback that resolves the promise
        const wrappedCallback = async (response: GoogleCredentialResponse) => {
          try {
            await originalCallback(response);
            resolve(true);
          } catch (error) {
            resolve(false);
          }
        };
        
        // Temporarily replace the callback
        // @ts-ignore - We're doing a runtime override
        window.google.accounts.id.callback = wrappedCallback;
        
        // Prompt the user to select their Google account
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // If the One Tap dialog is not displayed or skipped, fall back to a render button
            console.log('Google One Tap was skipped or not displayed:', notification.getNotDisplayedReason());
            setError('Google sign-in popup was blocked. Please enable popups or use the Sign in with Google button.');
            resolve(false);
          }
        });
        
        // Reset the callback after 30 seconds (timeout)
        setTimeout(() => {
          resolve(false);
        }, 30000);
      });
      
      // Wait for login to complete and return result
      const success = await loginPromise;
      return success;
    } catch (err) {
      console.error('Error prompting Google account selection:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
      setLoading(false);
      return false;
    }
  }, [handleCredentialResponse]);

  // Render a Google Sign-In button in the specified element
  const renderButton = useCallback((elementId: string) => {
    if (!window.google?.accounts?.id || !isGoogleLoaded) {
      console.warn('Google Identity Services not loaded yet');
      return;
    }
    
    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`Element with ID ${elementId} not found`);
      return;
    }
    
    try {
      window.google.accounts.id.renderButton(element, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'center',
        width: 280
      });
      console.log('Google Sign-In button rendered');
    } catch (err) {
      console.error('Error rendering Google Sign-In button:', err);
    }
  }, [isGoogleLoaded]);

  return { 
    login, 
    renderButton, 
    isGoogleLoaded, 
    loading, 
    error,
    connected,
    connectedEmail
  };
}