import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { MainStackParamList } from "@/navigation/types";
import { api } from "@/services/api";

type FeedbackRouteProp = RouteProp<MainStackParamList, "MatchFeedback">;

const SPORT_EMOJIS: Record<string, string> = {
  TENNIS: "🎾",
  PADEL: "🏓",
  SQUASH: "🟠",
};

type FeedbackLevel = "TOO_LOW" | "BALANCED" | "TOO_HIGH";

const FEEDBACK_OPTIONS: Array<{ value: FeedbackLevel; emoji: string; label: string }> = [
  { value: "TOO_LOW", emoji: "😓", label: "Trop faible" },
  { value: "BALANCED", emoji: "⚖️", label: "Équilibré" },
  { value: "TOO_HIGH", emoji: "💪", label: "Trop élevé" },
];

const CRITERIA = [
  { key: "fairPlay", label: "Fair-play", emoji: "🤝" },
  { key: "punctuality", label: "Ponctualité", emoji: "⏰" },
  { key: "ambiance", label: "Ambiance", emoji: "🎉" },
] as const;

function StarRow({
  value,
  onChange,
  size = 28,
}: {
  value: number;
  onChange: (v: number) => void;
  size?: number;
}) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => onChange(star)} activeOpacity={0.6}>
          <Text style={{ fontSize: size }}>{star <= value ? "⭐" : "☆"}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function MatchFeedbackScreen() {
  const navigation = useNavigation();
  const route = useRoute<FeedbackRouteProp>();
  const { matchId, matchTitle, sport } = route.params;

  const [selected, setSelected] = useState<FeedbackLevel | null>(null);
  const [overallRating, setOverallRating] = useState(0);
  const [fairPlay, setFairPlay] = useState(0);
  const [punctuality, setPunctuality] = useState(0);
  const [ambiance, setAmbiance] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const sportEmoji = SPORT_EMOJIS[sport] ?? "🏅";

  const criteriaSetters: Record<string, (v: number) => void> = {
    fairPlay: setFairPlay,
    punctuality: setPunctuality,
    ambiance: setAmbiance,
  };
  const criteriaValues: Record<string, number> = {
    fairPlay,
    punctuality,
    ambiance,
  };

  const canSubmit = selected !== null && overallRating > 0;

  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting) return;
    setIsSubmitting(true);

    try {
      await api.post(`/api/matches/${matchId}/feedback`, {
        levelRating: selected,
        overallRating,
        fairPlayRating: fairPlay || undefined,
        punctualityRating: punctuality || undefined,
        ambianceRating: ambiance || undefined,
        comment: comment.trim() || undefined,
      });
      setSubmitted(true);
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? "Erreur lors de l'envoi";
      if (Platform.OS === "web") {
        window.alert(msg);
      } else {
        Alert.alert("Erreur", msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <Text style={styles.successEmoji}>✅</Text>
          <Text style={styles.successTitle}>Merci pour ton avis !</Text>
          <Text style={styles.successSubtitle}>
            Ton retour aide à améliorer le matching pour tous les joueurs.
          </Text>
          <TouchableOpacity
            style={styles.successBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.successBtnText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ton avis</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollInner}>
        {/* Match info */}
        <View style={styles.matchInfo}>
          <Text style={styles.matchEmoji}>{sportEmoji}</Text>
          <Text style={styles.matchTitle}>{matchTitle}</Text>
        </View>

        {/* Note globale */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Note globale</Text>
          <StarRow value={overallRating} onChange={setOverallRating} size={36} />
        </View>

        {/* Niveau */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comment était le niveau ?</Text>
          <View style={styles.options}>
            {FEEDBACK_OPTIONS.map((opt) => {
              const isSelected = selected === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.optionBtn, isSelected && styles.optionBtnSelected]}
                  onPress={() => setSelected(opt.value)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                  <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Critères détaillés */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Critères (optionnel)</Text>
          {CRITERIA.map((c) => (
            <View key={c.key} style={styles.criteriaRow}>
              <Text style={styles.criteriaLabel}>{c.emoji} {c.label}</Text>
              <StarRow value={criteriaValues[c.key]} onChange={criteriaSetters[c.key]} size={24} />
            </View>
          ))}
        </View>

        {/* Comment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Commentaire (optionnel)</Text>
          <TextInput
            style={styles.commentInput}
            placeholder="Quelque chose à ajouter ?"
            placeholderTextColor="#9CA3AF"
            value={comment}
            onChangeText={setComment}
            multiline
            maxLength={300}
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          activeOpacity={0.8}
        >
          <Text style={styles.submitBtnText}>
            {isSubmitting ? "Envoi..." : "Envoyer mon avis"}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backBtn: {
    width: 40,
    padding: 4,
  },
  backText: {
    fontSize: 24,
    color: "#1A1A2E",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1A1A2E",
  },
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  matchInfo: {
    alignItems: "center",
    marginBottom: 24,
  },
  matchEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  matchTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A2E",
    textAlign: "center",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A2E",
    marginBottom: 12,
  },
  starRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  options: {
    gap: 10,
  },
  optionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    gap: 12,
  },
  optionBtnSelected: {
    borderColor: "#2ECC71",
    backgroundColor: "#EAFAF1",
  },
  optionEmoji: {
    fontSize: 24,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
  },
  optionLabelSelected: {
    color: "#1A9B50",
  },
  criteriaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  criteriaLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  commentInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#1A1A2E",
    minHeight: 80,
    textAlignVertical: "top",
  },
  submitBtn: {
    backgroundColor: "#2ECC71",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  submitBtnDisabled: {
    backgroundColor: "#D1D5DB",
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
  },
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  successEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1A1A2E",
    textAlign: "center",
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 28,
  },
  successBtn: {
    backgroundColor: "#2ECC71",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  successBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "white",
  },
});
