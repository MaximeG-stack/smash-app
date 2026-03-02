import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "@/navigation/types";
import type { PlayerLevel, Sport } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { OnboardingProgress } from "./OnboardingSportScreen";
import { Colors } from "@/constants/colors";

type Props = NativeStackScreenProps<AuthStackParamList, "OnboardingLevel">;

const LEVELS: { key: PlayerLevel; label: string; description: string; example: string }[] = [
  {
    key: "BEGINNER",
    label: "Débutant",
    description: "Je débute ou je joue rarement",
    example: "Moins de 1 an de pratique",
  },
  {
    key: "INTERMEDIATE",
    label: "Intermédiaire",
    description: "Je maîtrise les bases et je joue régulièrement",
    example: "1 à 3 ans, classé 30/4 à 15/3 au tennis",
  },
  {
    key: "ADVANCED",
    label: "Avancé",
    description: "Bon joueur, tactique et régularité",
    example: "3 à 7 ans, classé 15/2 à 4/6 au tennis",
  },
  {
    key: "EXPERT",
    label: "Expert / Compétiteur",
    description: "Je joue en compétition ou à très haut niveau",
    example: "Classé national, FFT < 4/6",
  },
];

const SPORT_LABEL: Record<Sport, string> = {
  TENNIS: "Tennis",
  PADEL: "Padel",
  SQUASH: "Squash",
};

export function OnboardingLevelScreen({ navigation }: Props) {
  const { sports, levelBySport, setLevelBySport, setFftRanking, fftRanking } =
    useOnboardingStore();
  const [currentSportIdx, setCurrentSportIdx] = useState(0);

  const currentSport = sports[currentSportIdx];
  const selectedLevel = currentSport ? levelBySport[currentSport] : null;

  const handleSelect = (level: PlayerLevel) => {
    if (currentSport) setLevelBySport(currentSport, level);
  };

  const handleNext = () => {
    if (currentSportIdx < sports.length - 1) {
      setCurrentSportIdx((i) => i + 1);
    } else {
      navigation.navigate("OnboardingLocation");
    }
  };

  const canContinue = sports.every((s) => levelBySport[s]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <OnboardingProgress step={2} total={4} />

        <Text style={styles.title}>
          Quel est ton niveau ?
        </Text>

        {/* Navigation entre sports */}
        {sports.length > 1 && (
          <View style={styles.sportTabsRow}>
            {sports.map((sport, idx) => {
              const isDone = !!levelBySport[sport];
              const isCurrent = idx === currentSportIdx;
              return (
                <TouchableOpacity
                  key={sport}
                  onPress={() => setCurrentSportIdx(idx)}
                  style={[
                    styles.sportTab,
                    isCurrent
                      ? styles.sportTabCurrent
                      : isDone
                      ? styles.sportTabDone
                      : styles.sportTabDefault,
                  ]}
                >
                  <Text
                    style={[
                      styles.sportTabText,
                      isCurrent ? styles.sportTabTextCurrent : styles.sportTabTextDefault,
                    ]}
                  >
                    {SPORT_LABEL[sport]} {isDone && "✓"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <Text style={styles.forSportText}>
          Pour{" "}
          <Text style={styles.forSportBold}>{SPORT_LABEL[currentSport]}</Text>
        </Text>

        <View style={styles.levelsContainer}>
          {LEVELS.map((level) => {
            const isSelected = selectedLevel === level.key;
            const c = Colors.level[level.key];
            return (
              <TouchableOpacity
                key={level.key}
                onPress={() => handleSelect(level.key)}
                activeOpacity={0.8}
                style={[
                  styles.levelCard,
                  {
                    borderColor: isSelected ? c.color : "#E5E7EB",
                    backgroundColor: isSelected ? c.bg : "#FFFFFF",
                  },
                ]}
              >
                <View style={styles.levelCardHeader}>
                  <Text
                    style={[
                      styles.levelLabel,
                      { color: isSelected ? c.text : "#1A1A2E" },
                    ]}
                  >
                    {level.label}
                  </Text>
                  {isSelected && (
                    <View
                      style={[styles.levelCheckCircle, { backgroundColor: c.color }]}
                    >
                      <Text style={styles.levelCheckMark}>✓</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.levelDescription}>{level.description}</Text>
                <Text
                  style={[styles.levelExample, { color: c.text }]}
                >
                  {level.example}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Classement FFT optionnel (Tennis uniquement) */}
        {currentSport === "TENNIS" && (
          <View style={styles.fftContainer}>
            <Input
              label="Classement FFT (optionnel)"
              value={fftRanking}
              onChangeText={setFftRanking}
              placeholder="Ex : 15/2, 4/6, NC"
              autoCapitalize="characters"
            />
            <Text style={styles.fftHint}>
              Ton classement FFT nous aide à affiner le matching
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomContainer}>
        <Button
          label={
            currentSportIdx < sports.length - 1
              ? `Suivant → ${SPORT_LABEL[sports[currentSportIdx + 1]]}`
              : "Continuer"
          }
          onPress={handleNext}
          disabled={!selectedLevel}
        />
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
    marginBottom: 4,
  },
  sportTabsRow: {
    flexDirection: "row",
    gap: 8,
    marginVertical: 16,
  },
  sportTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: "center",
  },
  sportTabDefault: {
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  sportTabCurrent: {
    borderColor: "#2ECC71",
    backgroundColor: "#EAFAF1",
  },
  sportTabDone: {
    borderColor: "#D5F5E3",
    backgroundColor: "#F9FAFB",
  },
  sportTabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  sportTabTextCurrent: {
    color: "#1A9B50",
  },
  sportTabTextDefault: {
    color: "#6B7280",
  },
  forSportText: {
    color: "#6B7280",
    marginBottom: 24,
  },
  forSportBold: {
    fontWeight: "600",
    color: "#1A1A2E",
  },
  levelsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  levelCard: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 14,
  },
  levelCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  levelLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  levelCheckCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  levelCheckMark: {
    color: "#FFFFFF",
    fontSize: 12,
  },
  levelDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  levelExample: {
    fontSize: 11,
    marginTop: 2,
    fontStyle: "italic",
  },
  fftContainer: {
    marginBottom: 24,
  },
  fftHint: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 4,
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
  },
});
