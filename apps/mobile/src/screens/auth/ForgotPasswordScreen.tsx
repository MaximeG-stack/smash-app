import { useState } from "react";
import { View, Text, Alert, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "@/navigation/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { sendPasswordReset } from "@/services/authService";

type Props = NativeStackScreenProps<AuthStackParamList, "ForgotPassword">;

export function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email.includes("@")) {
      Alert.alert("Erreur", "Saisis un email valide.");
      return;
    }
    setLoading(true);
    try {
      await sendPasswordReset(email.trim().toLowerCase());
      setSent(true);
    } catch {
      Alert.alert("Erreur", "Impossible d'envoyer l'email. Vérifie l'adresse.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backText}>← Retour</Text>
      </TouchableOpacity>

      {sent ? (
        <View style={styles.sentContainer}>
          <Text style={styles.sentEmoji}>📧</Text>
          <Text style={styles.sentTitle}>Email envoyé !</Text>
          <Text style={styles.sentSubtitle}>
            Vérifie ta boîte mail et clique sur le lien pour réinitialiser ton mot de passe.
          </Text>
          <View style={styles.sentButtonWrapper}>
            <Button label="Retour à la connexion" onPress={() => navigation.navigate("Login")} />
          </View>
        </View>
      ) : (
        <View style={styles.formContainer}>
          <View>
            <Text style={styles.title}>
              Mot de passe oublié ?
            </Text>
            <Text style={styles.subtitle}>
              Saisis ton email et on t'envoie un lien pour le réinitialiser.
            </Text>
          </View>

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="ton@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Button label="Envoyer le lien" onPress={handleReset} loading={loading} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
  },
  backButton: {
    marginTop: 16,
    marginBottom: 32,
  },
  backText: {
    color: "#6B7280",
  },
  sentContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  sentEmoji: {
    fontSize: 64,
  },
  sentTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1A2E",
    textAlign: "center",
  },
  sentSubtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
  },
  sentButtonWrapper: {
    width: "100%",
    marginTop: 24,
  },
  formContainer: {
    gap: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#1A1A2E",
    marginBottom: 8,
  },
  subtitle: {
    color: "#6B7280",
  },
});
