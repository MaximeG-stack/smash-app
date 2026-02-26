import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import { JetBrainsMono_500Medium } from "@expo-google-fonts/jetbrains-mono";
import * as SplashScreen from "expo-splash-screen";
import { View, Text } from "react-native";

// TODO: Remplacer par le vrai Navigator une fois auth + navigation configurés
// import { RootNavigator } from "@/screens/RootNavigator";

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    JetBrainsMono_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#2ECC71" }}>
      <Text style={{ fontSize: 32, fontWeight: "700", color: "#fff", letterSpacing: 2 }}>
        SMASHI
      </Text>
      <Text style={{ fontSize: 16, color: "#fff", marginTop: 8, opacity: 0.8 }}>
        On joue. Ensemble.
      </Text>
      <StatusBar style="light" />
    </View>
  );
}
