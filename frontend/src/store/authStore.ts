import { create } from 'zustand';
import { fetchCurrentUser, loginUser, registerUser } from '../api/endpoints';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isInitialized: false,

  async login(email, password) {
    set({ isLoading: true });
    try {
      const { access_token } = await loginUser(email, password);
      localStorage.setItem('darukaa_token', access_token);
      const user = await fetchCurrentUser();
      set({ user, isLoading: false, isInitialized: true });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  async register(email, password, fullName) {
    set({ isLoading: true });
    try {
      await registerUser({ email, password, full_name: fullName });
      const { access_token } = await loginUser(email, password);
      localStorage.setItem('darukaa_token', access_token);
      const user = await fetchCurrentUser();
      set({ user, isLoading: false, isInitialized: true });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout() {
    localStorage.removeItem('darukaa_token');
    set({ user: null });
  },

  async loadUser() {
    const token = localStorage.getItem('darukaa_token');
    if (!token) {
      set({ isInitialized: true });
      return;
    }
    try {
      const user = await fetchCurrentUser();
      set({ user, isInitialized: true });
    } catch {
      localStorage.removeItem('darukaa_token');
      set({ user: null, isInitialized: true });
    }
  },
}));
