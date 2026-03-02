import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  Platform,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps, NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MainStackParamList } from "@/navigation/types";
import { api } from "@/services/api";
import { SPORTS, PLAYER_LEVELS } from "@smashi/shared/constants";
import type { Sport, PlayerLevel } from "@/types";

type Props = NativeStackScreenProps<MainStackParamList, "PlayerProfile">;

interface PublicUser {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  profile?: {
    sports: Sport[];
    primarySport?: Sport | null;
    level: PlayerLevel;
    city?: string | null;
    bio?: string | null;
    totalMatchesPlayed: number;
    isHandisport: boolean;
  } | null;
}

interface CompatibilityResult {
  overall: number;
  levelScore: number;
  proximityScore: number;
  sportScore: number;
  socialScore: number;
}

interface ProfileData {
  user: PublicUser;
  isFavorite: boolean;
  compatibility: CompatibilityResult | null;
}

function getScoreColor(score: number): string {
  if (score >= 70) return "#2ECC71";
  if (score >= 40) return "#F39C12";
  return "#E74C3C";
}

function getScoreBg(score: number): string {
  if (score >= 70) return "#EAFAF1";
  if (score >= 40) return "#FEF9E7";
  return "#FDECEA";
}

export function PlayerProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const route = useRoute<Props["route"]>();
  const { userId } = route.params;

  const [data, setData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavLoading, setIsFavLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get(`/api/users/${userId}`);
      setData(res.data);
    } catch {
      // erreur silencieuse
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchProfile();
    }, [fetchProfile])
  );

  const handleToggleFavorite = async () => {
    if (!data) return;
    setIsFavLoading(true);
    try {
      if (data.isFavorite) {
        await api.delete(`/api/users/${userId}/favorite`);
      } else {
        await api.post(`/api/users/${userId}/favorite`);
      }
      setData((prev) => prev ? { ...prev, isFavorite: !prev.isFavorite } : prev);
    } catch {
      // silencieux
    } finally {
      setIsFavLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2ECC71" />
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.errorEmoji}>😕</Text>
        <Text style={styles.errorTitle}>Joueur introuvable</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Retour</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const { user, isFavorite, compatibility } = data;
  const profile = user.profile;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Profil joueur</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar + Nom */}
        <View style={styles.profileHeader}>
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
          <Text style={styles.playerName}>
            {user.firstName} {user.lastName}
          </Text>
          {profile?.city && (
            <Text style={styles.playerCity}>📍 {profile.city}</Text>
          )}
        </View>

        {/* Score de compatibilité */}
        {compatibility && (
          <View style={[styles.compatCard, { borderColor: getScoreColor(compatibility.overall) + "40" }]}>
            <View style={styles.compatHeader}>
              <View style={[styles.compatCircle, { backgroundColor: getScoreBg(compatibility.overall) }]}>
                <Text style={[styles.compatScore, { color: getScoreColor(compatibility.overall) }]}>
                  {compatibility.overall}%
                </Text>
              </View>
              <View style={styles.compatLabelContainer}>
                <Text style={styles.compatTitle}>Compatibilité</Text>
                <Text style={styles.compatSubtitle}>
                  {compatibility.overall >= 70 ? "Excellent match !" : compatibility.overall >= 40 ? "Bon potentiel" : "Profils différents"}
                </Text>
              </View>
            </View>

            {/* Barres de détail */}
            <View style={styles.compatBars}>
              <ScoreBar label="Niveau" score={compatibility.levelScore} />
              <ScoreBar label="Proximité" score={compatibility.proximityScore} />
              <ScoreBar label="Sports" score={compatibility.sportScore} />
              <ScoreBar label="Social" score={compatibility.socialScore} />
            </View>
          </View>
        )}

        {/* Badges sports */}
        {profile && profile.sports.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sports pratiqués</Text>
            <View style={styles.sportsList}>
              {profile.sports.map((sport) => {
                const s = SPORTS[sport];
                return (
                  <View key={sport} style={[styles.sportBadge, { backgroundColor: s.bg }]}>
                    <Text style={[styles.sportBadgeText, { color: s.text }]}>
                      {s.emoji} {s.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Niveau */}
        {profile && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Niveau</Text>
            <View style={[styles.levelBadge, { backgroundColor: PLAYER_LEVELS[profile.level].bg }]}>
              <Text style={[styles.levelBadgeText, { color: PLAYER_LEVELS[profile.level].text }]}>
                {PLAYER_LEVELS[profile.level].label}
              </Text>
            </View>
          </View>
        )}

        {/* Bio */}
        {profile?.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bio</Text>
            <View style={styles.bioCard}>
              <Text style={styles.bioText}>{profile.bio}</Text>
            </View>
          </View>
        )}

        {/* Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistiques</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{profile?.totalMatchesPlayed ?? 0}</Text>
              <Text style={styles.statLabel}>Parties jouées</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{profile?.sports.length ?? 0}</Text>
              <Text style={styles.statLabel}>Sports</Text>
            </View>
          </View>
        </View>

        {/* Handisport */}
        {profile?.isHandisport && (
          <View style={styles.handisportBadge}>
            <Text style={styles.handisportText}>♿ Joueur handisport</Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.messageBtn}
            onPress={async () => {
              try {
                const { data: convData } = await api.post("/api/conversations", { userId });
                navigation.navigate("ChatConversation", {
                  conversationId: convData.conversation.id,
                  otherUserId: user.id,
                  otherUserName: `${user.firstName} ${user.lastName}`,
                  otherUserAvatar: user.avatarUrl,
                });
              } catch {
                // silencieux
              }
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.messageBtnText}>💬 Envoyer un message</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.proposeBtn}
            onPress={() => {
              const primarySport = profile?.primarySport ?? profile?.sports?.[0];
              const sportLabel = primarySport ? SPORTS[primarySport]?.label ?? primarySport : "sport";
              const msg = `Crée une partie de ${sportLabel} et elle sera proposée à ${user.firstName} !`;
              if (Platform.OS === "web") {
                if (window.confirm(msg + "\n\nAller à la création de partie ?")) {
                  navigation.navigate("Tabs" as any);
                }
              } else {
                Alert.alert(
                  "Proposer une partie",
                  msg,
                  [
                    { text: "Annuler", style: "cancel" },
                    { text: "Créer", onPress: () => navigation.navigate("Tabs" as any) },
                  ]
                );
              }
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.proposeBtnText}>🎾 Proposer une partie</Text>
          </TouchableOpacity>
        </View>

        {/* Bouton favori */}
        <TouchableOpacity
          style={[styles.favButton, isFavorite && styles.favButtonActive]}
          onPress={handleToggleFavorite}
          disabled={isFavLoading}
          activeOpacity={0.8}
        >
          {isFavLoading ? (
            <ActivityIndicator color={isFavorite ? "#E74C3C" : "#fff"} size="small" />
          ) : (
            <Text style={[styles.favButtonText, isFavorite && styles.favButtonTextActive]}>
              {isFavorite ? "♥ Retirer des favoris" : "♡ Ajouter aux favoris"}
            </Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Composant barre de score ────────────────────────────────────

function ScoreBar({ label, score }: { label: string; score: number }) {
  const color = getScoreColor(score);
  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel}>{label}</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${score}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.barValue, { color }]}>{score}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  loadingContainer: {
    flex: 1, alignItems: "center", justifyContent: "center",
    backgroundColor: "#F9FAFB", gap: 16,
  },
  errorEmoji: { fontSize: 48 },
  errorTitle: { fontSize: 18, fontWeight: "700", color: "#1A1A2E" },
  backButton: { marginTop: 16, padding: 12, backgroundColor: "#EAFAF1", borderRadius: 10 },
  backButtonText: { color: "#1A9B50", fontWeight: "600" },
  navBar: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingVertical: 12,
    backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#E5E7EB",
  },
  backBtn: { paddingVertical: 6, paddingRight: 12, width: 60 },
  backBtnText: { fontSize: 15, color: "#2ECC71", fontWeight: "600" },
  navTitle: { fontSize: 16, fontWeight: "700", color: "#1A1A2E" },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 24 },

  // ── Profile header ──
  profileHeader: { alignItems: "center", marginBottom: 24 },
  avatarContainer: { marginBottom: 12 },
  avatar: { width: 88, height: 88, borderRadius: 44 },
  avatarFallback: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: "#D5F5E3", alignItems: "center", justifyContent: "center",
  },
  avatarInitials: { fontSize: 28, fontWeight: "700", color: "#1A9B50" },
  playerName: { fontSize: 22, fontWeight: "700", color: "#1A1A2E", marginBottom: 4 },
  playerCity: { fontSize: 14, color: "#6B7280" },

  // ── Compatibilité ──
  compatCard: {
    backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20,
    borderWidth: 1, marginBottom: 20,
  },
  compatHeader: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 20 },
  compatCircle: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: "center", justifyContent: "center",
  },
  compatScore: { fontSize: 22, fontWeight: "800" },
  compatLabelContainer: { flex: 1 },
  compatTitle: { fontSize: 16, fontWeight: "700", color: "#1A1A2E", marginBottom: 4 },
  compatSubtitle: { fontSize: 13, color: "#6B7280" },
  compatBars: { gap: 10 },

  // ── Score bar ──
  barRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  barLabel: { width: 70, fontSize: 12, color: "#6B7280" },
  barTrack: {
    flex: 1, height: 6, backgroundColor: "#F3F4F6", borderRadius: 3, overflow: "hidden",
  },
  barFill: { height: 6, borderRadius: 3 },
  barValue: { width: 28, fontSize: 12, fontWeight: "600", textAlign: "right" },

  // ── Sections ──
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1A1A2E", marginBottom: 10 },
  sportsList: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  sportBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  sportBadgeText: { fontSize: 13, fontWeight: "600" },
  levelBadge: { alignSelf: "flex-start", paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  levelBadgeText: { fontSize: 13, fontWeight: "700" },
  bioCard: {
    backgroundColor: "#FFFFFF", padding: 14, borderRadius: 12,
    borderWidth: 1, borderColor: "#E5E7EB",
  },
  bioText: { fontSize: 14, color: "#374151", lineHeight: 22 },

  // ── Stats ──
  statsRow: { flexDirection: "row", gap: 12 },
  statCard: {
    flex: 1, backgroundColor: "#FFFFFF", borderRadius: 12, padding: 16,
    alignItems: "center", borderWidth: 1, borderColor: "#E5E7EB",
  },
  statValue: { fontSize: 24, fontWeight: "800", color: "#1A1A2E", marginBottom: 4 },
  statLabel: { fontSize: 12, color: "#6B7280" },

  // ── Handisport ──
  handisportBadge: {
    backgroundColor: "#EBF5FB", padding: 12, borderRadius: 12,
    alignItems: "center", marginBottom: 20,
  },
  handisportText: { fontSize: 14, fontWeight: "600", color: "#2E86C1" },

  // ── Actions ──
  actionButtons: { gap: 10, marginBottom: 16 },
  messageBtn: {
    height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center",
    backgroundColor: "#FFFFFF", borderWidth: 1.5, borderColor: "#2ECC71",
  },
  messageBtnText: { color: "#1A9B50", fontSize: 15, fontWeight: "700" },
  proposeBtn: {
    height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center",
    backgroundColor: "#EAFAF1", borderWidth: 1.5, borderColor: "#2ECC71",
  },
  proposeBtnText: { color: "#1A9B50", fontSize: 15, fontWeight: "700" },

  // ── Bouton favori ──
  favButton: {
    height: 52, borderRadius: 12, alignItems: "center", justifyContent: "center",
    backgroundColor: "#2ECC71",
    shadowColor: "#2ECC71", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  favButtonActive: {
    backgroundColor: "#FFFFFF", borderWidth: 1.5, borderColor: "#E74C3C",
    shadowOpacity: 0,
  },
  favButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  favButtonTextActive: { color: "#E74C3C" },
});
