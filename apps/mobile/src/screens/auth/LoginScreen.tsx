import { useState } from "react";
import { View, Text, ScrollView, Alert, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "@/navigation/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { loginWithEmail, loginWithGoogle } from "@/services/authService";
import { useAuthStore } from "@/stores/authStore";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { setUser, setLoading, isLoading } = useAuthStore();

  const validate = () => {
    const e: Record<string, string> = {};
    if (!email.includes("@")) e.email = "Email invalide";
    if (password.length < 6) e.password = "6 caractères minimum";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const { user, token } = await loginWithEmail(email.trim().toLowerCase(), password);
      setUser(user, token);
      if (!user.profile) {
        navigation.navigate("OnboardingSport");
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error && err.message.includes("auth/invalid")
          ? "Email ou mot de passe incorrect"
          : "Connexion impossible. Réessaie.";
      Alert.alert("Connexion échouée", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const { user, token } = await loginWithGoogle();
      setUser(user, token);
      if (!user.profile) navigation.navigate("OnboardingSport");
    } catch {
      Alert.alert("Erreur", "Connexion Google impossible.");
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
        {/* Header */}
        <View className="items-center py-10">
          <Text className="text-4xl font-bold text-primary tracking-widest">SMASHI</Text>
          <Text className="text-base text-neutral-500 mt-2">Content de te revoir 👋</Text>
        </View>

        {/* Formulaire */}
        <View className="gap-4">
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="ton@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            error={errors.email}
          />
          <Input
            label="Mot de passe"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry={!showPassword}
            error={errors.password}
            rightIcon={
              <Text className="text-neutral-500 text-sm">
                {showPassword ? "Cacher" : "Voir"}
              </Text>
            }
            onRightIconPress={() => setShowPassword((v) => !v)}
          />

          <TouchableOpacity
            onPress={() => navigation.navigate("ForgotPassword")}
            className="self-end"
          >
            <Text className="text-sm text-primary font-medium">Mot de passe oublié ?</Text>
          </TouchableOpacity>
        </View>

        {/* CTA */}
        <View className="gap-3 mt-8">
          <Button label="Se connecter" onPress={handleLogin} loading={isLoading} />

          <View className="flex-row items-center gap-3 my-2">
            <View className="flex-1 h-px bg-neutral-200" />
            <Text className="text-neutral-500 text-sm">ou</Text>
            <View className="flex-1 h-px bg-neutral-200" />
          </View>

          <Button
            label="Continuer avec Google"
            variant="secondary"
            onPress={handleGoogle}
            loading={isLoading}
          />
        </View>

        {/* Inscription */}
        <View className="flex-row justify-center items-center mt-8 pb-8">
          <Text className="text-neutral-500">Pas encore de compte ? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Register")}>
            <Text className="text-primary font-semibold">S'inscrire</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
