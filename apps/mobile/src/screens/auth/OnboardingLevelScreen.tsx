import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
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
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <OnboardingProgress step={2} total={4} />

        <Text className="text-2xl font-bold text-neutral-900 mt-6 mb-1">
          Quel est ton niveau ?
        </Text>

        {/* Navigation entre sports */}
        {sports.length > 1 && (
          <View className="flex-row gap-2 my-4">
            {sports.map((sport, idx) => {
              const isDone = !!levelBySport[sport];
              const isCurrent = idx === currentSportIdx;
              return (
                <TouchableOpacity
                  key={sport}
                  onPress={() => setCurrentSportIdx(idx)}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    borderRadius: 8,
                    borderWidth: 2,
                    borderColor: isCurrent ? "#2ECC71" : isDone ? "#D5F5E3" : "#E5E7EB",
                    backgroundColor: isCurrent ? "#EAFAF1" : isDone ? "#F9FAFB" : "#fff",
                    alignItems: "center",
                  }}
                >
                  <Text
                    className={`text-sm font-semibold ${isCurrent ? "text-primary-dark" : "text-neutral-500"}`}
                  >
                    {SPORT_LABEL[sport]} {isDone && "✓"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <Text className="text-neutral-500 mb-6">
          Pour{" "}
          <Text className="font-semibold text-neutral-900">{SPORT_LABEL[currentSport]}</Text>
        </Text>

        <View className="gap-3 mb-6">
          {LEVELS.map((level) => {
            const isSelected = selectedLevel === level.key;
            const c = Colors.level[level.key];
            return (
              <TouchableOpacity
                key={level.key}
                onPress={() => handleSelect(level.key)}
                activeOpacity={0.8}
                style={{
                  borderWidth: 2,
                  borderColor: isSelected ? c.color : "#E5E7EB",
                  borderRadius: 12,
                  padding: 14,
                  backgroundColor: isSelected ? c.bg : "#fff",
                }}
              >
                <View className="flex-row justify-between items-center">
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: isSelected ? c.text : "#1A1A2E",
                    }}
                  >
                    {level.label}
                  </Text>
                  {isSelected && (
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        backgroundColor: c.color,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text style={{ color: "#fff", fontSize: 12 }}>✓</Text>
                    </View>
                  )}
                </View>
                <Text className="text-sm text-neutral-500 mt-1">{level.description}</Text>
                <Text
                  style={{ fontSize: 11, color: c.text, marginTop: 2, fontStyle: "italic" }}
                >
                  {level.example}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Classement FFT optionnel (Tennis uniquement) */}
        {currentSport === "TENNIS" && (
          <View className="mb-6">
            <Input
              label="Classement FFT (optionnel)"
              value={fftRanking}
              onChangeText={setFftRanking}
              placeholder="Ex : 15/2, 4/6, NC"
              autoCapitalize="characters"
            />
            <Text className="text-xs text-neutral-400 mt-1">
              Ton classement FFT nous aide à affiner le matching
            </Text>
          </View>
        )}
      </ScrollView>

      <View className="px-6 pb-8 pt-4">
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
