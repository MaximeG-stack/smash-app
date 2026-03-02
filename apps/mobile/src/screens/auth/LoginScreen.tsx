import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "@/navigation/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { loginWithEmail, loginWithGoogleCredential, loginWithAppleCredential } from "@/services/authService";
import { useAuthStore } from "@/stores/authStore";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import * as WebBrowser from "expo-web-browser";

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
const isGoogleConfigured = !!(GOOGLE_CLIENT_ID || GOOGLE_IOS_CLIENT_ID || GOOGLE_ANDROID_CLIENT_ID);

// Import Google auth seulement si configuré (évite le crash si clés absentes)
let Google: typeof import("expo-auth-session/providers/google") | null = null;
if (isGoogleConfigured) {
  WebBrowser.maybeCompleteAuthSession();
  Google = require("expo-auth-session/providers/google");
}

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const { setUser, setOnboardingCompleted, setLoading, isLoading } = useAuthStore();

  const validate = () => {
    const e: Record<string, string> = {};
    if (!email.includes("@")) e.email = "Email invalide";
    if (password.length < 6) e.password = "6 caractères minimum";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setApiError(null);
    setLoading(true);
    try {
      const { user, token } = await loginWithEmail(email.trim().toLowerCase(), password);
      setUser(user, token);
      if (user.profile) {
        setOnboardingCompleted(); // RootNavigator bascule vers Main
      } else {
        navigation.navigate("OnboardingSport");
      }
    } catch (err: unknown) {
      // Extraire les détails de l'erreur backend (axios)
      const axiosErr = err as { response?: { data?: { details?: string; error?: string } } };
      const details = axiosErr?.response?.data?.details;
      const msg = details
        ? `[Debug] ${details}`
        : err instanceof Error && err.message.includes("auth/invalid")
          ? "Email ou mot de passe incorrect"
          : err instanceof Error
            ? err.message
            : "Connexion impossible. Réessaie.";
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-In — hook conditionnel (pas d'appel si clés absentes)
  const googleHook = Google?.useIdTokenAuthRequest
    ? Google.useIdTokenAuthRequest({
        expoClientId: GOOGLE_CLIENT_ID,
        iosClientId: GOOGLE_IOS_CLIENT_ID,
        androidClientId: GOOGLE_ANDROID_CLIENT_ID,
      })
    : null;

  const googleResponse = googleHook?.[1] ?? null;
  const promptGoogle = googleHook?.[2] ?? null;

  const handleGoogleResponse = async () => {
    if (googleResponse?.type !== "success") return;
    const idToken = googleResponse.params.id_token;
    if (!idToken) return;

    setApiError(null);
    setLoading(true);
    try {
      const { user, token } = await loginWithGoogleCredential(idToken);
      setUser(user, token);
      if (user.profile) {
        setOnboardingCompleted();
      } else {
        navigation.navigate("OnboardingSport");
      }
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Connexion Google impossible.");
    } finally {
      setLoading(false);
    }
  };

  // Réagir quand Google répond
  if (googleResponse?.type === "success" && !isLoading) {
    handleGoogleResponse();
  }

  const handleGoogle = () => {
    promptGoogle?.();
  };

  // Apple Sign-In
  const handleApple = async () => {
    setApiError(null);
    setLoading(true);
    try {
      const nonce = Math.random().toString(36).substring(2, 10);
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        nonce,
      );

      const appleCredential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (!appleCredential.identityToken) {
        throw new Error("Pas de token Apple reçu");
      }

      const { user, token } = await loginWithAppleCredential(appleCredential.identityToken, nonce);
      setUser(user, token);
      if (user.profile) {
        setOnboardingCompleted();
      } else {
        navigation.navigate("OnboardingSport");
      }
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      if (error.code !== "ERR_REQUEST_CANCELED") {
        setApiError(error.message ?? "Connexion Apple impossible.");
      }
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logoText}>SMASHI</Text>
          <Text style={styles.subtitleText}>Content de te revoir 👋</Text>
        </View>

        {/* Formulaire */}
        <View style={styles.formContainer}>
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
              <Text style={styles.showPasswordText}>
                {showPassword ? "Cacher" : "Voir"}
              </Text>
            }
            onRightIconPress={() => setShowPassword((v) => !v)}
          />

          <TouchableOpacity
            onPress={() => navigation.navigate("ForgotPassword")}
            style={styles.forgotPasswordButton}
          >
            <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
          </TouchableOpacity>
        </View>

        {/* CTA */}
        <View style={styles.ctaContainer}>
          {apiError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{apiError}</Text>
            </View>
          )}
          <Button label="Se connecter" onPress={handleLogin} loading={isLoading} />

          {(isGoogleConfigured || Platform.OS === "ios") && (
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.dividerLine} />
            </View>
          )}

          {isGoogleConfigured && (
            <Button
              label="Continuer avec Google"
              variant="secondary"
              onPress={handleGoogle}
              loading={isLoading}
            />
          )}

          {Platform.OS === "ios" && (
            <TouchableOpacity
              style={styles.appleButton}
              onPress={handleApple}
              activeOpacity={0.8}
            >
              <Text style={styles.appleButtonText}> Continuer avec Apple</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Inscription */}
        <View style={styles.registerRow}>
          <Text style={styles.registerText}>Pas encore de compte ? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Register")}>
            <Text style={styles.registerLink}>S'inscrire</Text>
          </TouchableOpacity>
        </View>
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
  header: {
    alignItems: "center",
    paddingVertical: 40,
  },
  logoText: {
    fontSize: 36,
    fontWeight: "700",
    color: "#2ECC71",
    letterSpacing: 6,
  },
  subtitleText: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 8,
  },
  formContainer: {
    gap: 16,
  },
  showPasswordText: {
    color: "#6B7280",
    fontSize: 14,
  },
  forgotPasswordButton: {
    alignSelf: "flex-end",
  },
  forgotPasswordText: {
    fontSize: 14,
    color: "#2ECC71",
    fontWeight: "500",
  },
  ctaContainer: {
    gap: 12,
    marginTop: 32,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  dividerText: {
    color: "#6B7280",
    fontSize: 14,
  },
  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 32,
    paddingBottom: 32,
  },
  registerText: {
    color: "#6B7280",
  },
  registerLink: {
    color: "#2ECC71",
    fontWeight: "600",
  },
  errorBanner: {
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    padding: 12,
  },
  errorBannerText: {
    color: "#DC2626",
    fontSize: 14,
    textAlign: "center",
  },
  appleButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
  appleButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
