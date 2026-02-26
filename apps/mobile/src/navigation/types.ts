import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";

// ── Auth Stack ───────────────────────────────────────────────
export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  OnboardingSport: undefined;
  OnboardingLevel: undefined;
  OnboardingLocation: undefined;
  OnboardingAvailability: undefined;
};

// ── Main Tabs ────────────────────────────────────────────────
export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  CreateMatch: undefined;
  MyMatches: undefined;
  Profile: undefined;
};

// ── Root Stack ───────────────────────────────────────────────
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

// ── Helpers de navigation ────────────────────────────────────
export type AuthNavProp = NativeStackNavigationProp<AuthStackParamList>;
export type MainTabNavProp = BottomTabNavigationProp<MainTabParamList>;
