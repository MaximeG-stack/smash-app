import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SPORTS, PLAYER_LEVELS } from "@smashi/shared/constants";
import type { TabToMainNavProp } from "@/navigation/types";
import type { Sport, PlayerLevel } from "@/types";

interface PlayerCardProps {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
    profile?: {
      sports: Sport[];
      primarySport?: Sport | null;
      level: PlayerLevel;
      city?: string | null;
      totalMatchesPlayed: number;
    } | null;
  };
  compatibility: {
    overall: number;
    levelScore: number;
    proximityScore: number;
    sportScore: number;
    socialScore: number;
  };
}

function getScoreColor(score: number): string {
  if (score >= 70) return "#2ECC71";
  if (score >= 40) return "#F39C12";
  return "#E74C3C";
}

export function PlayerCard({ user, compatibility }: PlayerCardProps) {
  const navigation = useNavigation<TabToMainNavProp>();
  const profile = user.profile;
  const primarySport = profile?.primarySport;
  const sport = primarySport ? SPORTS[primarySport] : null;
  const level = profile ? PLAYER_LEVELS[profile.level] : null;
  const scoreColor = getScoreColor(compatibility.overall);

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.75}
      onPress={() => navigation.navigate("PlayerProfile", { userId: user.id })}
    >
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {user.avatarUrl ? (
          <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarInitials}>
              {user.firstName[0]}{user.lastName[0]}
            </Text>
          </View>
        )}
        {/* Score badge */}
        <View style={[styles.scoreBadge, { backgroundColor: scoreColor }]}>
          <Text style={styles.scoreText}>{compatibility.overall}%</Text>
        </View>
      </View>

      {/* Nom */}
      <Text style={styles.name} numberOfLines={1}>
        {user.firstName}
      </Text>

      {/* Ville */}
      {profile?.city && (
        <Text style={styles.city} numberOfLines={1}>
          {profile.city}
        </Text>
      )}

      {/* Badges */}
      <View style={styles.badges}>
        {sport && (
          <View style={[styles.badge, { backgroundColor: sport.bg }]}>
            <Text style={[styles.badgeText, { color: sport.text }]}>
              {sport.emoji}
            </Text>
          </View>
        )}
        {level && (
          <View style={[styles.badge, { backgroundColor: level.bg }]}>
            <Text style={[styles.badgeText, { color: level.text }]}>
              {level.label.slice(0, 3)}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 140,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 10,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarFallback: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#D5F5E3",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A9B50",
  },
  scoreBadge: {
    position: "absolute",
    bottom: -4,
    right: -8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  scoreText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  name: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A1A2E",
    textAlign: "center",
    marginBottom: 2,
  },
  city: {
    fontSize: 11,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 8,
  },
  badges: {
    flexDirection: "row",
    gap: 4,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
});
