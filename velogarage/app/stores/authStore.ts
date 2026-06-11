import { create } from 'zustand';
import { isAuthenticated, clearTokens } from '@/lib/auth';

interface AuthState {
  authenticated: boolean;
  athleteId: number | null;
  athleteName: string | null;
  athletePhoto: string | null;
  setAuthenticated: (value: boolean) => void;
  setAthlete: (id: number, name: string, photo?: string) => void;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  authenticated: false,
  athleteId: null,
  athleteName: null,
  athletePhoto: null,

  setAuthenticated: (value) => set({ authenticated: value }),

  setAthlete: (id, name, photo) =>
    set({ athleteId: id, athleteName: name, athletePhoto: photo ?? null }),

  checkAuth: async () => {
    const auth = await isAuthenticated();
    set({ authenticated: auth });
  },

  logout: async () => {
    await clearTokens();
    set({ authenticated: false, athleteId: null, athleteName: null, athletePhoto: null });
  },
}));
