import { create } from 'zustand';
import { api } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  name: string;
  currentLevel: string;
  xp: number;
  streak: number;
  dailyGoalXp: number;
  lastActiveAt?: string;
  role?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (token: string) => Promise<void>;
  register: (name: string, email: string, password: string, level?: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken, user } = response.data;
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', accessToken);
        localStorage.setItem('user', JSON.stringify(user));
      }
      
      set({
        token: accessToken,
        user,
        isAuthenticated: true,
        loading: false,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Đăng nhập thất bại!';
      set({
        error: errorMessage,
        loading: false,
      });
      throw err;
    }
  },

  loginWithGoogle: async (token) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/google', { token });
      const { accessToken, user } = response.data;
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', accessToken);
        localStorage.setItem('user', JSON.stringify(user));
      }
      
      set({
        token: accessToken,
        user,
        isAuthenticated: true,
        loading: false,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Đăng nhập Google thất bại!';
      set({
        error: errorMessage,
        loading: false,
      });
      throw err;
    }
  },

  register: async (name, email, password, level) => {
    set({ loading: true, error: null });
    try {
      const payload = {
        name,
        email,
        password,
        ...(level && { currentLevel: level }),
      };
      await api.post('/auth/register', payload);
      set({ loading: false });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Đăng ký thất bại!';
      set({
        error: errorMessage,
        loading: false,
      });
      throw err;
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  loadUser: async () => {
    if (typeof window === 'undefined') return;
    
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      set({ token: null, user: null, isAuthenticated: false });
      return;
    }

    try {
      // Parse local user info first for instant load
      const localUser = JSON.parse(userStr);
      set({
        token,
        user: localUser,
        isAuthenticated: true,
      });

      // Fetch fresh profile from server to keep stats (XP, streak) accurate
      const response = await api.get('/users/profile');
      const freshUser = response.data;
      
      localStorage.setItem('user', JSON.stringify(freshUser));
      set({ user: freshUser });
    } catch (err) {
      // Token might be expired or invalid
      console.warn('Failed to load fresh user profile, logging out...', err);
      get().logout();
    }
  },
}));
