import { create } from "zustand";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;

  setUser: (user: User, token: string) => void;
  setOnboardingCompleted: () => void;
  logout: () => void;
  setLoading: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,
  hasCompletedOnboarding: false,

  setUser: (user, token) =>
    set({ user, token, isAuthenticated: true }),

  setOnboardingCompleted: () =>
    set({ hasCompletedOnboarding: true }),

  logout: () =>
    set({ user: null, token: null, isAuthenticated: false, hasCompletedOnboarding: false }),

  setLoading: (v) => set({ isLoading: v }),
}));
