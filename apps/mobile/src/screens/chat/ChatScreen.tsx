import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { MainStackParamList } from "@/navigation/types";
import { api } from "@/services/api";
import { useAuthStore } from "@/stores/authStore";

type NavProp = NativeStackNavigationProp<MainStackParamList>;
type ChatRouteProp = RouteProp<MainStackParamList, "ChatConversation">;

interface MessageItem {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export function ChatScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<ChatRouteProp>();
  const { conversationId, otherUserId, otherUserName, otherUserAvatar } = route.params;
  const { user } = useAuthStore();

  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMessages = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    try {
      const { data } = await api.get(`/api/conversations/${conversationId}/messages`, {
        params: { page: pageNum, limit: 30 },
      });
      if (append) {
        setMessages((prev) => [...data.messages, ...prev]);
      } else {
        setMessages(data.messages);
      }
      setHasMore(data.hasMore);
      setPage(data.page);
    } catch {
      // Silencieux
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  // Initial load
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Polling toutes les 5 secondes
  useEffect(() => {
    pollingRef.current = setInterval(() => {
      fetchMessages(1, false);
    }, 5000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [fetchMessages]);

  const handleSend = async () => {
    if (!text.trim() || isSending) return;

    const content = text.trim();
    setText("");
    setIsSending(true);

    try {
      const { data } = await api.post(`/api/conversations/${conversationId}/messages`, { content });
      setMessages((prev) => [...prev, data.message]);
    } catch {
      setText(content); // Restore text on error
    } finally {
      setIsSending(false);
    }
  };

  const handleLoadMore = () => {
    if (!hasMore || isLoading) return;
    fetchMessages(page + 1, true);
  };

  const renderMessage = ({ item }: { item: MessageItem }) => {
    const isMe = item.senderId === user?.id;
    return (
      <View style={[styles.messageBubbleWrap, isMe ? styles.myMessageWrap : styles.theirMessageWrap]}>
        <View style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble]}>
          <Text style={[styles.bubbleText, isMe ? styles.myBubbleText : styles.theirBubbleText]}>
            {item.content}
          </Text>
          <Text style={[styles.bubbleTime, isMe ? styles.myBubbleTime : styles.theirBubbleTime]}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerProfile}
          onPress={() => navigation.navigate("PlayerProfile", { userId: otherUserId })}
          activeOpacity={0.7}
        >
          {otherUserAvatar ? (
            <Image source={{ uri: otherUserAvatar }} style={styles.headerAvatarImg} />
          ) : (
            <View style={styles.headerAvatar}>
              <Text style={styles.headerAvatarText}>
                {otherUserName.split(" ").map((n) => n[0]).join("").toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={styles.headerName} numberOfLines={1}>{otherUserName}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        {isLoading ? (
          <View style={styles.loader}>
            <ActivityIndicator color="#2ECC71" size="large" />
          </View>
        ) : (
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onStartReached={handleLoadMore}
            onStartReachedThreshold={0.1}
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                <Text style={styles.emptyChatText}>Envoie le premier message !</Text>
              </View>
            }
          />
        )}

        {/* Input */}
        <SafeAreaView edges={["bottom"]} style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Écris un message..."
            placeholderTextColor="#9CA3AF"
            value={text}
            onChangeText={setText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || isSending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || isSending}
          >
            <Text style={styles.sendBtnText}>→</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backBtn: {
    padding: 4,
    marginRight: 8,
  },
  backText: {
    fontSize: 24,
    color: "#1A1A2E",
  },
  headerProfile: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerAvatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EAFAF1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  headerAvatarText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2ECC71",
  },
  headerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A2E",
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  messageBubbleWrap: {
    marginBottom: 8,
  },
  myMessageWrap: {
    alignItems: "flex-end",
  },
  theirMessageWrap: {
    alignItems: "flex-start",
  },
  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  myBubble: {
    backgroundColor: "#2ECC71",
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myBubbleText: {
    color: "#FFFFFF",
  },
  theirBubbleText: {
    color: "#1A1A2E",
  },
  bubbleTime: {
    fontSize: 10,
    marginTop: 4,
  },
  myBubbleTime: {
    color: "rgba(255,255,255,0.7)",
    textAlign: "right",
  },
  theirBubbleTime: {
    color: "#9CA3AF",
  },
  emptyChat: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  emptyChatText: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: "#1A1A2E",
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2ECC71",
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    backgroundColor: "#D1D5DB",
  },
  sendBtnText: {
    fontSize: 20,
    color: "white",
    fontWeight: "700",
  },
});
