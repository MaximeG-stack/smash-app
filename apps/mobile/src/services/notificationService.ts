import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { api } from "./api";

// Configuration du comportement des notifications en foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Demande la permission et enregistre le token push auprès du backend.
 * Retourne le token Expo Push ou null si refusé/indisponible.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Les notifications push ne fonctionnent que sur un vrai device
  if (!Device.isDevice) {
    console.warn("[Push] Notifications push indisponibles sur simulateur");
    return null;
  }

  // Vérifier/demander la permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("[Push] Permission notifications refusée");
    return null;
  }

  // Canal Android
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("smashi_default", {
      name: "SMASHI",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#2ECC71",
    });
  }

  // Obtenir le token
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    const token = tokenData.data;

    // Envoyer au backend
    await api.post("/api/users/fcm-token", { token });

    return token;
  } catch (err) {
    console.error("[Push] Erreur obtention token:", err);
    return null;
  }
}

/**
 * Écoute les notifications reçues (foreground + tap).
 * Retourne une fonction de cleanup.
 */
export function setupNotificationListeners(onTap: (data: Record<string, unknown>) => void): () => void {
  // Notification reçue en foreground (juste pour le log)
  const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
    console.log("[Push] Notification reçue:", notification.request.content.title);
  });

  // Notification tapée par l'utilisateur
  const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as Record<string, unknown>;
    onTap(data);
  });

  return () => {
    receivedSub.remove();
    responseSub.remove();
  };
}
