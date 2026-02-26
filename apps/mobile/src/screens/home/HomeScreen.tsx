import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@/stores/authStore";

export function HomeScreen() {
  const { user } = useAuthStore();

  return (
    <SafeAreaView className="flex-1 bg-neutral-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-4 pb-2">
          <Text className="text-2xl font-bold text-neutral-900">
            Bonjour {user?.firstName} 👋
          </Text>
          <Text className="text-neutral-500 mt-1">Que veux-tu jouer aujourd'hui ?</Text>
        </View>

        {/* TODO Sprint 2 : parties suggérées */}
        <View className="px-6 mt-6">
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 16,
              padding: 24,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 48 }}>🎾</Text>
            <Text className="text-lg font-semibold text-neutral-900 mt-4 text-center">
              Aucune partie disponible pour l'instant
            </Text>
            <Text className="text-neutral-500 text-center mt-2">
              Sois le premier à créer une partie dans ta zone !
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
