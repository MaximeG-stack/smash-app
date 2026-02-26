import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
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
  const { setOnboardingCompleted } = useAuthStore();

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
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <OnboardingProgress step={4} total={4} />

        <Text className="text-2xl font-bold text-neutral-900 mt-6 mb-2">
          Quand es-tu dispo ?
        </Text>
        <Text className="text-neutral-500 mb-6">
          Sélectionne tes créneaux habituels. Tu pourras les modifier à tout moment.
        </Text>

        {/* Grille jours × créneaux */}
        <View className="gap-3">
          {DAYS.map(({ key: day, label }) => (
            <View key={day} className="flex-row items-center gap-2">
              {/* Jour */}
              <Text className="w-10 text-sm font-medium text-neutral-600">{label}</Text>

              {/* Créneaux */}
              <View className="flex-1 flex-row gap-2">
                {SLOTS.map(({ key: slot, label: slotLabel }) => {
                  const selected = isSelected(day, slot);
                  return (
                    <TouchableOpacity
                      key={slot}
                      onPress={() => toggle(day, slot)}
                      style={{
                        flex: 1,
                        paddingVertical: 8,
                        borderRadius: 8,
                        borderWidth: 1.5,
                        borderColor: selected ? "#2ECC71" : "#E5E7EB",
                        backgroundColor: selected ? "#EAFAF1" : "#F9FAFB",
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: "600", color: selected ? "#1A9B50" : "#6B7280" }}>
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
          <Text className="text-xs text-neutral-400 text-center mt-6">
            Tu peux passer cette étape — tes dispos s'affineront avec l'utilisation
          </Text>
        )}

        <View className="h-8" />
      </ScrollView>

      <View className="px-6 pb-8 pt-4 gap-3">
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
