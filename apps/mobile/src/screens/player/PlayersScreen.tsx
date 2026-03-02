import { useState, useCallback } from "react";
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { api } from "@/services/api";
import { SPORTS, PLAYER_LEVELS } from "@smashi/shared/constants";
import type { TabToMainNavProp } from "@/navigation/types";
import type { Sport, PlayerLevel } from "@/types";

interface PlayerSuggestion {
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

export function PlayersScreen() {
  const navigation = useNavigation<TabToMainNavProp>();

  const [suggestions, setSuggestions] = useState<PlayerSuggestion[]>([]);
  const [favorites, setFavorites] = useState<PlayerSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sugRes, favRes] = await Promise.all([
        api.get("/api/users/suggestions", { params: { limit: 20 } }),
        api.get("/api/users/favorites"),
      ]);
      setSuggestions(sugRes.data.suggestions ?? []);
      setFavorites(favRes.data.favorites ?? []);
    } catch {
      // silencieux
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const sections = [
    ...(favorites.length > 0
      ? [{ title: `Mes favoris (${favorites.length})`, data: favorites }]
      : []),
    ...(suggestions.length > 0
      ? [{ title: "Joueurs compatibles", data: suggestions }]
      : []),
  ];

  const renderItem = ({ item }: { item: PlayerSuggestion }) => {
    const { user, compatibility } = item;
    const profile = user.profile;
    const primarySport = profile?.primarySport;
    const sport = primarySport ? SPORTS[primarySport] : null;
    const level = profile ? PLAYER_LEVELS[profile.level] : null;
    const scoreColor = getScoreColor(compatibility.overall);

    return (
      <TouchableOpacity
        style={styles.playerRow}
        activeOpacity={0.7}
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
        </View>

        {/* Infos */}
        <View style={styles.playerInfo}>
          <Text style={styles.playerName} numberOfLines={1}>
            {user.firstName} {user.lastName}
          </Text>
          <View style={styles.playerMeta}>
            {profile?.city && (
              <Text style={styles.playerCity} numberOfLines={1}>
                {profile.city}
              </Text>
            )}
            {sport && (
              <View style={[styles.badge, { backgroundColor: sport.bg }]}>
                <Text style={[styles.badgeText, { color: sport.text }]}>
                  {sport.emoji} {sport.label}
                </Text>
              </View>
            )}
            {level && (
              <View style={[styles.badge, { backgroundColor: level.bg }]}>
                <Text style={[styles.badgeText, { color: level.text }]}>
                  {level.label}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Score */}
        <View style={[styles.scoreCircle, { borderColor: scoreColor }]}>
          <Text style={[styles.scoreText, { color: scoreColor }]}>
            {compatibility.overall}%
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Joueurs</Text>
        <View style={{ width: 60 }} />
      </View>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator color="#2ECC71" size="large" />
        </View>
      ) : sections.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>👥</Text>
          <Text style={styles.emptyTitle}>Aucun joueur trouvé</Text>
          <Text style={styles.emptySubtitle}>
            Assure-toi que ton profil est complet (sport, niveau, ville) pour voir des suggestions.
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.user.id}
          renderItem={renderItem}
          renderSectionHeader={({ section: { title } }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{title}</Text>
            </View>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingVertical: 12,
    backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#E5E7EB",
  },
  backBtn: { paddingVertical: 6, paddingRight: 12, width: 60 },
  backBtnText: { fontSize: 15, color: "#2ECC71", fontWeight: "600" },
  title: { fontSize: 18, fontWeight: "700", color: "#1A1A2E" },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { paddingBottom: 32 },
  sectionHeader: {
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8,
    backgroundColor: "#F9FAFB",
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1A1A2E" },
  playerRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#FFFFFF", paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: "#F3F4F6",
  },
  avatarContainer: {},
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarFallback: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: "#D5F5E3", alignItems: "center", justifyContent: "center",
  },
  avatarInitials: { fontSize: 16, fontWeight: "700", color: "#1A9B50" },
  playerInfo: { flex: 1 },
  playerName: { fontSize: 15, fontWeight: "600", color: "#1A1A2E", marginBottom: 4 },
  playerMeta: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  playerCity: { fontSize: 12, color: "#6B7280" },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: "600" },
  scoreCircle: {
    width: 48, height: 48, borderRadius: 24,
    borderWidth: 2, alignItems: "center", justifyContent: "center",
    backgroundColor: "#FAFAFA",
  },
  scoreText: { fontSize: 13, fontWeight: "800" },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#1A1A2E", marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: "#6B7280", textAlign: "center", lineHeight: 20 },
});
