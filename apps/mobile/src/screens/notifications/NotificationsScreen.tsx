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
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { api } from "@/services/api";
import type { TabToMainNavProp } from "@/navigation/types";

interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: { matchId?: string } | null;
  isRead: boolean;
  createdAt: string;
}

// Icône et couleur par type de notification
const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  REQUEST_RECEIVED:  { icon: "🔔", color: "#1A9B50", bg: "#EAFAF1" },
  REQUEST_ACCEPTED:  { icon: "✅", color: "#1A9B50", bg: "#EAFAF1" },
  REQUEST_REJECTED:  { icon: "❌", color: "#922B21", bg: "#FDECEA" },
  MATCH_FULL:        { icon: "🎯", color: "#935116", bg: "#FCE8D5" },
  MATCH_REMINDER:    { icon: "⏰", color: "#1B4F72", bg: "#D6EAF8" },
  MATCH_COMPLETED:   { icon: "🏆", color: "#6B7280", bg: "#F3F4F6" },
  MATCH_SUGGESTION:  { icon: "💡", color: "#1A9B50", bg: "#EAFAF1" },
  GENERAL:           { icon: "ℹ️",  color: "#374151", bg: "#F3F4F6" },
};

function formatTimeAgo(isoString: string): string {
  const diff = (Date.now() - new Date(isoString).getTime()) / 1000;
  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
  return `Il y a ${Math.floor(diff / 86400)} j`;
}

export function NotificationsScreen() {
  const navigation = useNavigation<TabToMainNavProp>();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);

  const fetchNotifications = useCallback(async (p = 1, append = false) => {
    try {
      const { data } = await api.get("/api/notifications", { params: { page: p, limit: 20 } });
      if (append) {
        setNotifications((prev) => [...prev, ...data.notifications]);
      } else {
        setNotifications(data.notifications);
      }
      setUnreadCount(data.unreadCount);
      setHasMore(data.hasMore);
      setPage(data.page);
    } catch {
      // silencieux
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchNotifications(1, false);
    }, [fetchNotifications])
  );

  const handleMarkAllRead = async () => {
    try {
      await api.patch("/api/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // silencieux
    }
  };

  const handleTap = async (notif: AppNotification) => {
    // Marquer comme lue
    if (!notif.isRead) {
      try {
        await api.patch(`/api/notifications/${notif.id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        // silencieux
      }
    }
    // Naviguer vers la partie si disponible
    if (notif.data?.matchId) {
      navigation.navigate("MatchDetail", { matchId: notif.data.matchId });
    }
  };

  const renderItem = ({ item }: { item: AppNotification }) => {
    const cfg = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.GENERAL;
    return (
      <TouchableOpacity
        style={[styles.item, !item.isRead && styles.itemUnread]}
        onPress={() => handleTap(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: cfg.bg }]}>
          <Text style={styles.icon}>{cfg.icon}</Text>
        </View>
        <View style={styles.itemContent}>
          <View style={styles.itemHeader}>
            <Text style={[styles.itemTitle, !item.isRead && styles.itemTitleUnread]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.itemTime}>{formatTimeAgo(item.createdAt)}</Text>
          </View>
          <Text style={styles.itemBody} numberOfLines={2}>{item.body}</Text>
        </View>
        {!item.isRead && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>← Retour</Text>
          </TouchableOpacity>
          <Text style={styles.title}>
            Notifications
            {unreadCount > 0 && (
              <Text style={styles.unreadBadge}> ({unreadCount})</Text>
            )}
          </Text>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={styles.markAllBtn}>Tout lire</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator color="#2ECC71" size="large" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onEndReached={() => {
            if (hasMore && !isLoading) fetchNotifications(page + 1, true);
          }}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🔔</Text>
              <Text style={styles.emptyTitle}>Aucune notification</Text>
              <Text style={styles.emptySubtitle}>
                Tes notifications apparaîtront ici quand tu reçois des demandes ou des confirmations.
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerLeft: {
    flexDirection: "column",
    gap: 2,
  },
  backBtn: {
    paddingVertical: 2,
  },
  backBtnText: {
    fontSize: 14,
    color: "#2ECC71",
    fontWeight: "600",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A2E",
  },
  unreadBadge: {
    color: "#2ECC71",
    fontSize: 18,
  },
  markAllBtn: {
    fontSize: 14,
    color: "#2ECC71",
    fontWeight: "600",
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    paddingTop: 8,
    paddingBottom: 32,
  },
  item: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  itemUnread: {
    backgroundColor: "#FAFFFE",
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  icon: {
    fontSize: 20,
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
    gap: 8,
  },
  itemTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  itemTitleUnread: {
    fontWeight: "700",
    color: "#1A1A2E",
  },
  itemTime: {
    fontSize: 12,
    color: "#9CA3AF",
    flexShrink: 0,
  },
  itemBody: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2ECC71",
    marginTop: 4,
    flexShrink: 0,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
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
