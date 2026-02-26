export const Colors = {
  // Couleurs principales SMASHI
  primary: "#2ECC71",
  primaryDark: "#1A9B50",
  primaryLight: "#58D68D",
  primary50: "#EAFAF1",
  primary100: "#D5F5E3",

  // Couleurs par sport
  sport: {
    tennis: { color: "#2ECC71", bg: "#D5F5E3", text: "#1A9B50" },
    padel: { color: "#3498DB", bg: "#D6EAF8", text: "#1B4F72" },
    squash: { color: "#E67E22", bg: "#FDEBD0", text: "#935116" },
  },

  // Couleurs de niveau
  level: {
    BEGINNER: { color: "#27AE60", bg: "#A9DFBF", text: "#1E8449" },
    INTERMEDIATE: { color: "#2E86C1", bg: "#85C1E9", text: "#1A5276" },
    ADVANCED: { color: "#F39C12", bg: "#F5B041", text: "#7E5109" },
    EXPERT: { color: "#E74C3C", bg: "#EC7063", text: "#922B21" },
  },

  // Couleurs fonctionnelles
  success: "#27AE60",
  warning: "#F39C12",
  danger: "#E74C3C",
  info: "#3498DB",

  // Couleurs neutres
  neutral: {
    50: "#F9FAFB",
    100: "#F3F4F6",
    200: "#E5E7EB",
    300: "#D1D5DB",
    500: "#6B7280",
    700: "#374151",
    900: "#1A1A2E",
  },

  // Base
  white: "#FFFFFF",
  black: "#000000",
  transparent: "transparent",
} as const;

export type SportColor = keyof typeof Colors.sport;
export type LevelColor = keyof typeof Colors.level;
