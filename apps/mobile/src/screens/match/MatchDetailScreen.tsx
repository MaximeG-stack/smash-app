import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps, NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MainStackParamList } from "@/navigation/types";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/services/api";
import type { Match, MatchPlayer } from "@/types";
import { SPORTS, PLAYER_LEVELS, MATCH_STATUS_LABELS } from "@smashi/shared/constants";
import { formatMatchDate, formatDuration } from "@/lib/dateUtils";

type Props = NativeStackScreenProps<MainStackParamList, "MatchDetail">;

interface PendingRequest {
  id: string;
  userId: string;
  user: { id: string; firstName: string; lastName: string; avatarUrl?: string | null };
  status: string;
  message?: string | null;
}

interface MatchDetailData {
  match: Match & { players?: MatchPlayer[] };
  isCreator: boolean;
  isPlayer: boolean;
  myRequest: { id: string; status: string } | null;
  pendingRequests: PendingRequest[];
  myFeedback?: { levelRating: string; overallRating?: number; fairPlayRating?: number | null; punctualityRating?: number | null; ambianceRating?: number | null; comment?: string | null } | null;
}

const FEEDBACK_LABELS: Record<string, { emoji: string; label: string }> = {
  TOO_LOW: { emoji: "😓", label: "Trop faible" },
  BALANCED: { emoji: "⚖️", label: "Équilibré" },
  TOO_HIGH: { emoji: "💪", label: "Trop élevé" },
};

export function MatchDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const route = useRoute<Props["route"]>();
  const { matchId } = route.params;
  const { user } = useAuthStore();

  const [data, setData] = useState<MatchDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  // Suivi de l'ID de la demande en cours d'acceptation/refus
  const [processingReqId, setProcessingReqId] = useState<string | null>(null);

  const fetchMatch = useCallback(async () => {
    try {
      const res = await api.get(`/api/matches/${matchId}`);
      setData(res.data);
    } catch {
      // Partie introuvable ou erreur réseau
    } finally {
      setIsLoading(false);
    }
  }, [matchId]);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchMatch();
    }, [fetchMatch])
  );

  // ── Actions joueur ──────────────────────────────────────────

  const handleJoin = async () => {
    setIsActionLoading(true);
    try {
      await api.post(`/api/matches/${matchId}/join`);
      await fetchMatch();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Erreur lors de l'envoi de la demande";
      if (Platform.OS === "web") window.alert(msg);
      else Alert.alert("Erreur", msg);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleLeave = async () => {
    const confirm =
      Platform.OS === "web"
        ? window.confirm("Quitter cette partie ?")
        : await new Promise<boolean>((resolve) =>
            Alert.alert("Quitter la partie", "Tu vas quitter cette partie. Confirmer ?", [
              { text: "Annuler", style: "cancel", onPress: () => resolve(false) },
              { text: "Quitter", style: "destructive", onPress: () => resolve(true) },
            ])
          );
    if (!confirm) return;
    setIsActionLoading(true);
    try {
      await api.post(`/api/matches/${matchId}/leave`);
      await fetchMatch();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Erreur";
      if (Platform.OS === "web") window.alert(msg);
      else Alert.alert("Erreur", msg);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCancel = async () => {
    const confirm =
      Platform.OS === "web"
        ? window.confirm("Annuler définitivement cette partie ?")
        : await new Promise<boolean>((resolve) =>
            Alert.alert(
              "Annuler la partie",
              "Cette action est irréversible. Les joueurs inscrits seront informés.",
              [
                { text: "Garder", style: "cancel", onPress: () => resolve(false) },
                { text: "Annuler la partie", style: "destructive", onPress: () => resolve(true) },
              ]
            )
          );
    if (!confirm) return;
    setIsActionLoading(true);
    try {
      await api.delete(`/api/matches/${matchId}`);
      navigation.goBack();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Erreur";
      if (Platform.OS === "web") window.alert(msg);
      else Alert.alert("Erreur", msg);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleComplete = async () => {
    const confirm =
      Platform.OS === "web"
        ? window.confirm("Terminer cette partie ? Les joueurs pourront donner leur avis.")
        : await new Promise<boolean>((resolve) =>
            Alert.alert(
              "Terminer la partie",
              "Les joueurs seront invités à donner leur avis sur le niveau du match.",
              [
                { text: "Annuler", style: "cancel", onPress: () => resolve(false) },
                { text: "Terminer", onPress: () => resolve(true) },
              ]
            )
          );
    if (!confirm) return;
    setIsActionLoading(true);
    try {
      await api.post(`/api/matches/${matchId}/complete`);
      await fetchMatch();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Erreur";
      if (Platform.OS === "web") window.alert(msg);
      else Alert.alert("Erreur", msg);
    } finally {
      setIsActionLoading(false);
    }
  };

  // ── Actions créateur : accept/reject ────────────────────────

  const handleAccept = async (reqId: string) => {
    setProcessingReqId(reqId);
    try {
      await api.post(`/api/matches/${matchId}/requests/${reqId}/accept`);
      await fetchMatch();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Erreur";
      if (Platform.OS === "web") window.alert(msg);
      else Alert.alert("Erreur", msg);
    } finally {
      setProcessingReqId(null);
    }
  };

  const handleReject = async (reqId: string) => {
    setProcessingReqId(reqId);
    try {
      await api.post(`/api/matches/${matchId}/requests/${reqId}/reject`);
      await fetchMatch();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Erreur";
      if (Platform.OS === "web") window.alert(msg);
      else Alert.alert("Erreur", msg);
    } finally {
      setProcessingReqId(null);
    }
  };

  // ── Loading / Error states ──────────────────────────────────

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
        <Text style={styles.errorTitle}>Partie introuvable</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Retour</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const { match, isCreator, isPlayer, myRequest, pendingRequests } = data;
  const sport = SPORTS[match.sport];
  const isOpen = match.status === "OPEN";
  const isCancelled = match.status === "CANCELLED";
  const isCompleted = match.status === "COMPLETED";
  const isInProgress = match.status === "IN_PROGRESS";
  const isFull = match.status === "FULL";

  // ── Bouton d'action contextuel ──────────────────────────────
  const matchStarted = new Date(match.scheduledAt) <= new Date();

  const renderActionButton = () => {
    if (isCreator) {
      if (isCancelled || isCompleted) return null;
      if (isOpen || isFull || isInProgress) {
        return (
          <View style={{ gap: 8 }}>
            {/* Terminer : uniquement si l'heure du match est passée */}
            {matchStarted && (
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonComplete]}
                onPress={handleComplete}
                disabled={isActionLoading}
                activeOpacity={0.8}
              >
                {isActionLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.actionButtonText}>✅ Terminer la partie</Text>
                )}
              </TouchableOpacity>
            )}
            {/* Annuler : uniquement si le match n'a pas commencé */}
            {!matchStarted && (
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonDanger]}
                onPress={handleCancel}
                disabled={isActionLoading}
                activeOpacity={0.8}
              >
                <Text style={styles.actionButtonText}>Annuler ma partie</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      }
      return null;
    }

    if (isCancelled) return <DisabledButton label="Partie annulée" />;
    if (isCompleted) return <DisabledButton label="Partie terminée" />;
    if (isInProgress) return <DisabledButton label="Match en cours" />;

    // Joueur accepté → peut quitter
    if (isPlayer) {
      return (
        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonSecondary]}
          onPress={handleLeave}
          disabled={isActionLoading}
          activeOpacity={0.8}
        >
          {isActionLoading ? (
            <ActivityIndicator color="#2ECC71" size="small" />
          ) : (
            <Text style={styles.actionButtonTextSecondary}>✓ Tu es inscrit — Quitter</Text>
          )}
        </TouchableOpacity>
      );
    }

    // Demande en cours (PENDING)
    if (myRequest?.status === "PENDING") {
      return <DisabledButton label="⏳ Demande envoyée — En attente" />;
    }

    // Demande refusée
    if (myRequest?.status === "REJECTED") {
      return <DisabledButton label="❌ Demande refusée" />;
    }

    // Partie pleine
    if (isFull) return <DisabledButton label="Partie complète" />;

    // Peut faire une demande
    if (!isOpen) return null;

    return (
      <TouchableOpacity
        style={[styles.actionButton, styles.actionButtonPrimary]}
        onPress={handleJoin}
        disabled={isActionLoading}
        activeOpacity={0.8}
      >
        {isActionLoading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.actionButtonText}>Demander à rejoindre</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Retour</Text>
        </TouchableOpacity>
        <View style={[styles.sportBadge, { backgroundColor: sport.bg }]}>
          <Text style={[styles.sportBadgeText, { color: sport.text }]}>
            {sport.emoji} {sport.label}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Titre + statut */}
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>
            {match.title || `Partie de ${sport.label}`}
          </Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>
              {MATCH_STATUS_LABELS[match.status] ?? match.status}
            </Text>
          </View>
        </View>

        {/* Infos principales */}
        <View style={styles.infoCard}>
          <InfoRow icon="📍" label="Lieu" value={match.locationName} />
          <Divider />
          <InfoRow icon="📅" label="Date" value={formatMatchDate(match.scheduledAt)} />
          <Divider />
          <InfoRow icon="⏱" label="Durée" value={formatDuration(match.durationMinutes)} />
          <Divider />
          <InfoRow
            icon="🎯"
            label="Niveau"
            value={match.requiredLevel ? PLAYER_LEVELS[match.requiredLevel].label : "Tous niveaux"}
          />
          <Divider />
          <InfoRow
            icon="👥"
            label="Joueurs"
            value={`${match.currentPlayers}/${match.maxPlayers} inscrits`}
          />
        </View>

        {/* Créateur */}
        {match.creator && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Organisateur</Text>
            <View style={styles.creatorRow}>
              <Avatar
                avatarUrl={match.creator.avatarUrl}
                firstName={match.creator.firstName}
                lastName={match.creator.lastName}
                size={44}
              />
              <View>
                <Text style={styles.creatorName}>
                  {match.creator.firstName} {match.creator.lastName}
                </Text>
                {isCreator && <Text style={styles.creatorBadge}>C'est toi !</Text>}
              </View>
            </View>
          </View>
        )}

        {/* Joueurs inscrits */}
        {match.players && match.players.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Joueurs inscrits ({match.players.length}/{match.maxPlayers})
            </Text>
            <View style={styles.playersList}>
              {(match.players as (MatchPlayer & { user?: { id: string; firstName: string; lastName: string; avatarUrl?: string | null } })[]).map((mp) => (
                <View key={mp.id} style={styles.playerRow}>
                  <Avatar
                    avatarUrl={mp.user?.avatarUrl}
                    firstName={mp.user?.firstName ?? "?"}
                    lastName={mp.user?.lastName ?? ""}
                    size={36}
                  />
                  <Text style={styles.playerName}>
                    {mp.user?.firstName} {mp.user?.lastName}
                    {mp.user?.id === user?.id && " (toi)"}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Demandes en attente — visible uniquement par le créateur */}
        {isCreator && pendingRequests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Demandes en attente ({pendingRequests.length})
            </Text>
            <View style={styles.requestsList}>
              {pendingRequests.map((req) => (
                <View key={req.id} style={styles.requestRow}>
                  <Avatar
                    avatarUrl={req.user.avatarUrl}
                    firstName={req.user.firstName}
                    lastName={req.user.lastName}
                    size={40}
                  />
                  <Text style={styles.requestName}>
                    {req.user.firstName} {req.user.lastName}
                  </Text>
                  <View style={styles.requestActions}>
                    {processingReqId === req.id ? (
                      <ActivityIndicator color="#2ECC71" size="small" />
                    ) : (
                      <>
                        <TouchableOpacity
                          style={styles.acceptBtn}
                          onPress={() => handleAccept(req.id)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.acceptBtnText}>✓</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.rejectBtn}
                          onPress={() => handleReject(req.id)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.rejectBtnText}>✕</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Description */}
        {match.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{match.description}</Text>
          </View>
        )}

        {/* Feedback section — after match completed */}
        {isCompleted && (isPlayer || isCreator) && (
          <View style={styles.section}>
            {data.myFeedback ? (
              <>
                <Text style={styles.sectionTitle}>Ton avis</Text>
                <View style={styles.feedbackDisplay}>
                  {data.myFeedback.overallRating && (
                    <Text style={styles.feedbackStars}>
                      {"⭐".repeat(data.myFeedback.overallRating)}{"☆".repeat(5 - data.myFeedback.overallRating)}
                    </Text>
                  )}
                  <View style={styles.feedbackLevelRow}>
                    <Text style={styles.feedbackEmoji}>
                      {FEEDBACK_LABELS[data.myFeedback.levelRating]?.emoji ?? ""}
                    </Text>
                    <Text style={styles.feedbackLabel}>
                      {FEEDBACK_LABELS[data.myFeedback.levelRating]?.label ?? data.myFeedback.levelRating}
                    </Text>
                  </View>
                  {(data.myFeedback.fairPlayRating || data.myFeedback.punctualityRating || data.myFeedback.ambianceRating) && (
                    <View style={styles.feedbackCriteria}>
                      {data.myFeedback.fairPlayRating && (
                        <Text style={styles.feedbackCriteriaText}>🤝 {"⭐".repeat(data.myFeedback.fairPlayRating)}</Text>
                      )}
                      {data.myFeedback.punctualityRating && (
                        <Text style={styles.feedbackCriteriaText}>⏰ {"⭐".repeat(data.myFeedback.punctualityRating)}</Text>
                      )}
                      {data.myFeedback.ambianceRating && (
                        <Text style={styles.feedbackCriteriaText}>🎉 {"⭐".repeat(data.myFeedback.ambianceRating)}</Text>
                      )}
                    </View>
                  )}
                  {data.myFeedback.comment && (
                    <Text style={styles.feedbackComment}>"{data.myFeedback.comment}"</Text>
                  )}
                </View>
              </>
            ) : (
              <>
                <Text style={styles.sectionTitle}>Donne ton avis</Text>
                <TouchableOpacity
                  style={styles.feedbackBtn}
                  onPress={() =>
                    navigation.navigate("MatchFeedback", {
                      matchId,
                      matchTitle: match.title || `Partie de ${sport.label}`,
                      sport: match.sport,
                    })
                  }
                  activeOpacity={0.8}
                >
                  <Text style={styles.feedbackBtnText}>⭐ Évaluer cette partie</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bouton d'action sticky */}
      <View style={styles.actionBar}>
        {renderActionButton()}
      </View>
    </SafeAreaView>
  );
}

// ── Composants helpers ──────────────────────────────────────────

function Avatar({
  avatarUrl,
  firstName,
  lastName,
  size,
}: {
  avatarUrl?: string | null;
  firstName: string;
  lastName: string;
  size: number;
}) {
  return (
    <View
      style={[
        styles.avatarContainer,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
        />
      ) : (
        <Text style={[styles.avatarInitials, { fontSize: size * 0.35 }]}>
          {firstName[0]}{lastName[0]}
        </Text>
      )}
    </View>
  );
}

function DisabledButton({ label }: { label: string }) {
  return (
    <View style={[styles.actionButton, styles.actionButtonDisabled]}>
      <Text style={styles.actionButtonTextDisabled}>{label}</Text>
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
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
  backBtn: { paddingVertical: 6, paddingRight: 12 },
  backBtnText: { fontSize: 15, color: "#2ECC71", fontWeight: "600" },
  sportBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  sportBadgeText: { fontSize: 13, fontWeight: "700" },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20 },
  titleRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start",
    marginBottom: 16, gap: 12,
  },
  title: { flex: 1, fontSize: 22, fontWeight: "700", color: "#1A1A2E" },
  statusBadge: { backgroundColor: "#D5F5E3", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusBadgeText: { fontSize: 12, fontWeight: "600", color: "#1A9B50" },
  infoCard: {
    backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1,
    borderColor: "#E5E7EB", padding: 4, marginBottom: 20,
  },
  infoRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 16, gap: 12 },
  infoIcon: { fontSize: 20, width: 28, textAlign: "center" },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 12, color: "#6B7280", marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: "600", color: "#1A1A2E" },
  divider: { height: 1, backgroundColor: "#F3F4F6", marginHorizontal: 16 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1A1A2E", marginBottom: 12 },
  creatorRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#FFFFFF", padding: 14, borderRadius: 12,
    borderWidth: 1, borderColor: "#E5E7EB",
  },
  avatarContainer: {
    backgroundColor: "#D5F5E3", alignItems: "center",
    justifyContent: "center", overflow: "hidden",
  },
  avatarInitials: { fontWeight: "700", color: "#1A9B50" },
  creatorName: { fontSize: 15, fontWeight: "600", color: "#1A1A2E" },
  creatorBadge: { fontSize: 12, color: "#2ECC71", marginTop: 2 },
  playersList: {
    backgroundColor: "#FFFFFF", borderRadius: 12,
    borderWidth: 1, borderColor: "#E5E7EB", overflow: "hidden",
  },
  playerRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 12, borderBottomWidth: 1, borderBottomColor: "#F3F4F6",
  },
  playerName: { fontSize: 14, color: "#1A1A2E", fontWeight: "500" },
  // ── Demandes en attente ──
  requestsList: {
    backgroundColor: "#FFFFFF", borderRadius: 12,
    borderWidth: 1, borderColor: "#E5E7EB", overflow: "hidden",
  },
  requestRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 12, borderBottomWidth: 1, borderBottomColor: "#F3F4F6",
  },
  requestName: { flex: 1, fontSize: 14, color: "#1A1A2E", fontWeight: "500" },
  requestActions: { flexDirection: "row", gap: 8 },
  acceptBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#2ECC71", alignItems: "center", justifyContent: "center",
  },
  acceptBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  rejectBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#FDECEA", alignItems: "center", justifyContent: "center",
  },
  rejectBtnText: { color: "#E74C3C", fontSize: 16, fontWeight: "700" },
  // ── Description ──
  description: {
    fontSize: 14, color: "#374151", lineHeight: 22,
    backgroundColor: "#FFFFFF", padding: 14, borderRadius: 12,
    borderWidth: 1, borderColor: "#E5E7EB",
  },
  // ── Action bar ──
  actionBar: {
    backgroundColor: "#FFFFFF", paddingHorizontal: 20, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: "#E5E7EB",
  },
  actionButton: { height: 52, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  actionButtonComplete: {
    backgroundColor: "#2ECC71",
  },
  actionButtonPrimary: {
    backgroundColor: "#2ECC71",
    shadowColor: "#2ECC71", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  actionButtonSecondary: { backgroundColor: "#FFFFFF", borderWidth: 1.5, borderColor: "#2ECC71" },
  actionButtonDanger: { backgroundColor: "#E74C3C" },
  actionButtonDisabled: { backgroundColor: "#F3F4F6" },
  actionButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  actionButtonTextSecondary: { color: "#2ECC71", fontSize: 15, fontWeight: "600" },
  actionButtonTextDisabled: { color: "#9CA3AF", fontSize: 15, fontWeight: "600" },
  // ── Feedback ──
  feedbackDisplay: {
    backgroundColor: "#FFFFFF", borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: "#E5E7EB", alignItems: "center", gap: 8,
  },
  feedbackStars: { fontSize: 20, letterSpacing: 2 },
  feedbackLevelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  feedbackEmoji: { fontSize: 24 },
  feedbackLabel: { fontSize: 15, fontWeight: "700", color: "#1A1A2E" },
  feedbackCriteria: { gap: 4, alignItems: "center" },
  feedbackCriteriaText: { fontSize: 13, color: "#374151" },
  feedbackComment: { fontSize: 13, color: "#6B7280", fontStyle: "italic", marginTop: 4 },
  feedbackBtn: {
    backgroundColor: "#EAFAF1", borderRadius: 12, paddingVertical: 16,
    alignItems: "center", borderWidth: 1.5, borderColor: "#2ECC71",
  },
  feedbackBtnText: { fontSize: 15, fontWeight: "700", color: "#1A9B50" },
});
