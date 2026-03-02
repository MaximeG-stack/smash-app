import { useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MainStackParamList } from "@/navigation/types";
import { api } from "@/services/api";
import { ConversationCard } from "@/components/chat/ConversationCard";

type NavProp = NativeStackNavigationProp<MainStackParamList>;

interface ConversationItem {
  id: string;
  otherUser: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
  };
  lastMessage: {
    content: string;
    senderId: string;
    createdAt: string;
  } | null;
  unreadCount: number;
}

export function ConversationsScreen() {
  const navigation = useNavigation<NavProp>();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchConversations = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get("/api/conversations");
      setConversations(data.conversations);
    } catch {
      // Silencieux
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchConversations();
    }, [fetchConversations])
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Messages</Text>
            <Text style={styles.subtitle}>
              {conversations.length > 0
                ? `${conversations.length} conversation${conversations.length > 1 ? "s" : ""}`
                : ""}
            </Text>
          </View>
        </View>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ConversationCard
            otherUser={item.otherUser}
            lastMessage={item.lastMessage}
            unreadCount={item.unreadCount}
            onPress={() =>
              navigation.navigate("ChatConversation", {
                conversationId: item.id,
                otherUserId: item.otherUser.id,
                otherUserName: `${item.otherUser.firstName} ${item.otherUser.lastName}`,
                otherUserAvatar: item.otherUser.avatarUrl,
              })
            }
          />
        )}
        contentContainerStyle={conversations.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loader}>
              <ActivityIndicator color="#2ECC71" size="large" />
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>💬</Text>
              <Text style={styles.emptyTitle}>Aucune conversation</Text>
              <Text style={styles.emptySubtitle}>
                Envoie un message à un joueur depuis son profil !
              </Text>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  backText: {
    fontSize: 24,
    color: "#1A1A2E",
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
  emptyContainer: {
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
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
});
