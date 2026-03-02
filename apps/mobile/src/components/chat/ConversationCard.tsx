import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";

interface ConversationCardProps {
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
  onPress: () => void;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `${diffMin}min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}j`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export function ConversationCard({ otherUser, lastMessage, unreadCount, onPress }: ConversationCardProps) {
  const initials = `${otherUser.firstName[0] ?? ""}${otherUser.lastName[0] ?? ""}`.toUpperCase();
  const isUnread = unreadCount > 0;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      {/* Avatar */}
      {otherUser.avatarUrl ? (
        <Image source={{ uri: otherUser.avatarUrl }} style={styles.avatarImg} />
      ) : (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={[styles.name, isUnread && styles.nameUnread]} numberOfLines={1}>
            {otherUser.firstName} {otherUser.lastName}
          </Text>
          {lastMessage && (
            <Text style={styles.time}>{timeAgo(lastMessage.createdAt)}</Text>
          )}
        </View>
        {lastMessage ? (
          <Text style={[styles.preview, isUnread && styles.previewUnread]} numberOfLines={1}>
            {lastMessage.content}
          </Text>
        ) : (
          <Text style={styles.previewEmpty}>Aucun message</Text>
        )}
      </View>

      {/* Badge non-lu */}
      {isUnread && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  avatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EAFAF1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2ECC71",
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1A1A2E",
    flex: 1,
    marginRight: 8,
  },
  nameUnread: {
    fontWeight: "700",
  },
  time: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  preview: {
    fontSize: 13,
    color: "#6B7280",
  },
  previewUnread: {
    color: "#1A1A2E",
    fontWeight: "500",
  },
  previewEmpty: {
    fontSize: 13,
    color: "#9CA3AF",
    fontStyle: "italic",
  },
  badge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#2ECC71",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "white",
  },
});
