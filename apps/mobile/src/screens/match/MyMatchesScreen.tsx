import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { api } from "@/services/api";
import { useAuthStore } from "@/stores/authStore";
import { MatchCard } from "@/components/match/MatchCard";
import type { Match } from "@/types";

type ActiveTab = "created" | "joined" | "history";

const ACTIVE_STATUSES = ["OPEN", "FULL", "IN_PROGRESS"];

export function MyMatchesScreen() {
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<ActiveTab>("created");
  const [created, setCreated] = useState<Match[]>([]);
  const [joined, setJoined] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMyMatches = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get("/api/matches/my");
      setCreated(data.created ?? []);
      setJoined(data.joined ?? []);
    } catch {
      setCreated([]);
      setJoined([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchMyMatches();
    }, [fetchMyMatches])
  );

  // Parties actives (OPEN, FULL, IN_PROGRESS)
  const activeCreated = created.filter((m) => ACTIVE_STATUSES.includes(m.status));
  const activeJoined = joined.filter((m) => ACTIVE_STATUSES.includes(m.status));

  // Historique (COMPLETED, CANCELLED) — toutes les parties confondues
  const history = [...created, ...joined]
    .filter((m) => !ACTIVE_STATUSES.includes(m.status))
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

  const currentList = activeTab === "created" ? activeCreated : activeTab === "joined" ? activeJoined : history;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Mes parties</Text>
        <Text style={styles.subtitle}>
          {created.length + joined.length} partie{created.length + joined.length !== 1 ? "s" : ""} au total
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "created" && styles.tabActive]}
          onPress={() => setActiveTab("created")}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === "created" && styles.tabTextActive]}>
            Créées ({activeCreated.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "joined" && styles.tabActive]}
          onPress={() => setActiveTab("joined")}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === "joined" && styles.tabTextActive]}>
            Rejointes ({activeJoined.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "history" && styles.tabActive]}
          onPress={() => setActiveTab("history")}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === "history" && styles.tabTextActive]}>
            Historique ({history.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contenu */}
      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator color="#2ECC71" size="large" />
        </View>
      ) : (
        <FlatList
          data={currentList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MatchCard
              match={item}
              isMyMatch={activeTab === "created"}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>
                {activeTab === "created" ? "🎾" : activeTab === "joined" ? "🏃" : "📋"}
              </Text>
              <Text style={styles.emptyTitle}>
                {activeTab === "created"
                  ? "Tu n'as pas encore créé de partie"
                  : activeTab === "joined"
                  ? "Tu n'as pas encore rejoint de partie"
                  : "Aucune partie terminée"
                }
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === "created"
                  ? "Clique sur le + pour organiser ta première partie !"
                  : activeTab === "joined"
                  ? "Explore les parties disponibles et rejoins-en une !"
                  : "Tes parties terminées apparaîtront ici."
                }
              </Text>
            </View>
          }
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
    paddingBottom: 4,
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
  tabs: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginVertical: 16,
    backgroundColor: "#E5E7EB",
    borderRadius: 10,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  tabTextActive: {
    color: "#1A1A2E",
    fontWeight: "700",
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
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
  },
});
