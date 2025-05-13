import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/api';
import { RouterOutputs } from '@track-it/shared';

// @ts-ignore - Ignore type errors for now
type User = RouterOutputs['users']['getCurrentUser'];

interface AuthState {
  // State
  user: User | null;
  isLoading: boolean;
  error: string | null;
  
  // Auth status
  isAuthenticated: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<{ success: boolean, error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean, error?: string }>;
  logout: () => void;
  loadUser: () => Promise<User | null>;
  updateUser: (user: User) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isLoading: true,
      error: null,
      isAuthenticated: false,
      
      // Login function
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await api.auth.login(email, password);
          
          if (response.error) {
            set({ 
              isLoading: false, 
              error: response.error,
              isAuthenticated: false
            });
            return { success: false, error: response.error };
          }
          
          set({ 
            user: response.data, 
            isLoading: false,
            isAuthenticated: true
          });
          
          return { success: true };
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Login failed';
          set({ 
            isLoading: false, 
            error: errorMessage,
            isAuthenticated: false
          });
          return { success: false, error: errorMessage };
        }
      },
      
      // Register function
      register: async (name, email, password) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await api.auth.register(name, email, password);
          
          if (response.error) {
            set({ 
              isLoading: false, 
              error: response.error,
              isAuthenticated: false
            });
            return { success: false, error: response.error };
          }
          
          set({ 
            user: response.data, 
            isLoading: false,
            isAuthenticated: true
          });
          
          return { success: true };
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Registration failed';
          set({ 
            isLoading: false, 
            error: errorMessage,
            isAuthenticated: false
          });
          return { success: false, error: errorMessage };
        }
      },
      
      // Logout function
      logout: () => {
        // Clear token and user data
        api.auth.logout();
        
        set({ 
          user: null, 
          isAuthenticated: false,
          error: null
        });
      },
      
      // Load current user
      loadUser: async () => {
        // Only attempt to get the user if tokens exist
        if (!localStorage.getItem('token')) {
          set({ 
            user: null, 
            isLoading: false,
            isAuthenticated: false
          });
          return null;
        }
        
        set({ isLoading: true });
        
        try {
          const response = await api.auth.getCurrentUser();
          
          if (response.error) {
            set({ 
              user: null, 
              isLoading: false, 
              error: response.error,
              isAuthenticated: false
            });
            return null;
          }
          
          set({ 
            user: response.data, 
            isLoading: false,
            isAuthenticated: true
          });
          
          return response.data;
        } catch (err) {
          set({ 
            user: null, 
            isLoading: false, 
            error: 'Failed to load user',
            isAuthenticated: false
          });
          return null;
        }
      },
      
      // Update user data
      updateUser: (user) => {
        set({ user });
      },
      
      // Clear error messages
      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'track-it-auth',
      version: 1,
      partialize: (state) => ({ 
        // Only persist authentication status, not the user data
        // User data is always reloaded from the API
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
);

// Initialize auth state when the store is first created
if (typeof window !== 'undefined') {
  // Run on next tick to avoid SSR issues
  setTimeout(() => {
    useAuthStore.getState().loadUser();
  }, 0);
  
  // Listen for auth state change events
  window.addEventListener('auth_state_change', () => {
    console.log('Auth store detected auth_state_change event');
    useAuthStore.getState().loadUser();
  });
  
  // Listen for token changes in localStorage
  window.addEventListener('storage', (e) => {
    if (e.key === 'token') {
      console.log('Auth store detected token change in storage');
      useAuthStore.getState().loadUser();
    }
  });
}