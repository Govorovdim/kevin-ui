import { create } from "zustand";

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setToken: (token: string) => void;
  clearToken: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  isAuthenticated: false,
  isLoading: true,
  setToken: (token) => set({ token, isAuthenticated: true, isLoading: false }),
  clearToken: () =>
    set({ token: null, isAuthenticated: false, isLoading: false }),
  setLoading: (loading) => set({ isLoading: loading }),
}));
