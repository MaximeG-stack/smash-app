import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "@/navigation/types";
import type { Sport } from "@/types";
import { Button } from "@/components/ui/Button";
import { useOnboardingStore } from "@/stores/onboardingStore";

type Props = NativeStackScreenProps<AuthStackParamList, "OnboardingSport">;

const SPORTS: { key: Sport; label: string; emoji: string; description: string }[] = [
  {
    key: "TENNIS",
    label: "Tennis",
    emoji: "🎾",
    description: "Simple, double, en club ou entre amis",
  },
  {
    key: "PADEL",
    label: "Padel",
    emoji: "🏓",
    description: "Le sport qui monte le plus vite en France",
  },
  {
    key: "SQUASH",
    label: "Squash",
    emoji: "🟠",
    description: "Intensité, précision, adrénaline",
  },
];

export function OnboardingSportScreen({ navigation }: Props) {
  const { setSports } = useOnboardingStore();
  const [selected, setSelected] = useState<Sport[]>([]);

  const toggle = (sport: Sport) => {
    setSelected((prev) =>
      prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport],
    );
  };

  const handleNext = () => {
    if (selected.length === 0) return;
    setSports(selected);
    navigation.navigate("OnboardingLevel");
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Progress */}
        <OnboardingProgress step={1} total={4} />

        <Text className="text-2xl font-bold text-neutral-900 mt-6 mb-2">
          Quel(s) sport(s) pratiques-tu ?
        </Text>
        <Text className="text-neutral-500 mb-8">
          Tu peux en sélectionner plusieurs. On cherchera des parties pour chacun.
        </Text>

        <View className="gap-4">
          {SPORTS.map((sport) => {
            const isSelected = selected.includes(sport.key);
            return (
              <TouchableOpacity
                key={sport.key}
                onPress={() => toggle(sport.key)}
                activeOpacity={0.8}
                style={{
                  borderWidth: 2,
                  borderColor: isSelected ? "#2ECC71" : "#E5E7EB",
                  borderRadius: 16,
                  padding: 16,
                  backgroundColor: isSelected ? "#EAFAF1" : "#fff",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <Text style={{ fontSize: 40 }}>{sport.emoji}</Text>
                <View className="flex-1">
                  <Text
                    className={`text-lg font-semibold ${isSelected ? "text-primary-dark" : "text-neutral-900"}`}
                  >
                    {sport.label}
                  </Text>
                  <Text className="text-sm text-neutral-500">{sport.description}</Text>
                </View>
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: isSelected ? "#2ECC71" : "#D1D5DB",
                    backgroundColor: isSelected ? "#2ECC71" : "transparent",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {isSelected && <Text style={{ color: "#fff", fontSize: 14 }}>✓</Text>}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View className="px-6 pb-8 pt-4">
        <Button
          label="Continuer"
          onPress={handleNext}
          disabled={selected.length === 0}
        />
      </View>
    </SafeAreaView>
  );
}

// ── Composant indicateur de progression ──────────────────────
function OnboardingProgress({ step, total }: { step: number; total: number }) {
  return (
    <View className="mt-4">
      <View className="flex-row gap-2 mb-2">
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              backgroundColor: i < step ? "#2ECC71" : "#E5E7EB",
            }}
          />
        ))}
      </View>
      <Text className="text-sm text-neutral-500">
        Étape {step} sur {total}
      </Text>
    </View>
  );
}

export { OnboardingProgress };
