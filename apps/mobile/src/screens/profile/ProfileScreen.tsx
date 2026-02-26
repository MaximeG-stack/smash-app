import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useAuthStore } from "@/stores/authStore";
import { logout } from "@/services/authService";
import { api } from "@/services/api";
import { SportBadge, LevelBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { Sport } from "@/types";

export function ProfileScreen() {
  const { user, logout: clearAuth } = useAuthStore();
  const profile = user?.profile;
  const [uploading, setUploading] = useState(false);

  const handleLogout = () => {
    Alert.alert("Déconnexion", "Tu veux vraiment te déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Déconnexion",
        style: "destructive",
        onPress: async () => {
          await logout();
          clearAuth();
        },
      },
    ]);
  };

  const handleAvatarPick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission refusée", "Autorise l'accès à ta galerie dans les réglages.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("avatar", {
          uri: result.assets[0].uri,
          type: "image/jpeg",
          name: "avatar.jpg",
        } as unknown as Blob);

        await api.post("/api/users/avatar", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        Alert.alert("Succès", "Photo de profil mise à jour !");
      } catch {
        Alert.alert("Erreur", "Impossible de mettre à jour la photo.");
      } finally {
        setUploading(false);
      }
    }
  };

  const displayName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();

  return (
    <SafeAreaView className="flex-1 bg-neutral-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header profil */}
        <View className="bg-white px-6 pt-6 pb-8 items-center border-b border-neutral-200">
          {/* Avatar */}
          <TouchableOpacity onPress={handleAvatarPick} disabled={uploading}>
            <View
              style={{
                width: 88,
                height: 88,
                borderRadius: 44,
                backgroundColor: "#EAFAF1",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 3,
                borderColor: "#2ECC71",
                overflow: "hidden",
              }}
            >
              {user?.avatarUrl ? (
                <Image
                  source={{ uri: user.avatarUrl }}
                  style={{ width: 88, height: 88 }}
                />
              ) : (
                <Text style={{ fontSize: 36 }}>
                  {user?.firstName?.[0]?.toUpperCase() ?? "?"}
                </Text>
              )}
            </View>
            <View
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: "#2ECC71",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 2,
                borderColor: "#fff",
              }}
            >
              <Text style={{ color: "#fff", fontSize: 14 }}>📷</Text>
            </View>
          </TouchableOpacity>

          <Text className="text-2xl font-bold text-neutral-900 mt-4">{displayName}</Text>
          {profile?.city && (
            <Text className="text-neutral-500 mt-1">📍 {profile.city}</Text>
          )}

          {/* Sports */}
          {profile?.sports && profile.sports.length > 0 && (
            <View className="flex-row gap-2 mt-4 flex-wrap justify-center">
              {profile.sports.map((sport) => (
                <SportBadge key={sport} sport={sport as Sport} />
              ))}
            </View>
          )}

          {/* Niveau */}
          {profile?.level && (
            <View className="mt-3">
              <LevelBadge level={profile.level} />
            </View>
          )}

          {/* Stats */}
          <View className="flex-row gap-8 mt-6">
            <View className="items-center">
              <Text className="text-2xl font-bold text-neutral-900" style={{ fontFamily: "JetBrainsMono_500Medium" }}>
                {profile?.totalMatchesPlayed ?? 0}
              </Text>
              <Text className="text-xs text-neutral-500 mt-1">Parties jouées</Text>
            </View>
            <View className="w-px bg-neutral-200" />
            <View className="items-center">
              <Text className="text-2xl font-bold text-neutral-900" style={{ fontFamily: "JetBrainsMono_500Medium" }}>
                {profile?.searchRadius ?? 20} km
              </Text>
              <Text className="text-xs text-neutral-500 mt-1">Rayon de recherche</Text>
            </View>
            {profile?.fftRanking && (
              <>
                <View className="w-px bg-neutral-200" />
                <View className="items-center">
                  <Text className="text-2xl font-bold text-neutral-900" style={{ fontFamily: "JetBrainsMono_500Medium" }}>
                    {profile.fftRanking}
                  </Text>
                  <Text className="text-xs text-neutral-500 mt-1">Classement FFT</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Section bio */}
        {profile?.bio && (
          <View className="bg-white mx-4 mt-4 p-4 rounded-card border border-neutral-200">
            <Text className="text-sm font-semibold text-neutral-700 mb-2">À propos</Text>
            <Text className="text-neutral-600">{profile.bio}</Text>
          </View>
        )}

        {/* Badge handisport */}
        {profile?.isHandisport && (
          <View className="bg-white mx-4 mt-4 p-4 rounded-card border border-neutral-200 flex-row items-center gap-3">
            <Text style={{ fontSize: 24 }}>♿</Text>
            <View>
              <Text className="text-sm font-semibold text-neutral-900">Joueur handisport</Text>
              {profile.handicapDetails && (
                <Text className="text-sm text-neutral-500">{profile.handicapDetails}</Text>
              )}
            </View>
          </View>
        )}

        {/* Actions */}
        <View className="px-6 mt-8 gap-3 pb-8">
          <Button
            label="Modifier mon profil"
            variant="secondary"
            onPress={() => {
              // TODO : navigation vers EditProfileScreen
            }}
          />
          <Button
            label="Se déconnecter"
            variant="tertiary"
            onPress={handleLogout}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
