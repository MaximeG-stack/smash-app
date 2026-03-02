import { useRef, useState } from "react";
import { View, Text, FlatList, useWindowDimensions, TouchableOpacity, StyleSheet } from "react-native";
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
      const next = currentIndex + 1;
      flatListRef.current?.scrollToOffset({ offset: next * width, animated: true });
      setCurrentIndex(next);
    } else {
      navigation.navigate("Login");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Skip */}
      <View style={styles.skipRow}>
        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={styles.skipText}>Passer</Text>
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
          <View style={[styles.slide, { width }]}>
            <Text style={styles.slideEmoji}>{item.emoji}</Text>
            <Text style={styles.slideTitle}>
              {item.title}
            </Text>
            <Text style={styles.slideSubtitle}>
              {item.subtitle}
            </Text>
          </View>
        )}
      />

      {/* Indicateurs */}
      <View style={styles.dotsRow}>
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
      <View style={styles.ctaContainer}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  skipRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  skipText: {
    color: "#6B7280",
    fontWeight: "500",
  },
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  slideEmoji: {
    fontSize: 80,
  },
  slideTitle: {
    fontSize: 30,
    fontWeight: "700",
    color: "#1A1A2E",
    textAlign: "center",
    marginTop: 32,
    lineHeight: 38,
  },
  slideSubtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 16,
    lineHeight: 24,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 24,
  },
  ctaContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 12,
  },
});
