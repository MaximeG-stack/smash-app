import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
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
  const [apiError, setApiError] = useState<string | null>(null);
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
    setApiError(null);
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
          : err instanceof Error
            ? err.message
            : "Inscription impossible. Réessaie.";
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Créer un compte</Text>
        <Text style={styles.subtitle}>C'est gratuit, et ça prend 30 secondes.</Text>

        <View style={styles.formContainer}>
          <View style={styles.nameRow}>
            <View style={styles.nameField}>
              <Input
                label="Prénom"
                value={form.firstName}
                onChangeText={set("firstName")}
                placeholder="Maxime"
                autoCapitalize="words"
                error={errors.firstName}
              />
            </View>
            <View style={styles.nameField}>
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
              <Text style={styles.showPasswordText}>{showPassword ? "Cacher" : "Voir"}</Text>
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

        {apiError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{apiError}</Text>
          </View>
        )}

        <View style={styles.submitContainer}>
          <Button label="Créer mon compte" onPress={handleRegister} loading={isLoading} />
        </View>

        <Text style={styles.legalText}>
          En t'inscrivant, tu acceptes les{" "}
          <Text style={styles.legalLink}>Conditions d'utilisation</Text> et la{" "}
          <Text style={styles.legalLink}>Politique de confidentialité</Text> de SMASHI.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  backButton: {
    marginTop: 16,
    marginBottom: 24,
  },
  backText: {
    color: "#6B7280",
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#1A1A2E",
    marginBottom: 8,
  },
  subtitle: {
    color: "#6B7280",
    marginBottom: 32,
  },
  formContainer: {
    gap: 16,
  },
  nameRow: {
    flexDirection: "row",
    gap: 12,
  },
  nameField: {
    flex: 1,
  },
  showPasswordText: {
    color: "#6B7280",
    fontSize: 14,
  },
  submitContainer: {
    marginTop: 32,
    marginBottom: 16,
  },
  legalText: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    marginBottom: 32,
  },
  legalLink: {
    color: "#2ECC71",
  },
  errorBanner: {
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  errorBannerText: {
    color: "#DC2626",
    fontSize: 14,
    textAlign: "center",
  },
});
