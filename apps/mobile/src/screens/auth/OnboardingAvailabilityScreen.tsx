import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "@/navigation/types";
import { Button } from "@/components/ui/Button";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/services/api";
import { OnboardingProgress } from "./OnboardingSportScreen";

type Props = NativeStackScreenProps<AuthStackParamList, "OnboardingAvailability">;

const DAYS = [
  { key: "monday", label: "Lun" },
  { key: "tuesday", label: "Mar" },
  { key: "wednesday", label: "Mer" },
  { key: "thursday", label: "Jeu" },
  { key: "friday", label: "Ven" },
  { key: "saturday", label: "Sam" },
  { key: "sunday", label: "Dim" },
] as const;

type Day = typeof DAYS[number]["key"];

const SLOTS = [
  { key: "morning", label: "Matin", sublabel: "6h–12h", emoji: "🌅" },
  { key: "afternoon", label: "Après-midi", sublabel: "12h–18h", emoji: "☀️" },
  { key: "evening", label: "Soir", sublabel: "18h–23h", emoji: "🌆" },
] as const;

type Slot = typeof SLOTS[number]["key"];

type Availability = Partial<Record<Day, Slot[]>>;

export function OnboardingAvailabilityScreen({ navigation }: Props) {
  const [avail, setAvail] = useState<Availability>({});
  const [loading, setLoading] = useState(false);

  const { sports, levelBySport, fftRanking, latitude, longitude, city, searchRadius, isHandisport } =
    useOnboardingStore();
  const { setOnboardingCompleted, updateUser } = useAuthStore();

  const toggle = (day: Day, slot: Slot) => {
    setAvail((prev) => {
      const current = prev[day] ?? [];
      const next = current.includes(slot)
        ? current.filter((s) => s !== slot)
        : [...current, slot];
      return { ...prev, [day]: next };
    });
  };

  const isSelected = (day: Day, slot: Slot) => avail[day]?.includes(slot) ?? false;

  const handleFinish = async () => {
    setLoading(true);
    try {
      const primarySport = sports[0];
      const level = primarySport ? (levelBySport[primarySport] ?? "BEGINNER") : "BEGINNER";

      await api.patch("/api/users/profile", {
        sports,
        primarySport,
        level,
        fftRanking: fftRanking || undefined,
        latitude: latitude || undefined,
        longitude: longitude || undefined,
        city,
        searchRadius,
        availabilities: avail,
        isHandisport,
      });

      // Refresh user data so ProfileScreen sees the saved profile
      const { data } = await api.get("/api/users/me");
      updateUser(data.user);
      setOnboardingCompleted();
    } catch {
      Alert.alert(
        "Erreur",
        "Impossible de sauvegarder ton profil. Tu pourras le compléter plus tard.",
      );
      setOnboardingCompleted(); // On laisse passer quand même
    } finally {
      setLoading(false);
    }
  };

  const hasAnySelection = Object.values(avail).some((slots) => slots && slots.length > 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <OnboardingProgress step={4} total={4} />

        <Text style={styles.title}>
          Quand es-tu dispo ?
        </Text>
        <Text style={styles.subtitle}>
          Sélectionne tes créneaux habituels. Tu pourras les modifier à tout moment.
        </Text>

        {/* Grille jours × créneaux */}
        <View style={styles.gridContainer}>
          {DAYS.map(({ key: day, label }) => (
            <View key={day} style={styles.dayRow}>
              {/* Jour */}
              <Text style={styles.dayLabel}>{label}</Text>

              {/* Créneaux */}
              <View style={styles.slotsRow}>
                {SLOTS.map(({ key: slot, label: slotLabel }) => {
                  const selected = isSelected(day, slot);
                  return (
                    <TouchableOpacity
                      key={slot}
                      onPress={() => toggle(day, slot)}
                      style={[
                        styles.slotButton,
                        selected ? styles.slotButtonSelected : styles.slotButtonDefault,
                      ]}
                    >
                      <Text
                        style={[
                          styles.slotText,
                          { color: selected ? "#1A9B50" : "#6B7280" },
                        ]}
                      >
                        {slotLabel}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </View>

        {!hasAnySelection && (
          <Text style={styles.skipHint}>
            Tu peux passer cette étape — tes dispos s'affineront avec l'utilisation
          </Text>
        )}

        <View style={styles.spacer} />
      </ScrollView>

      <View style={styles.bottomContainer}>
        <Button
          label="Commencer à jouer 🎾"
          onPress={handleFinish}
          loading={loading}
        />
        {!hasAnySelection && (
          <Button
            label="Passer cette étape"
            variant="tertiary"
            onPress={handleFinish}
            loading={loading}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1A2E",
    marginTop: 24,
    marginBottom: 8,
  },
  subtitle: {
    color: "#6B7280",
    marginBottom: 24,
  },
  gridContainer: {
    gap: 12,
  },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dayLabel: {
    width: 40,
    fontSize: 14,
    fontWeight: "500",
    color: "#4B5563",
  },
  slotsRow: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
  },
  slotButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: "center",
  },
  slotButtonDefault: {
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  slotButtonSelected: {
    borderColor: "#2ECC71",
    backgroundColor: "#EAFAF1",
  },
  slotText: {
    fontSize: 12,
    fontWeight: "600",
  },
  skipHint: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 24,
  },
  spacer: {
    height: 32,
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
    gap: 12,
  },
});
