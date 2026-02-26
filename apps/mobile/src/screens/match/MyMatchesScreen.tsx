import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function MyMatchesScreen() {
  return (
    <SafeAreaView className="flex-1 bg-neutral-50 items-center justify-center">
      <Text style={{ fontSize: 48 }}>🎯</Text>
      <Text className="text-xl font-bold text-neutral-900 mt-4">Mes matchs</Text>
      <Text className="text-neutral-500 mt-2">Disponible au Sprint 3</Text>
    </SafeAreaView>
  );
}
