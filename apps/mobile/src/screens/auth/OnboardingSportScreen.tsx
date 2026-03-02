import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
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
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Progress */}
        <OnboardingProgress step={1} total={4} />

        <Text style={styles.title}>
          Quel(s) sport(s) pratiques-tu ?
        </Text>
        <Text style={styles.subtitle}>
          Tu peux en sélectionner plusieurs. On cherchera des parties pour chacun.
        </Text>

        <View style={styles.sportsContainer}>
          {SPORTS.map((sport) => {
            const isSelected = selected.includes(sport.key);
            return (
              <TouchableOpacity
                key={sport.key}
                onPress={() => toggle(sport.key)}
                activeOpacity={0.8}
                style={[
                  styles.sportCard,
                  isSelected ? styles.sportCardSelected : styles.sportCardDefault,
                ]}
              >
                <Text style={styles.sportEmoji}>{sport.emoji}</Text>
                <View style={styles.sportTextContainer}>
                  <Text
                    style={[
                      styles.sportLabel,
                      isSelected ? styles.sportLabelSelected : styles.sportLabelDefault,
                    ]}
                  >
                    {sport.label}
                  </Text>
                  <Text style={styles.sportDescription}>{sport.description}</Text>
                </View>
                <View
                  style={[
                    styles.checkCircle,
                    isSelected ? styles.checkCircleSelected : styles.checkCircleDefault,
                  ]}
                >
                  {isSelected && <Text style={styles.checkMark}>✓</Text>}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.bottomContainer}>
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
    <View style={progressStyles.container}>
      <View style={progressStyles.barRow}>
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            style={[
              progressStyles.bar,
              { backgroundColor: i < step ? "#2ECC71" : "#E5E7EB" },
            ]}
          />
        ))}
      </View>
      <Text style={progressStyles.stepText}>
        Étape {step} sur {total}
      </Text>
    </View>
  );
}

export { OnboardingProgress };

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
    marginBottom: 32,
  },
  sportsContainer: {
    gap: 16,
  },
  sportCard: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sportCardDefault: {
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  sportCardSelected: {
    borderColor: "#2ECC71",
    backgroundColor: "#EAFAF1",
  },
  sportEmoji: {
    fontSize: 40,
  },
  sportTextContainer: {
    flex: 1,
  },
  sportLabel: {
    fontSize: 18,
    fontWeight: "600",
  },
  sportLabelDefault: {
    color: "#1A1A2E",
  },
  sportLabelSelected: {
    color: "#1A9B50",
  },
  sportDescription: {
    fontSize: 14,
    color: "#6B7280",
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  checkCircleDefault: {
    borderColor: "#D1D5DB",
    backgroundColor: "transparent",
  },
  checkCircleSelected: {
    borderColor: "#2ECC71",
    backgroundColor: "#2ECC71",
  },
  checkMark: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
  },
});

const progressStyles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  barRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  bar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  stepText: {
    fontSize: 14,
    color: "#6B7280",
  },
});
