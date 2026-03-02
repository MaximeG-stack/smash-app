import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { Match } from "@/types";
import { SPORTS, PLAYER_LEVELS, MATCH_STATUS_LABELS } from "@smashi/shared/constants";
import { formatMatchDateShort, formatDuration } from "@/lib/dateUtils";
import type { TabToMainNavProp } from "@/navigation/types";

interface MatchCardProps {
  match: Match;
  isMyMatch?: boolean;
  isRecommended?: boolean;
}

export function MatchCard({ match, isMyMatch, isRecommended }: MatchCardProps) {
  const navigation = useNavigation<TabToMainNavProp>();
  const sport = SPORTS[match.sport];

  const statusColors: Record<string, { bg: string; text: string }> = {
    OPEN: { bg: "#D5F5E3", text: "#1A9B50" },
    FULL: { bg: "#FCE8D5", text: "#935116" },
    IN_PROGRESS: { bg: "#D6EAF8", text: "#1B4F72" },
    COMPLETED: { bg: "#F3F4F6", text: "#6B7280" },
    CANCELLED: { bg: "#FDECEA", text: "#922B21" },
  };
  const statusColor = statusColors[match.status] ?? statusColors.OPEN;

  const title = match.title || `Partie de ${sport.label}`;
  const isFull = match.currentPlayers >= match.maxPlayers;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.75}
      onPress={() => navigation.navigate("MatchDetail", { matchId: match.id })}
    >
      {/* En-tête : sport + statut */}
      <View style={styles.header}>
        <View style={[styles.sportBadge, { backgroundColor: sport.bg }]}>
          <Text style={[styles.sportText, { color: sport.text }]}>
            {sport.emoji} {sport.label}
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
          {isRecommended && (
            <View style={styles.recommendedBadge}>
              <Text style={styles.recommendedText}>★ Recommandé</Text>
            </View>
          )}
          {isMyMatch && (
            <View style={styles.myMatchBadge}>
              <Text style={styles.myMatchText}>Ma partie</Text>
            </View>
          )}
          <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
            <Text style={[styles.statusText, { color: statusColor.text }]}>
              {MATCH_STATUS_LABELS[match.status] ?? match.status}
            </Text>
          </View>
        </View>
      </View>

      {/* Titre */}
      <Text style={styles.title} numberOfLines={1}>{title}</Text>

      {/* Lieu + date */}
      <View style={styles.infoRow}>
        <Text style={styles.infoText} numberOfLines={1}>
          📍 {match.locationName}
        </Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoText}>
          📅 {formatMatchDateShort(match.scheduledAt)}
        </Text>
        <Text style={styles.infoTextSecondary}>
          ⏱ {formatDuration(match.durationMinutes)}
        </Text>
      </View>

      {/* Pied de carte : niveau + joueurs */}
      <View style={styles.footer}>
        {match.requiredLevel ? (
          <View style={[styles.levelBadge, { backgroundColor: PLAYER_LEVELS[match.requiredLevel].bg }]}>
            <Text style={[styles.levelText, { color: PLAYER_LEVELS[match.requiredLevel].text }]}>
              {PLAYER_LEVELS[match.requiredLevel].label}
            </Text>
          </View>
        ) : (
          <View style={styles.levelBadgeNeutral}>
            <Text style={styles.levelTextNeutral}>Tous niveaux</Text>
          </View>
        )}

        <View style={[styles.playerCount, isFull && styles.playerCountFull]}>
          <Text style={[styles.playerCountText, isFull && styles.playerCountTextFull]}>
            👥 {match.currentPlayers}/{match.maxPlayers}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sportBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  sportText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  recommendedBadge: {
    backgroundColor: "#D5F5E3",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  recommendedText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1A9B50",
  },
  myMatchBadge: {
    backgroundColor: "#EAFAF1",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  myMatchText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1A9B50",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A2E",
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: "#374151",
    flex: 1,
  },
  infoTextSecondary: {
    fontSize: 13,
    color: "#6B7280",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  levelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  levelText: {
    fontSize: 12,
    fontWeight: "600",
  },
  levelBadgeNeutral: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  levelTextNeutral: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  playerCount: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  playerCountFull: {
    backgroundColor: "#FCE8D5",
  },
  playerCountText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  playerCountTextFull: {
    color: "#935116",
  },
});
