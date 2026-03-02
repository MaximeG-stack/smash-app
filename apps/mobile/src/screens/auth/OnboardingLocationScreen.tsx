import { useState } from "react";
import { View, Text, Alert, TouchableOpacity, StyleSheet } from "react-native";
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
    <SafeAreaView style={styles.container}>
      <View style={styles.contentWrapper}>
        <OnboardingProgress step={3} total={4} />

        <Text style={styles.title}>
          Où joues-tu ?
        </Text>
        <Text style={styles.subtitle}>
          On cherche des parties dans un rayon autour de chez toi.
        </Text>

        {/* Géolocalisation auto */}
        <TouchableOpacity
          onPress={handleGeolocate}
          disabled={locating}
          style={[
            styles.geoButton,
            latitude ? styles.geoButtonActive : styles.geoButtonDefault,
          ]}
        >
          <Text style={styles.geoEmoji}>📍</Text>
          <View style={styles.geoTextContainer}>
            <Text
              style={[
                styles.geoLabel,
                latitude ? styles.geoLabelActive : styles.geoLabelDefault,
              ]}
            >
              {locating
                ? "Localisation en cours..."
                : latitude
                ? `${cityInput} ✓`
                : "Utiliser ma position actuelle"}
            </Text>
            <Text style={styles.geoSubLabel}>
              Recommandé — plus précis pour le matching
            </Text>
          </View>
        </TouchableOpacity>

        {/* Ou saisie manuelle */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>ou</Text>
          <View style={styles.dividerLine} />
        </View>

        <Input
          label="Saisir ma ville"
          value={cityInput}
          onChangeText={setCityInput}
          placeholder="Marseille, Aix-en-Provence..."
          autoCapitalize="words"
        />

        {/* Rayon de recherche */}
        <View style={styles.radiusContainer}>
          <Text style={styles.radiusTitle}>
            Rayon de recherche
          </Text>
          <View style={styles.radiusRow}>
            {RADIUS_OPTIONS.map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => setSearchRadius(r)}
                style={[
                  styles.radiusButton,
                  searchRadius === r ? styles.radiusButtonSelected : styles.radiusButtonDefault,
                ]}
              >
                <Text
                  style={[
                    styles.radiusButtonText,
                    { color: searchRadius === r ? "#1A9B50" : "#6B7280" },
                  ]}
                >
                  {r} km
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.bottomContainer}>
        <Button label="Continuer" onPress={handleNext} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  contentWrapper: {
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
  geoButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 16,
  },
  geoButtonDefault: {
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  geoButtonActive: {
    borderColor: "#2ECC71",
    backgroundColor: "#EAFAF1",
  },
  geoEmoji: {
    fontSize: 28,
  },
  geoTextContainer: {
    flex: 1,
  },
  geoLabel: {
    fontWeight: "600",
  },
  geoLabelDefault: {
    color: "#1A1A2E",
  },
  geoLabelActive: {
    color: "#1A9B50",
  },
  geoSubLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  dividerText: {
    color: "#6B7280",
    fontSize: 14,
  },
  radiusContainer: {
    marginTop: 32,
  },
  radiusTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A2E",
    marginBottom: 12,
  },
  radiusRow: {
    flexDirection: "row",
    gap: 12,
  },
  radiusButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
  },
  radiusButtonDefault: {
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  radiusButtonSelected: {
    borderColor: "#2ECC71",
    backgroundColor: "#EAFAF1",
  },
  radiusButtonText: {
    fontWeight: "600",
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
  },
});
