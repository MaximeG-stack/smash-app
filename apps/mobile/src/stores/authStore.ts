import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;

  setUser: (user: User, token: string) => void;
  updateUser: (user: User) => void;
  setOnboardingCompleted: () => void;
  logout: () => void;
  setLoading: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
      hasCompletedOnboarding: false,

      setUser: (user, token) =>
        set({ user, token, isAuthenticated: true }),

      updateUser: (user) =>
        set({ user }),

      setOnboardingCompleted: () =>
        set({ hasCompletedOnboarding: true }),

      logout: () =>
        set({ user: null, token: null, isAuthenticated: false, hasCompletedOnboarding: false }),

      setLoading: (v) => set({ isLoading: v }),
    }),
    {
      name: "smashi-auth",
      storage: createJSONStorage(() => AsyncStorage),
      // On persiste uniquement ce qui est utile (pas isLoading)
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
      }),
    },
  ),
);
