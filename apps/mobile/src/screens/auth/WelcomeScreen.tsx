import { useRef, useState } from "react";
import { View, Text, FlatList, useWindowDimensions, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "@/navigation/types";
import { Button } from "@/components/ui/Button";

type Props = NativeStackScreenProps<AuthStackParamList, "Welcome">;

const SLIDES = [
  {
    key: "1",
    emoji: "🎾",
    title: "Trouve des joueurs\nde ton niveau",
    subtitle:
      "Tennis, padel, squash — trouve instantanément des partenaires compatibles près de chez toi.",
  },
  {
    key: "2",
    emoji: "📍",
    title: "Réserve un terrain\nen 1 clic",
    subtitle:
      "Accède aux disponibilités des clubs PACA en temps réel et réserve sans quitter l'app.",
  },
  {
    key: "3",
    emoji: "💪",
    title: "Rejoins la communauté\nSMASHI",
    subtitle:
      "Plus de groupes WhatsApp chaotiques. Un joueur manquant ? SMASHI t'en trouve un en 30 secondes.",
  },
];

export function WelcomeScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const goNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      navigation.navigate("Login");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Skip */}
      <View className="flex-row justify-end px-6 pt-2">
        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text className="text-neutral-500 font-medium">Passer</Text>
        </TouchableOpacity>
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(idx);
        }}
        renderItem={({ item }) => (
          <View style={{ width }} className="flex-1 items-center justify-center px-8">
            <Text style={{ fontSize: 80 }}>{item.emoji}</Text>
            <Text className="text-3xl font-bold text-neutral-900 text-center mt-8 leading-tight">
              {item.title}
            </Text>
            <Text className="text-base text-neutral-500 text-center mt-4 leading-relaxed">
              {item.subtitle}
            </Text>
          </View>
        )}
      />

      {/* Indicateurs */}
      <View className="flex-row justify-center gap-2 mb-6">
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={{
              width: i === currentIndex ? 24 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: i === currentIndex ? "#2ECC71" : "#E5E7EB",
            }}
          />
        ))}
      </View>

      {/* CTA */}
      <View className="px-6 pb-8 gap-3">
        <Button
          label={currentIndex < SLIDES.length - 1 ? "Suivant" : "Commencer"}
          onPress={goNext}
        />
        {currentIndex === SLIDES.length - 1 && (
          <Button
            label="J'ai déjà un compte"
            variant="secondary"
            onPress={() => navigation.navigate("Login")}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
