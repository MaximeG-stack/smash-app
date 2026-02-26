import { View, Text } from "react-native";
import type { Sport, PlayerLevel } from "@/types";
import { Colors } from "@/constants/colors";

// ── Badge sport ──────────────────────────────────────────────
interface SportBadgeProps {
  sport: Sport;
  size?: "sm" | "md";
}

const SPORT_LABEL: Record<Sport, string> = {
  TENNIS: "Tennis",
  PADEL: "Padel",
  SQUASH: "Squash",
};

const SPORT_EMOJI: Record<Sport, string> = {
  TENNIS: "🎾",
  PADEL: "🏓",
  SQUASH: "🟠",
};

export function SportBadge({ sport, size = "md" }: SportBadgeProps) {
  const c = Colors.sport[sport.toLowerCase() as keyof typeof Colors.sport];
  const height = size === "sm" ? 20 : 24;
  const textSize = size === "sm" ? 10 : 12;

  return (
    <View
      style={{
        backgroundColor: c.bg,
        height,
        paddingHorizontal: 10,
        borderRadius: 9999,
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        alignSelf: "flex-start",
      }}
    >
      <Text style={{ fontSize: textSize }}>{SPORT_EMOJI[sport]}</Text>
      <Text style={{ color: c.text, fontSize: textSize, fontWeight: "600" }}>
        {SPORT_LABEL[sport]}
      </Text>
    </View>
  );
}

// ── Badge niveau ─────────────────────────────────────────────
interface LevelBadgeProps {
  level: PlayerLevel;
  size?: "sm" | "md";
}

const LEVEL_LABEL: Record<PlayerLevel, string> = {
  BEGINNER: "Débutant",
  INTERMEDIATE: "Intermédiaire",
  ADVANCED: "Avancé",
  EXPERT: "Expert",
};

export function LevelBadge({ level, size = "md" }: LevelBadgeProps) {
  const c = Colors.level[level];
  const height = size === "sm" ? 22 : 28;
  const textSize = size === "sm" ? 10 : 12;

  return (
    <View
      style={{
        backgroundColor: c.bg,
        height,
        paddingHorizontal: 10,
        borderRadius: 8,
        justifyContent: "center",
        alignSelf: "flex-start",
      }}
    >
      <Text style={{ color: c.text, fontSize: textSize, fontWeight: "600" }}>
        {LEVEL_LABEL[level]}
      </Text>
    </View>
  );
}

// ── Badge statut ─────────────────────────────────────────────
interface StatusBadgeProps {
  label: string;
  color: "success" | "warning" | "danger" | "info" | "neutral";
}

const STATUS_COLORS = {
  success: { bg: "#D5F5E3", text: "#1A9B50" },
  warning: { bg: "#FEF9C3", text: "#B45309" },
  danger: { bg: "#FEE2E2", text: "#B91C1C" },
  info: { bg: "#DBEAFE", text: "#1D4ED8" },
  neutral: { bg: "#F3F4F6", text: "#6B7280" },
} as const;

export function StatusBadge({ label, color }: StatusBadgeProps) {
  const c = STATUS_COLORS[color];

  return (
    <View
      style={{
        backgroundColor: c.bg,
        height: 24,
        paddingHorizontal: 10,
        borderRadius: 9999,
        justifyContent: "center",
        alignSelf: "flex-start",
      }}
    >
      <Text style={{ color: c.text, fontSize: 12, fontWeight: "600" }}>{label}</Text>
    </View>
  );
}
