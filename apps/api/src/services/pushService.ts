import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

/**
 * Envoie une notification push à un utilisateur via l'API Expo Push.
 * Crée aussi la notification in-app dans la BDD.
 * Compatible Expo managed workflow — pas besoin de Firebase Admin SDK.
 */
export async function sendPushNotification(opts: {
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}) {
  const { userId, type, title, body, data } = opts;

  // 1. Créer la notification in-app
  await prisma.notification.create({
    data: {
      userId,
      type: type as never,
      title,
      body,
      data: data ?? undefined,
    },
  });

  // 2. Envoyer la push notification via Expo Push API
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { fcmToken: true },
    });

    // fcmToken contient en fait l'Expo Push Token (ExponentPushToken[xxx])
    if (!user?.fcmToken) return;

    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        to: user.fcmToken,
        title,
        body,
        data: data ?? {},
        sound: "default",
        channelId: "smashi_default",
      }),
    });

    const result = (await response.json()) as {
      data?: Array<{ status: string; message?: string; details?: { error?: string } }>;
    };

    // Vérifier les erreurs de token
    if (result.data?.[0]?.status === "error") {
      const detail = result.data[0].details?.error;
      if (detail === "DeviceNotRegistered") {
        await prisma.user.update({
          where: { id: userId },
          data: { fcmToken: null },
        });
        console.warn(`[Push] Token invalide pour user ${userId}, nettoyé`);
      } else {
        console.error("[Push] Erreur Expo:", result.data[0].message);
      }
    }
  } catch (err) {
    console.error("[Push] Erreur envoi:", err);
  }
}
