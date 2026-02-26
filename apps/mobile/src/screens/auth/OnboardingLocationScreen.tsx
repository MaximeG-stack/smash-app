import { useState } from "react";
import { View, Text, Alert, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "@/navigation/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { OnboardingProgress } from "./OnboardingSportScreen";

type Props = NativeStackScreenProps<AuthStackParamList, "OnboardingLocation">;

const RADIUS_OPTIONS = [5, 10, 20, 50] as const;

export function OnboardingLocationScreen({ navigation }: Props) {
  const { city, latitude, setLocation, searchRadius, setSearchRadius } = useOnboardingStore();
  const [locating, setLocating] = useState(false);
  const [cityInput, setCityInput] = useState(city);

  const handleGeolocate = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Localisation refusée",
          "Active la localisation dans les réglages pour qu'on trouve des parties près de toi.",
        );
        return;
      }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
      const geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      const cityName = geocode[0]?.city ?? geocode[0]?.subregion ?? "Ma ville";
      setLocation(location.coords.latitude, location.coords.longitude, cityName);
      setCityInput(cityName);
    } catch {
      Alert.alert("Erreur", "Impossible de récupérer ta position.");
    } finally {
      setLocating(false);
    }
  };

  const handleNext = () => {
    if (!cityInput.trim()) {
      Alert.alert("Ville manquante", "Indique ta ville ou utilise la géolocalisation.");
      return;
    }
    if (!latitude) {
      // Pas de coordonnées GPS : on passe quand même avec juste la ville
      setLocation(0, 0, cityInput.trim());
    }
    navigation.navigate("OnboardingAvailability");
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6">
        <OnboardingProgress step={3} total={4} />

        <Text className="text-2xl font-bold text-neutral-900 mt-6 mb-2">
          Où joues-tu ?
        </Text>
        <Text className="text-neutral-500 mb-8">
          On cherche des parties dans un rayon autour de chez toi.
        </Text>

        {/* Géolocalisation auto */}
        <TouchableOpacity
          onPress={handleGeolocate}
          disabled={locating}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            padding: 16,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: latitude ? "#2ECC71" : "#E5E7EB",
            backgroundColor: latitude ? "#EAFAF1" : "#F9FAFB",
            marginBottom: 16,
          }}
        >
          <Text style={{ fontSize: 28 }}>📍</Text>
          <View className="flex-1">
            <Text
              className={`font-semibold ${latitude ? "text-primary-dark" : "text-neutral-900"}`}
            >
              {locating
                ? "Localisation en cours..."
                : latitude
                ? `${cityInput} ✓`
                : "Utiliser ma position actuelle"}
            </Text>
            <Text className="text-sm text-neutral-500">
              Recommandé — plus précis pour le matching
            </Text>
          </View>
        </TouchableOpacity>

        {/* Ou saisie manuelle */}
        <View className="flex-row items-center gap-3 mb-4">
          <View className="flex-1 h-px bg-neutral-200" />
          <Text className="text-neutral-500 text-sm">ou</Text>
          <View className="flex-1 h-px bg-neutral-200" />
        </View>

        <Input
          label="Saisir ma ville"
          value={cityInput}
          onChangeText={setCityInput}
          placeholder="Marseille, Aix-en-Provence..."
          autoCapitalize="words"
        />

        {/* Rayon de recherche */}
        <View className="mt-8">
          <Text className="text-base font-semibold text-neutral-900 mb-3">
            Rayon de recherche
          </Text>
          <View className="flex-row gap-3">
            {RADIUS_OPTIONS.map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => setSearchRadius(r)}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: searchRadius === r ? "#2ECC71" : "#E5E7EB",
                  backgroundColor: searchRadius === r ? "#EAFAF1" : "#fff",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontWeight: "600",
                    color: searchRadius === r ? "#1A9B50" : "#6B7280",
                  }}
                >
                  {r} km
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View className="px-6 pb-8 pt-4">
        <Button label="Continuer" onPress={handleNext} />
      </View>
    </SafeAreaView>
  );
}
