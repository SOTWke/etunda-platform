import { create } from 'zustand';
import apiClient from '../services/api';

interface User {
  id: string;
  email: string;
  role: string;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  
  register: (email: string, password: string, role: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: localStorage.getItem('authToken'),
  isLoading: false,
  error: null,

  register: async (email, password, role) => {
    set({ isLoading: true, error: null });
    try {
      const { user, token } = await apiClient.register(email, password, role);
      set({ user, token, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Registration failed',
        isLoading: false,
      });
      throw error;
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { user, token } = await apiClient.login(email, password);
      set({ user, token, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Login failed',
        isLoading: false,
      });
      throw error;
    }
  },

  logout: () => {
    apiClient.logout();
    set({ user: null, token: null, error: null });
  },

  checkAuth: () => {
    const token = localStorage.getItem('authToken');
    if (token) {
      set({ token });
    }
  },
}));
