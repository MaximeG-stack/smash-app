import { useState } from "react";
import { View, Text, Alert, TouchableOpacity } from "react-native";
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
    <SafeAreaView className="flex-1 bg-white px-6">
      <TouchableOpacity onPress={() => navigation.goBack()} className="mt-4 mb-8">
        <Text className="text-neutral-500">← Retour</Text>
      </TouchableOpacity>

      {sent ? (
        <View className="flex-1 items-center justify-center gap-4">
          <Text style={{ fontSize: 64 }}>📧</Text>
          <Text className="text-2xl font-bold text-neutral-900 text-center">Email envoyé !</Text>
          <Text className="text-base text-neutral-500 text-center">
            Vérifie ta boîte mail et clique sur le lien pour réinitialiser ton mot de passe.
          </Text>
          <View className="w-full mt-6">
            <Button label="Retour à la connexion" onPress={() => navigation.navigate("Login")} />
          </View>
        </View>
      ) : (
        <View className="gap-6">
          <View>
            <Text className="text-3xl font-bold text-neutral-900 mb-2">
              Mot de passe oublié ?
            </Text>
            <Text className="text-neutral-500">
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
