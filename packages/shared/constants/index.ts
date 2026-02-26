import type { Sport, PlayerLevel } from "../types";

// ==================== SPORTS ====================

export const SPORTS: Record<Sport, { label: string; emoji: string; color: string; bg: string; text: string }> = {
  TENNIS: { label: "Tennis", emoji: "🎾", color: "#2ECC71", bg: "#D5F5E3", text: "#1A9B50" },
  PADEL: { label: "Padel", emoji: "🏓", color: "#3498DB", bg: "#D6EAF8", text: "#1B4F72" },
  SQUASH: { label: "Squash", emoji: "🟠", color: "#E67E22", bg: "#FDEBD0", text: "#935116" },
};

// ==================== NIVEAUX ====================

export const PLAYER_LEVELS: Record<PlayerLevel, { label: string; color: string; bg: string; text: string }> = {
  BEGINNER: { label: "Débutant", color: "#27AE60", bg: "#A9DFBF", text: "#1E8449" },
  INTERMEDIATE: { label: "Intermédiaire", color: "#2E86C1", bg: "#85C1E9", text: "#1A5276" },
  ADVANCED: { label: "Avancé", color: "#F39C12", bg: "#F5B041", text: "#7E5109" },
  EXPERT: { label: "Expert", color: "#E74C3C", bg: "#EC7063", text: "#922B21" },
};

// ==================== MATCHING ====================

export const MATCH_PLAYERS_COUNT: Record<Sport, { min: number; max: number; default: number }> = {
  TENNIS: { min: 2, max: 4, default: 2 },
  PADEL: { min: 4, max: 4, default: 4 },
  SQUASH: { min: 2, max: 2, default: 2 },
};

export const DEFAULT_MATCH_DURATION = 60; // minutes
export const DEFAULT_SEARCH_RADIUS = 20; // km

// ==================== COULEURS ====================

export const COLORS = {
  primary: "#2ECC71",
  primaryDark: "#1A9B50",
  primaryLight: "#58D68D",
  primary50: "#EAFAF1",
  primary100: "#D5F5E3",
  success: "#27AE60",
  warning: "#F39C12",
  danger: "#E74C3C",
  info: "#3498DB",
  neutral50: "#F9FAFB",
  neutral100: "#F3F4F6",
  neutral200: "#E5E7EB",
  neutral300: "#D1D5DB",
  neutral500: "#6B7280",
  neutral700: "#374151",
  neutral900: "#1A1A2E",
  white: "#FFFFFF",
} as const;

// ==================== STATUTS ====================

export const MATCH_STATUS_LABELS: Record<string, string> = {
  OPEN: "Ouvert",
  FULL: "Complet",
  IN_PROGRESS: "En cours",
  COMPLETED: "Terminé",
  CANCELLED: "Annulé",
};

export const REQUEST_STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  ACCEPTED: "Accepté",
  REJECTED: "Refusé",
  CANCELLED: "Annulé",
};

export const FEEDBACK_LEVEL_LABELS: Record<string, string> = {
  TOO_LOW: "Trop faible",
  BALANCED: "Équilibré",
  TOO_HIGH: "Trop élevé",
};

// ==================== RÉGION PACA ====================

export const PACA_CITIES = [
  "Marseille",
  "Aix-en-Provence",
  "Toulon",
  "Nice",
  "Cannes",
  "Antibes",
  "Aubagne",
  "La Ciotat",
  "Martigues",
  "Arles",
] as const;
