import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { CompositeNavigationProp } from "@react-navigation/native";

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

// ── Main Stack (wraps Tabs + screens accessibles depuis tous les onglets) ──
export type MainStackParamList = {
  Tabs: undefined;
  MatchDetail: { matchId: string };
  Notifications: undefined;
  PlayerProfile: { userId: string };
  Players: undefined;
  Conversations: undefined;
  ChatConversation: { conversationId: string; otherUserId: string; otherUserName: string; otherUserAvatar?: string | null };
  MatchFeedback: { matchId: string; matchTitle: string; sport: string };
};

// ── Root Stack ───────────────────────────────────────────────
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

// ── Home Stack (imbriqué dans le tab Home, garde le tab bar) ──
export type HomeStackParamList = {
  HomeMain: undefined;
  Conversations: undefined;
  ChatConversation: { conversationId: string; otherUserId: string; otherUserName: string; otherUserAvatar?: string | null };
};

// ── Helpers de navigation ────────────────────────────────────
export type AuthNavProp = NativeStackNavigationProp<AuthStackParamList>;
export type MainTabNavProp = BottomTabNavigationProp<MainTabParamList>;

// Navigation composite : depuis un onglet → vers un écran du stack parent
export type TabToMainNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList>,
  NativeStackNavigationProp<MainStackParamList>
>;

// Navigation depuis le HomeStack → vers les écrans du stack parent
export type HomeStackNavProp = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList>,
  CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList>,
    NativeStackNavigationProp<MainStackParamList>
  >
>;
