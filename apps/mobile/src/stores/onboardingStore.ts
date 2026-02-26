import { create } from "zustand";
import type { Sport, PlayerLevel } from "@/types";

interface OnboardingData {
  sports: Sport[];
  primarySport: Sport | null;
  levelBySport: Partial<Record<Sport, PlayerLevel>>;
  fftRanking: string;
  latitude: number | null;
  longitude: number | null;
  city: string;
  searchRadius: number;
  availabilities: Partial<Record<string, string[]>>;
  isHandisport: boolean;
}

interface OnboardingStore extends OnboardingData {
  setSports: (sports: Sport[]) => void;
  setPrimarySport: (sport: Sport) => void;
  setLevelBySport: (sport: Sport, level: PlayerLevel) => void;
  setFftRanking: (ranking: string) => void;
  setLocation: (lat: number, lng: number, city: string) => void;
  setSearchRadius: (km: number) => void;
  setAvailabilities: (availabilities: Partial<Record<string, string[]>>) => void;
  setHandisport: (v: boolean) => void;
  reset: () => void;
}

const INITIAL: OnboardingData = {
  sports: [],
  primarySport: null,
  levelBySport: {},
  fftRanking: "",
  latitude: null,
  longitude: null,
  city: "",
  searchRadius: 20,
  availabilities: {},
  isHandisport: false,
};

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  ...INITIAL,

  setSports: (sports) =>
    set({ sports, primarySport: sports.length === 1 ? sports[0] : null }),

  setPrimarySport: (primarySport) => set({ primarySport }),

  setLevelBySport: (sport, level) =>
    set((state) => ({
      levelBySport: { ...state.levelBySport, [sport]: level },
    })),

  setFftRanking: (fftRanking) => set({ fftRanking }),

  setLocation: (latitude, longitude, city) => set({ latitude, longitude, city }),

  setSearchRadius: (searchRadius) => set({ searchRadius }),

  setAvailabilities: (availabilities) => set({ availabilities }),

  setHandisport: (isHandisport) => set({ isHandisport }),

  reset: () => set(INITIAL),
}));
