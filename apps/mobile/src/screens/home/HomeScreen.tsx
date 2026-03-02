import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/services/api";
import { MatchCard } from "@/components/match/MatchCard";
import { PlayerCard } from "@/components/player/PlayerCard";
import type { Match } from "@/types";
import type { HomeStackNavProp } from "@/navigation/types";

interface Suggestion {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
    profile?: {
      sports: string[];
      primarySport?: string | null;
      level: string;
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

export function HomeScreen() {
  const { user } = useAuthStore();
  const navigation = useNavigation<HomeStackNavProp>();

  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [msgUnreadCount, setMsgUnreadCount] = useState(0);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [matchSuggestions, setMatchSuggestions] = useState<(Match & { isRecommended?: boolean })[]>([]);

  const fetchNearbyMatches = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {
        status: "OPEN",
        limit: "10",
      };

      if (user?.profile?.latitude && user?.profile?.longitude) {
        params.lat = String(user.profile.latitude);
        params.lng = String(user.profile.longitude);
        params.radius = String(user.profile.searchRadius ?? 20);
      }

      if (user?.profile?.primarySport) {
        params.sport = user.profile.primarySport;
      }

      const { data } = await api.get("/api/matches", { params });
      setMatches(data.matches ?? []);
    } catch {
      setMatches([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.profile]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data } = await api.get("/api/notifications", { params: { page: 1, limit: 1 } });
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // silencieux
    }
    try {
      const { data } = await api.get("/api/conversations/unread-count");
      setMsgUnreadCount(data.unreadCount ?? 0);
    } catch {
      // silencieux
    }
  }, []);

  const fetchSuggestions = useCallback(async () => {
    try {
      const { data } = await api.get("/api/users/suggestions", { params: { limit: 8 } });
      setSuggestions(data.suggestions ?? []);
    } catch {
      setSuggestions([]);
    }
  }, []);

  const fetchMatchSuggestions = useCallback(async () => {
    try {
      const { data } = await api.get("/api/matches/suggestions", { params: { limit: 5 } });
      setMatchSuggestions(data.suggestions ?? []);
    } catch {
      setMatchSuggestions([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchNearbyMatches();
      fetchUnreadCount();
      fetchSuggestions();
      fetchMatchSuggestions();
    }, [fetchNearbyMatches, fetchUnreadCount, fetchSuggestions, fetchMatchSuggestions])
  );

  const LEVEL_ORDER = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"];

  const isMatchRecommended = (match: Match): boolean => {
    if (!user?.profile) return false;
    const userSports = user.profile.sports ?? [];
    const userLevel = user.profile.level;
    if (!userSports.includes(match.sport)) return false;
    if (!match.requiredLevel || !userLevel) return true;
    const diff = Math.abs(LEVEL_ORDER.indexOf(match.requiredLevel) - LEVEL_ORDER.indexOf(userLevel));
    return diff <= 1;
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bonjour";
    if (hour < 18) return "Bon après-midi";
    return "Bonsoir";
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={matches}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MatchCard match={item} isRecommended={isMatchRecommended(item)} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.greeting}>
                  {greeting()} {user?.firstName} 👋
                </Text>
                <Text style={styles.subtitle}>Que veux-tu jouer aujourd'hui ?</Text>
              </View>
              <View style={styles.headerIcons}>
                <TouchableOpacity
                  style={styles.bellBtn}
                  onPress={() => navigation.navigate("Conversations")}
                  activeOpacity={0.7}
                >
                  <Text style={styles.bellIcon}>💬</Text>
                  {msgUnreadCount > 0 && (
                    <View style={styles.bellBadge}>
                      <Text style={styles.bellBadgeText}>
                        {msgUnreadCount > 9 ? "9+" : String(msgUnreadCount)}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.bellBtn}
                  onPress={() => navigation.navigate("Notifications")}
                  activeOpacity={0.7}
                >
                  <Text style={styles.bellIcon}>🔔</Text>
                  {unreadCount > 0 && (
                    <View style={styles.bellBadge}>
                      <Text style={styles.bellBadgeText}>
                        {unreadCount > 9 ? "9+" : String(unreadCount)}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Bouton créer une partie */}
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => navigation.navigate("CreateMatch" as never)}
              activeOpacity={0.8}
            >
              <Text style={styles.createBtnEmoji}>+</Text>
              <View>
                <Text style={styles.createBtnTitle}>Créer une partie</Text>
                <Text style={styles.createBtnSubtitle}>Trouve des partenaires près de toi</Text>
              </View>
            </TouchableOpacity>

            {/* Suggestions de joueurs */}
            {suggestions.length > 0 && (
              <View style={styles.suggestionsSection}>
                <View style={styles.suggestionsTitleRow}>
                  <Text style={styles.sectionTitle}>Joueurs compatibles</Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate("Players")}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.seeAllLink}>Voir tous →</Text>
                  </TouchableOpacity>
                </View>
                <FlatList
                  horizontal
                  data={suggestions}
                  keyExtractor={(item) => item.user.id}
                  renderItem={({ item }) => (
                    <PlayerCard user={item.user as never} compatibility={item.compatibility} />
                  )}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.suggestionsListContent}
                />
              </View>
            )}

            {/* Parties recommandées */}
            {matchSuggestions.length > 0 && (
              <View style={styles.matchSuggestionsSection}>
                <Text style={styles.sectionTitle}>Parties recommandées pour toi</Text>
                {matchSuggestions.map((m) => (
                  <MatchCard key={m.id} match={m} isRecommended={m.isRecommended} />
                ))}
              </View>
            )}

            {/* Titre section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {user?.profile?.primarySport
                  ? `Parties de ${user.profile.primarySport === "TENNIS" ? "Tennis" : user.profile.primarySport === "PADEL" ? "Padel" : "Squash"} près de toi`
                  : "Parties disponibles près de toi"
                }
              </Text>
              {isLoading && <ActivityIndicator color="#2ECC71" size="small" />}
            </View>
          </View>
        }
        ListEmptyComponent={
          isLoading ? null : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>🎾</Text>
              <Text style={styles.emptyTitle}>
                Aucune partie disponible pour l'instant
              </Text>
              <Text style={styles.emptySubtitle}>
                Sois le premier à créer une partie dans ta zone !
              </Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => navigation.navigate("CreateMatch" as never)}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyBtnText}>Créer une partie</Text>
              </TouchableOpacity>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginTop: 4,
  },
  bellIcon: {
    fontSize: 20,
  },
  bellBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#E74C3C",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  bellBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  greeting: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1A2E",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#2ECC71",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#2ECC71",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createBtnEmoji: {
    fontSize: 28,
    color: "#FFFFFF",
    fontWeight: "700",
    width: 44,
    height: 44,
    textAlign: "center",
    lineHeight: 44,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 22,
    overflow: "hidden",
  },
  createBtnTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  createBtnSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    marginTop: 2,
  },
  matchSuggestionsSection: {
    marginBottom: 8,
  },
  suggestionsSection: {
    marginBottom: 24,
  },
  suggestionsTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  seeAllLink: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2ECC71",
    marginBottom: 12,
  },
  suggestionsListContent: {
    gap: 12,
    paddingTop: 4,
    paddingBottom: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A2E",
    marginBottom: 12,
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1A1A2E",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyBtn: {
    backgroundColor: "#2ECC71",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptyBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
});
