import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, Image, StyleSheet, Platform, Modal, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import { useAuthStore } from "@/stores/authStore";
import { logout } from "@/services/authService";
import { api } from "@/services/api";
import type { TabToMainNavProp } from "@/navigation/types";
import { SportBadge, LevelBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { Sport } from "@/types";

async function compressImageWeb(uri: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const MAX = 800;
      const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("canvas context unavailable")); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error("toBlob failed")),
        "image/jpeg",
        0.8,
      );
    };
    img.onerror = reject;
    img.src = uri;
  });
}

export function ProfileScreen() {
  const navigation = useNavigation<TabToMainNavProp>();
  const { user, logout: clearAuth, updateUser } = useAuthStore();
  const profile = user?.profile;
  const [uploading, setUploading] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editRadius, setEditRadius] = useState(20);
  const [editSaving, setEditSaving] = useState(false);

  const handleLogout = async () => {
    const confirmed =
      Platform.OS === "web"
        ? window.confirm("Tu veux vraiment te déconnecter ?")
        : await new Promise<boolean>((resolve) => {
            Alert.alert("Déconnexion", "Tu veux vraiment te déconnecter ?", [
              { text: "Annuler", style: "cancel", onPress: () => resolve(false) },
              { text: "Déconnexion", style: "destructive", onPress: () => resolve(true) },
            ]);
          });
    if (confirmed) {
      await logout();
      clearAuth();
    }
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
        if (Platform.OS === "web") {
          // Sur web : redimensionner + compresser via canvas avant upload
          const blob = await compressImageWeb(result.assets[0].uri);
          formData.append("avatar", blob, "avatar.jpg");
        } else {
          formData.append("avatar", {
            uri: result.assets[0].uri,
            type: "image/jpeg",
            name: "avatar.jpg",
          } as unknown as Blob);
        }

        const { data } = await api.post("/api/users/avatar", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (user) {
          updateUser({ ...user, avatarUrl: data.avatarUrl });
        }
        Alert.alert("Succès", "Photo de profil mise à jour !");
      } catch {
        Alert.alert("Erreur", "Impossible de mettre à jour la photo.");
      } finally {
        setUploading(false);
      }
    }
  };

  const openEdit = () => {
    setEditBio(profile?.bio ?? "");
    setEditCity(profile?.city ?? "");
    setEditRadius(profile?.searchRadius ?? 20);
    setEditVisible(true);
  };

  const handleEditSave = async () => {
    setEditSaving(true);
    try {
      await api.patch("/api/users/profile", {
        bio: editBio || undefined,
        city: editCity || undefined,
        searchRadius: editRadius,
      });
      const { data } = await api.get("/api/users/me");
      updateUser(data.user);
      setEditVisible(false);
    } catch {
      Alert.alert("Erreur", "Impossible de sauvegarder les modifications.");
    } finally {
      setEditSaving(false);
    }
  };

  const displayName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();

  return (
    <>
    <Modal visible={editVisible} animationType="slide" onRequestClose={() => setEditVisible(false)}>
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setEditVisible(false)}>
            <Text style={styles.modalCancel}>Annuler</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Mon profil</Text>
          <TouchableOpacity onPress={handleEditSave} disabled={editSaving}>
            <Text style={[styles.modalSave, editSaving && { opacity: 0.5 }]}>
              {editSaving ? "..." : "Enregistrer"}
            </Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
          <Text style={styles.fieldLabel}>Ville</Text>
          <TextInput
            style={styles.fieldInput}
            value={editCity}
            onChangeText={setEditCity}
            placeholder="Ex : Marseille"
          />
          <Text style={styles.fieldLabel}>Rayon de recherche (km)</Text>
          <TextInput
            style={styles.fieldInput}
            value={String(editRadius)}
            onChangeText={(v) => setEditRadius(Number(v) || 20)}
            keyboardType="numeric"
          />
          <Text style={styles.fieldLabel}>Bio</Text>
          <TextInput
            style={[styles.fieldInput, styles.fieldTextarea]}
            value={editBio}
            onChangeText={setEditBio}
            placeholder="Dis quelque chose sur toi..."
            multiline
            numberOfLines={4}
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header profil */}
        <View style={styles.profileHeader}>
          {/* Avatar */}
          <TouchableOpacity onPress={handleAvatarPick} disabled={uploading}>
            <View style={styles.avatarWrapper}>
              {user?.avatarUrl ? (
                <Image
                  source={{ uri: user.avatarUrl }}
                  style={styles.avatarImage}
                />
              ) : (
                <Text style={styles.avatarInitial}>
                  {user?.firstName?.[0]?.toUpperCase() ?? "?"}
                </Text>
              )}
            </View>
            <View style={styles.avatarEditBadge}>
              <Text style={styles.avatarEditEmoji}>📷</Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.displayName}>{displayName}</Text>
          {profile?.city && (
            <Text style={styles.cityText}>📍 {profile.city}</Text>
          )}

          {/* Sports */}
          {profile?.sports && profile.sports.length > 0 && (
            <View style={styles.sportsRow}>
              {profile.sports.map((sport) => (
                <SportBadge key={sport} sport={sport as Sport} />
              ))}
            </View>
          )}

          {/* Niveau */}
          {profile?.level && (
            <View style={styles.levelContainer}>
              <LevelBadge level={profile.level} />
            </View>
          )}

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {profile?.totalMatchesPlayed ?? 0}
              </Text>
              <Text style={styles.statLabel}>Parties jouées</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {profile?.searchRadius ?? 20} km
              </Text>
              <Text style={styles.statLabel}>Rayon de recherche</Text>
            </View>
            {profile?.fftRanking && (
              <>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{profile.fftRanking}</Text>
                  <Text style={styles.statLabel}>Classement FFT</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Section bio */}
        {profile?.bio && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>À propos</Text>
            <Text style={styles.cardText}>{profile.bio}</Text>
          </View>
        )}

        {/* Badge handisport */}
        {profile?.isHandisport && (
          <View style={styles.handisportCard}>
            <Text style={styles.handisportEmoji}>♿</Text>
            <View>
              <Text style={styles.handisportTitle}>Joueur handisport</Text>
              {profile.handicapDetails && (
                <Text style={styles.handisportDetail}>{profile.handicapDetails}</Text>
              )}
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.favoritesBtn}
            onPress={() => navigation.navigate("Players")}
            activeOpacity={0.8}
          >
            <Text style={styles.favoritesBtnEmoji}>♥</Text>
            <Text style={styles.favoritesBtnText}>Mes favoris</Text>
            <Text style={styles.favoritesBtnArrow}>→</Text>
          </TouchableOpacity>
          <Button
            label="Modifier mon profil"
            variant="secondary"
            onPress={openEdit}
          />
          <Button
            label="Se déconnecter"
            variant="tertiary"
            onPress={handleLogout}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  avatarWrapper: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#EAFAF1",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#2ECC71",
    overflow: "hidden",
  },
  avatarImage: {
    width: 88,
    height: 88,
  },
  avatarInitial: {
    fontSize: 36,
  },
  avatarEditBadge: {
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
    borderColor: "#FFFFFF",
  },
  avatarEditEmoji: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  displayName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginTop: 16,
  },
  cityText: {
    color: "#6B7280",
    marginTop: 4,
  },
  sportsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  levelContainer: {
    marginTop: 12,
  },
  statsRow: {
    flexDirection: "row",
    gap: 32,
    marginTop: 24,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: "#E5E7EB",
  },
  card: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  cardText: {
    color: "#4B5563",
  },
  handisportCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  handisportEmoji: {
    fontSize: 24,
  },
  handisportTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  handisportDetail: {
    fontSize: 14,
    color: "#6B7280",
  },
  actionsContainer: {
    paddingHorizontal: 24,
    marginTop: 32,
    gap: 12,
    paddingBottom: 32,
  },
  favoritesBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 12,
  },
  favoritesBtnEmoji: {
    fontSize: 20,
    color: "#E74C3C",
  },
  favoritesBtnText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A2E",
  },
  favoritesBtnArrow: {
    fontSize: 16,
    color: "#6B7280",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  modalCancel: {
    fontSize: 16,
    color: "#6B7280",
  },
  modalSave: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2ECC71",
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
    marginTop: 16,
  },
  fieldInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
  },
  fieldTextarea: {
    height: 100,
    textAlignVertical: "top",
  },
});
