import { useEffect } from 'react';
import { create } from 'zustand';
import { api } from '@/api';
import type { User } from '@track-it/shared/types';

// User cache store using Zustand instead of global variables
interface UserCacheState {
  users: User[];
  lastFetchTime: number | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchUsers: () => Promise<void>;
  getUser: (userId: string) => User | undefined;
  getUserName: (userId: string) => string;
  getUserAvatar: (userId: string) => string | null;
  clearCache: () => void;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const useUserCacheStore = create<UserCacheState>((set, get) => ({
  users: [],
  lastFetchTime: null,
  isLoading: false,
  error: null,
  
  fetchUsers: async () => {
    const state = get();
    
    // Check if cache is still valid
    if (state.lastFetchTime && Date.now() - state.lastFetchTime < CACHE_DURATION) {
      return;
    }
    
    set({ isLoading: true, error: null });
    
    try {
      const users = await api.users.getAll();
      set({ 
        users: Array.isArray(users) ? users : [],
        lastFetchTime: Date.now(),
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch users',
        isLoading: false 
      });
    }
  },
  
  getUser: (userId: string) => {
    return get().users.find(user => user.id === userId);
  },
  
  getUserName: (userId: string) => {
    const user = get().getUser(userId);
    return user?.name || 'Unknown User';
  },
  
  getUserAvatar: (userId: string) => {
    const user = get().getUser(userId);
    return user?.avatarUrl || null;
  },
  
  clearCache: () => {
    set({ users: [], lastFetchTime: null, error: null });
  }
}));

/**
 * Hook for accessing and managing the user cache
 * Replaces the global variables anti-pattern with proper state management
 */
export function useUserCache() {
  const store = useUserCacheStore();
  
  // Fetch users on mount if cache is empty or expired
  useEffect(() => {
    const shouldFetch = !store.lastFetchTime || 
      Date.now() - store.lastFetchTime > CACHE_DURATION;
    
    if (shouldFetch) {
      store.fetchUsers();
    }
  }, [store.lastFetchTime, store.fetchUsers]);
  
  return {
    users: store.users,
    isLoading: store.isLoading,
    error: store.error,
    getUser: store.getUser,
    getUserName: store.getUserName,
    getUserAvatar: store.getUserAvatar,
    refreshUsers: store.fetchUsers,
    clearCache: store.clearCache
  };
}