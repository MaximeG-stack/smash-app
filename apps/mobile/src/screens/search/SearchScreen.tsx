import { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { api } from "@/services/api";
import { useAuthStore } from "@/stores/authStore";
import { MatchCard } from "@/components/match/MatchCard";
import { MatchMapView } from "@/components/map/MatchMapView";
import type { Match, Sport, PlayerLevel } from "@/types";
import { SPORTS, PLAYER_LEVELS } from "@smashi/shared/constants";

const SPORT_OPTIONS: Array<{ value: Sport | null; label: string; emoji: string }> = [
  { value: null, label: "Tous", emoji: "🏅" },
  { value: "TENNIS", label: "Tennis", emoji: "🎾" },
  { value: "PADEL", label: "Padel", emoji: "🏓" },
  { value: "SQUASH", label: "Squash", emoji: "🟠" },
];

const LEVEL_OPTIONS: Array<{ value: PlayerLevel | null; label: string }> = [
  { value: null, label: "Tous niveaux" },
  { value: "BEGINNER", label: "Débutant" },
  { value: "INTERMEDIATE", label: "Intermédiaire" },
  { value: "ADVANCED", label: "Avancé" },
  { value: "EXPERT", label: "Expert" },
];

const LEVEL_ORDER_LIST = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"];

export function SearchScreen() {
  const { user } = useAuthStore();
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  const isMatchRecommended = (match: Match): boolean => {
    if (!user?.profile) return false;
    const userSports = user.profile.sports ?? [];
    const userLevel = user.profile.level;
    if (!userSports.includes(match.sport)) return false;
    if (!match.requiredLevel || !userLevel) return true;
    const diff = Math.abs(LEVEL_ORDER_LIST.indexOf(match.requiredLevel) - LEVEL_ORDER_LIST.indexOf(userLevel));
    return diff <= 1;
  };

  const [searchText, setSearchText] = useState("");
  const [selectedSport, setSelectedSport] = useState<Sport | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<PlayerLevel | null>(null);
  const [showLevelFilter, setShowLevelFilter] = useState(false);

  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ref pour que useFocusEffect lise toujours les filtres courants (évite la stale closure)
  const filtersRef = useRef<{ sport: Sport | null; level: PlayerLevel | null; search: string }>({
    sport: null,
    level: null,
    search: "",
  });
  filtersRef.current = { sport: selectedSport, level: selectedLevel, search: searchText };

  const fetchMatches = useCallback(async (opts: {
    sport?: Sport | null;
    level?: PlayerLevel | null;
    search?: string;
    page?: number;
    append?: boolean;
  } = {}) => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {
        status: "OPEN",
        page: String(opts.page ?? 1),
        limit: "20",
        sort: "smart",
      };

      if (opts.sport) params.sport = opts.sport;
      if (opts.level) params.level = opts.level;
      if (opts.search?.trim()) params.search = opts.search.trim();

      // Filtre géographique basé sur le profil
      if (user?.profile?.latitude && user?.profile?.longitude) {
        params.lat = String(user.profile.latitude);
        params.lng = String(user.profile.longitude);
        params.radius = String(user.profile.searchRadius ?? 20);
      }

      const { data } = await api.get("/api/matches", { params });

      if (opts.append) {
        setMatches((prev) => [...prev, ...data.matches]);
      } else {
        setMatches(data.matches);
      }
      setTotal(data.total);
      setHasMore(data.hasMore);
      setPage(data.page);
    } catch {
      // Silencieux
    } finally {
      setIsLoading(false);
    }
  }, [user?.profile]);

  // Recharger quand l'écran reçoit le focus en conservant les filtres actifs
  useFocusEffect(
    useCallback(() => {
      const { sport, level, search } = filtersRef.current;
      fetchMatches({ sport, level, search, page: 1 });
    }, [fetchMatches])
  );

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchMatches({ sport: selectedSport, level: selectedLevel, search: text, page: 1 });
    }, 400);
  };

  const handleSportChange = (sport: Sport | null) => {
    setSelectedSport(sport);
    fetchMatches({ sport, level: selectedLevel, search: searchText, page: 1 });
  };

  const handleLevelChange = (level: PlayerLevel | null) => {
    setSelectedLevel(level);
    setShowLevelFilter(false);
    fetchMatches({ sport: selectedSport, level, search: searchText, page: 1 });
  };

  const handleLoadMore = () => {
    if (!hasMore || isLoading) return;
    const nextPage = page + 1;
    fetchMatches({ sport: selectedSport, level: selectedLevel, search: searchText, page: nextPage, append: true });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Rechercher</Text>
            <Text style={styles.subtitle}>
              {total > 0 ? `${total} partie${total > 1 ? "s" : ""} disponible${total > 1 ? "s" : ""}` : "Aucune partie trouvée"}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.viewToggleBtn}
            onPress={() => setViewMode((v) => (v === "list" ? "map" : "list"))}
            activeOpacity={0.7}
          >
            <Text style={styles.viewToggleText}>
              {viewMode === "list" ? "🗺️ Carte" : "📋 Liste"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Barre de recherche */}
      <View style={styles.searchBarContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Lieu, club, ville..."
          placeholderTextColor="#9CA3AF"
          value={searchText}
          onChangeText={handleSearchChange}
          returnKeyType="search"
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => handleSearchChange("")}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filtres sport */}
      <View style={styles.sportFilters}>
        {SPORT_OPTIONS.map((opt) => {
          const isSelected = selectedSport === opt.value;
          return (
            <TouchableOpacity
              key={String(opt.value)}
              style={[styles.sportChip, isSelected && styles.sportChipSelected]}
              onPress={() => handleSportChange(opt.value)}
              activeOpacity={0.7}
            >
              <Text style={[styles.sportChipText, isSelected && styles.sportChipTextSelected]}>
                {opt.emoji} {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Filtre niveau */}
        <TouchableOpacity
          style={[styles.levelFilterBtn, selectedLevel && styles.levelFilterBtnActive]}
          onPress={() => setShowLevelFilter(!showLevelFilter)}
          activeOpacity={0.7}
        >
          <Text style={[styles.levelFilterText, selectedLevel && styles.levelFilterTextActive]}>
            {selectedLevel ? PLAYER_LEVELS[selectedLevel].label : "Niveau"} ▾
          </Text>
        </TouchableOpacity>
      </View>

      {/* Dropdown niveau */}
      {showLevelFilter && (
        <View style={styles.levelDropdown}>
          {LEVEL_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={String(opt.value)}
              style={[styles.levelOption, selectedLevel === opt.value && styles.levelOptionSelected]}
              onPress={() => handleLevelChange(opt.value)}
            >
              <Text style={[styles.levelOptionText, selectedLevel === opt.value && styles.levelOptionTextSelected]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Vue liste ou carte */}
      {viewMode === "list" ? (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MatchCard match={item} isRecommended={isMatchRecommended(item)} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            isLoading ? null : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🔍</Text>
                <Text style={styles.emptyTitle}>Aucune partie trouvée</Text>
                <Text style={styles.emptySubtitle}>
                  Essaie d'autres filtres ou crée la première partie !
                </Text>
              </View>
            )
          }
          ListFooterComponent={
            isLoading ? (
              <View style={styles.loader}>
                <ActivityIndicator color="#2ECC71" size="small" />
              </View>
            ) : hasMore ? (
              <TouchableOpacity style={styles.loadMoreBtn} onPress={handleLoadMore}>
                <Text style={styles.loadMoreText}>Charger plus</Text>
              </TouchableOpacity>
            ) : null
          }
        />
      ) : (
        <MatchMapView
          matches={matches}
          userLatitude={user?.profile?.latitude}
          userLongitude={user?.profile?.longitude}
          isMatchRecommended={isMatchRecommended}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1A2E",
  },
  subtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  viewToggleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#EAFAF1",
    borderWidth: 1.5,
    borderColor: "#2ECC71",
  },
  viewToggleText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1A9B50",
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 14,
    height: 46,
    gap: 8,
  },
  searchIcon: { fontSize: 16 },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#1A1A2E",
    height: "100%",
  },
  clearBtn: {
    fontSize: 14,
    color: "#9CA3AF",
    padding: 4,
  },
  sportFilters: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 8,
    flexWrap: "wrap",
  },
  sportChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  sportChipSelected: {
    backgroundColor: "#EAFAF1",
    borderColor: "#2ECC71",
  },
  sportChipText: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "500",
  },
  sportChipTextSelected: {
    color: "#1A9B50",
    fontWeight: "700",
  },
  levelFilterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  levelFilterBtnActive: {
    backgroundColor: "#EAFAF1",
    borderColor: "#2ECC71",
  },
  levelFilterText: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "500",
  },
  levelFilterTextActive: {
    color: "#1A9B50",
    fontWeight: "700",
  },
  levelDropdown: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  levelOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  levelOptionSelected: {
    backgroundColor: "#EAFAF1",
  },
  levelOptionText: {
    fontSize: 14,
    color: "#374151",
  },
  levelOptionTextSelected: {
    color: "#1A9B50",
    fontWeight: "600",
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: {
    fontSize: 18,
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
  },
  loader: {
    padding: 20,
    alignItems: "center",
  },
  loadMoreBtn: {
    margin: 16,
    padding: 12,
    backgroundColor: "#EAFAF1",
    borderRadius: 10,
    alignItems: "center",
  },
  loadMoreText: {
    color: "#1A9B50",
    fontWeight: "600",
    fontSize: 14,
  },
});
