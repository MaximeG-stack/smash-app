import { useState } from "react";
import { View, Text, ScrollView, Alert, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "@/navigation/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { registerWithEmail } from "@/services/authService";
import { useAuthStore } from "@/stores/authStore";

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;

export function RegisterScreen({ navigation }: Props) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [showPassword, setShowPassword] = useState(false);
  const { setUser, setLoading, isLoading } = useAuthStore();

  const set = (field: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const validate = () => {
    const e: Partial<typeof form> = {};
    if (!form.firstName.trim()) e.firstName = "Obligatoire";
    if (!form.lastName.trim()) e.lastName = "Obligatoire";
    if (!form.email.includes("@")) e.email = "Email invalide";
    if (form.password.length < 6) e.password = "6 caractères minimum";
    if (form.password !== form.confirmPassword) e.confirmPassword = "Mots de passe différents";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const { user, token } = await registerWithEmail(
        form.email.trim().toLowerCase(),
        form.password,
        form.firstName.trim(),
        form.lastName.trim(),
      );
      setUser(user, token);
      navigation.navigate("OnboardingSport");
    } catch (err: unknown) {
      const msg =
        err instanceof Error && err.message.includes("auth/email-already-in-use")
          ? "Cet email est déjà utilisé."
          : "Inscription impossible. Réessaie.";
      Alert.alert("Erreur", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="flex-1 px-6"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <TouchableOpacity onPress={() => navigation.goBack()} className="mt-4 mb-6">
          <Text className="text-neutral-500">← Retour</Text>
        </TouchableOpacity>

        <Text className="text-3xl font-bold text-neutral-900 mb-2">Créer un compte</Text>
        <Text className="text-neutral-500 mb-8">C'est gratuit, et ça prend 30 secondes.</Text>

        <View className="gap-4">
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Input
                label="Prénom"
                value={form.firstName}
                onChangeText={set("firstName")}
                placeholder="Maxime"
                autoCapitalize="words"
                error={errors.firstName}
              />
            </View>
            <View className="flex-1">
              <Input
                label="Nom"
                value={form.lastName}
                onChangeText={set("lastName")}
                placeholder="Gazel"
                autoCapitalize="words"
                error={errors.lastName}
              />
            </View>
          </View>

          <Input
            label="Email"
            value={form.email}
            onChangeText={set("email")}
            placeholder="ton@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />

          <Input
            label="Mot de passe"
            value={form.password}
            onChangeText={set("password")}
            placeholder="6 caractères minimum"
            secureTextEntry={!showPassword}
            error={errors.password}
            rightIcon={
              <Text className="text-neutral-500 text-sm">{showPassword ? "Cacher" : "Voir"}</Text>
            }
            onRightIconPress={() => setShowPassword((v) => !v)}
          />

          <Input
            label="Confirmer le mot de passe"
            value={form.confirmPassword}
            onChangeText={set("confirmPassword")}
            placeholder="••••••••"
            secureTextEntry={!showPassword}
            error={errors.confirmPassword}
          />
        </View>

        <View className="mt-8 mb-4">
          <Button label="Créer mon compte" onPress={handleRegister} loading={isLoading} />
        </View>

        <Text className="text-xs text-neutral-400 text-center mb-8">
          En t'inscrivant, tu acceptes les{" "}
          <Text className="text-primary">Conditions d'utilisation</Text> et la{" "}
          <Text className="text-primary">Politique de confidentialité</Text> de SMASHI.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
