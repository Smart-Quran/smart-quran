import { create } from 'zustand';
import { TelegramUser } from '@/types';
import { api } from '@/lib/api';

interface AuthStore {
  user: TelegramUser | null;
  token: string | null;
  isLoading: boolean;
  setUser: (user: TelegramUser, token: string) => void;
  logout: () => void;
  initFromStorage: () => void;
  loginWithTelegram: (initData: string) => Promise<void>;
  loginAsGuest: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,

  setUser: (user, token) => {
    localStorage.setItem('sq_token', token);
    localStorage.setItem('sq_user', JSON.stringify(user));
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    set({ user, token });
  },

  logout: () => {
    localStorage.removeItem('sq_token');
    localStorage.removeItem('sq_user');
    delete api.defaults.headers.common['Authorization'];
    set({ user: null, token: null });
  },

  initFromStorage: () => {
    try {
      const token = localStorage.getItem('sq_token');
      const userStr = localStorage.getItem('sq_user');
      if (token && userStr) {
        const user = JSON.parse(userStr) as TelegramUser;
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        set({ user, token, isLoading: false });
        return;
      }
    } catch {
      // ignore parse errors
    }
    set({ isLoading: false });
  },

  loginWithTelegram: async (initData: string) => {
    set({ isLoading: true });
    try {
      const response = await api.post('/auth/telegram', { init_data: initData });
      const { user, token } = response.data;
      get().setUser(user, token);
    } finally {
      set({ isLoading: false });
    }
  },

  loginAsGuest: async () => {
    set({ isLoading: true });
    try {
      const response = await api.post('/auth/guest');
      const { user, token } = response.data;
      get().setUser(user, token);
    } finally {
      set({ isLoading: false });
    }
  },
}));
