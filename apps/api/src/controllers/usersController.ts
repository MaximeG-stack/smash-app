import type { Response } from "express";
import { PrismaClient } from "@prisma/client";
import type { AuthRequest } from "../middleware/auth";
import multer from "multer";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { getSuggestionsForUser, calculateCompatibility } from "../services/compatibilityService";

const prisma = new PrismaClient();

// ── GET /api/users/me ────────────────────────────────────────
export async function getProfile(req: AuthRequest, res: Response) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { profile: true },
    });
    if (!user) { res.status(404).json({ error: "Introuvable" }); return; }
    res.json({ user });
  } catch (err) {
    console.error("[getProfile]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
}

// ── GET /api/users/suggestions ────────────────────────────────
export async function getSuggestions(req: AuthRequest, res: Response) {
  const limit = Math.min(20, parseInt(req.query.limit as string) || 10);

  try {
    const suggestions = await getSuggestionsForUser(req.userId!, limit);
    res.json({ suggestions });
  } catch (err) {
    console.error("[getSuggestions]", err);
    res.status(500).json({ error: "Erreur lors de la récupération des suggestions" });
  }
}

// ── GET /api/users/favorites ─────────────────────────────────
export async function getFavorites(req: AuthRequest, res: Response) {
  try {
    const favorites = await prisma.userFavorite.findMany({
      where: { userId: req.userId },
      include: {
        favorite: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            profile: {
              select: {
                sports: true,
                primarySport: true,
                level: true,
                city: true,
                totalMatchesPlayed: true,
                latitude: true,
                longitude: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Récupérer le profil courant pour le calcul de compatibilité
    const currentUser = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { profile: true },
    });

    const results = favorites.map((fav) => {
      let compatibility = null;
      if (currentUser?.profile && fav.favorite.profile) {
        const myProfile = {
          userId: currentUser.id,
          sports: currentUser.profile.sports,
          primarySport: currentUser.profile.primarySport,
          level: currentUser.profile.level,
          latitude: currentUser.profile.latitude,
          longitude: currentUser.profile.longitude,
        };
        const theirProfile = {
          userId: fav.favorite.id,
          sports: fav.favorite.profile.sports,
          primarySport: fav.favorite.profile.primarySport,
          level: fav.favorite.profile.level,
          latitude: fav.favorite.profile.latitude,
          longitude: fav.favorite.profile.longitude,
        };
        compatibility = calculateCompatibility(myProfile, theirProfile, 0, true);
      }

      return {
        user: {
          id: fav.favorite.id,
          firstName: fav.favorite.firstName,
          lastName: fav.favorite.lastName,
          avatarUrl: fav.favorite.avatarUrl,
          profile: fav.favorite.profile ? {
            sports: fav.favorite.profile.sports,
            primarySport: fav.favorite.profile.primarySport,
            level: fav.favorite.profile.level,
            city: fav.favorite.profile.city,
            totalMatchesPlayed: fav.favorite.profile.totalMatchesPlayed,
          } : null,
        },
        compatibility,
      };
    });

    res.json({ favorites: results });
  } catch (err) {
    console.error("[getFavorites]", err);
    res.status(500).json({ error: "Erreur lors de la récupération des favoris" });
  }
}

// ── GET /api/users/:id (profil public) ───────────────────────
export async function getPublicProfile(req: AuthRequest, res: Response) {
  const { id } = req.params;

  try {
    const targetUser = await prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });

    if (!targetUser) { res.status(404).json({ error: "Joueur introuvable" }); return; }

    // Profil public (pas d'email, pas de coordonnées exactes)
    const publicUser = {
      id: targetUser.id,
      firstName: targetUser.firstName,
      lastName: targetUser.lastName,
      avatarUrl: targetUser.avatarUrl,
      profile: targetUser.profile ? {
        sports: targetUser.profile.sports,
        primarySport: targetUser.profile.primarySport,
        level: targetUser.profile.level,
        city: targetUser.profile.city,
        bio: targetUser.profile.bio,
        totalMatchesPlayed: targetUser.profile.totalMatchesPlayed,
        isHandisport: targetUser.profile.isHandisport,
      } : null,
    };

    // Vérifier si c'est un favori
    const favoriteEntry = await prisma.userFavorite.findUnique({
      where: { userId_favoriteId: { userId: req.userId!, favoriteId: id } },
    });
    const isFavorite = !!favoriteEntry;

    // Calculer la compatibilité
    let compatibility: ReturnType<typeof calculateCompatibility> | null = null;
    if (req.userId !== id) {
      const currentUser = await prisma.user.findUnique({
        where: { id: req.userId },
        include: { profile: true },
      });

      if (currentUser?.profile && targetUser.profile) {
        // Compter les parties jouées ensemble
        const myMatchIds = await prisma.matchPlayer.findMany({
          where: { userId: req.userId },
          select: { matchId: true },
        });
        const sharedMatches = await prisma.matchPlayer.count({
          where: {
            userId: id,
            matchId: { in: myMatchIds.map((m) => m.matchId) },
          },
        });

        // Vérifier favoris mutuels
        const reverseFav = await prisma.userFavorite.findUnique({
          where: { userId_favoriteId: { userId: id, favoriteId: req.userId! } },
        });
        const isMutual = isFavorite && !!reverseFav;

        compatibility = calculateCompatibility(
          {
            userId: currentUser.id,
            sports: currentUser.profile.sports,
            primarySport: currentUser.profile.primarySport,
            level: currentUser.profile.level,
            latitude: currentUser.profile.latitude,
            longitude: currentUser.profile.longitude,
          },
          {
            userId: targetUser.id,
            sports: targetUser.profile.sports,
            primarySport: targetUser.profile.primarySport,
            level: targetUser.profile.level,
            latitude: targetUser.profile.latitude,
            longitude: targetUser.profile.longitude,
          },
          sharedMatches,
          isMutual,
        );
      }
    }

    res.json({ user: publicUser, isFavorite, compatibility });
  } catch (err) {
    console.error("[getPublicProfile]", err);
    res.status(500).json({ error: "Erreur lors de la récupération du profil" });
  }
}

// ── GET /api/users/:id/compatibility ─────────────────────────
export async function getCompatibility(req: AuthRequest, res: Response) {
  const { id } = req.params;

  if (req.userId === id) {
    res.status(400).json({ error: "Impossible de calculer la compatibilité avec toi-même" });
    return;
  }

  try {
    const [currentUser, targetUser] = await Promise.all([
      prisma.user.findUnique({ where: { id: req.userId }, include: { profile: true } }),
      prisma.user.findUnique({ where: { id }, include: { profile: true } }),
    ]);

    if (!targetUser) { res.status(404).json({ error: "Joueur introuvable" }); return; }
    if (!currentUser?.profile || !targetUser.profile) {
      res.status(400).json({ error: "Profil incomplet" });
      return;
    }

    const myMatchIds = await prisma.matchPlayer.findMany({
      where: { userId: req.userId },
      select: { matchId: true },
    });
    const sharedMatches = await prisma.matchPlayer.count({
      where: { userId: id, matchId: { in: myMatchIds.map((m) => m.matchId) } },
    });

    const [fav1, fav2] = await Promise.all([
      prisma.userFavorite.findUnique({ where: { userId_favoriteId: { userId: req.userId!, favoriteId: id } } }),
      prisma.userFavorite.findUnique({ where: { userId_favoriteId: { userId: id, favoriteId: req.userId! } } }),
    ]);

    // Récupérer les feedbacks croisés entre les 2 joueurs
    const sharedMatchIdList = myMatchIds.map((m) => m.matchId);
    const feedbacks = sharedMatchIdList.length > 0
      ? await prisma.matchFeedback.findMany({
          where: {
            matchId: { in: sharedMatchIdList },
            userId: { in: [req.userId!, id] },
          },
          select: { matchId: true, userId: true, levelRating: true, overallRating: true },
        })
      : [];

    const balancedCount = feedbacks.filter((f) => f.levelRating === "BALANCED").length;
    const targetRatings = feedbacks.filter((f) => f.userId === id && f.overallRating);
    const avgOverallRating = targetRatings.length > 0
      ? targetRatings.reduce((sum, f) => sum + f.overallRating, 0) / targetRatings.length
      : 3;

    const feedbackData = feedbacks.length > 0
      ? { balancedCount, totalFeedbacks: feedbacks.length, avgOverallRating }
      : null;

    const compatibility = calculateCompatibility(
      {
        userId: currentUser.id,
        sports: currentUser.profile.sports,
        primarySport: currentUser.profile.primarySport,
        level: currentUser.profile.level,
        latitude: currentUser.profile.latitude,
        longitude: currentUser.profile.longitude,
      },
      {
        userId: targetUser.id,
        sports: targetUser.profile.sports,
        primarySport: targetUser.profile.primarySport,
        level: targetUser.profile.level,
        latitude: targetUser.profile.latitude,
        longitude: targetUser.profile.longitude,
      },
      sharedMatches,
      !!fav1 && !!fav2,
      feedbackData,
    );

    res.json({ compatibility });
  } catch (err) {
    console.error("[getCompatibility]", err);
    res.status(500).json({ error: "Erreur lors du calcul de compatibilité" });
  }
}

// ── POST /api/users/:id/favorite ─────────────────────────────
export async function addFavorite(req: AuthRequest, res: Response) {
  const { id } = req.params;

  if (req.userId === id) {
    res.status(400).json({ error: "Tu ne peux pas te mettre en favori" });
    return;
  }

  try {
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) { res.status(404).json({ error: "Joueur introuvable" }); return; }

    await prisma.userFavorite.upsert({
      where: { userId_favoriteId: { userId: req.userId!, favoriteId: id } },
      update: {},
      create: { userId: req.userId!, favoriteId: id },
    });

    res.json({ success: true });
  } catch (err) {
    console.error("[addFavorite]", err);
    res.status(500).json({ error: "Erreur lors de l'ajout aux favoris" });
  }
}

// ── DELETE /api/users/:id/favorite ───────────────────────────
export async function removeFavorite(req: AuthRequest, res: Response) {
  const { id } = req.params;

  try {
    await prisma.userFavorite.deleteMany({
      where: { userId: req.userId!, favoriteId: id },
    });

    res.json({ success: true });
  } catch (err) {
    console.error("[removeFavorite]", err);
    res.status(500).json({ error: "Erreur lors de la suppression du favori" });
  }
}

// ── POST /api/users/fcm-token ────────────────────────────────
export async function registerFcmToken(req: AuthRequest, res: Response) {
  const { token } = req.body;
  if (!token || typeof token !== "string") {
    res.status(400).json({ error: "Token FCM requis" });
    return;
  }

  try {
    await prisma.user.update({
      where: { id: req.userId! },
      data: { fcmToken: token },
    });
    res.json({ success: true });
  } catch (err) {
    console.error("[registerFcmToken]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
}

// ── PATCH /api/users/profile ─────────────────────────────────
export async function updateProfile(req: AuthRequest, res: Response) {
  const {
    sports,
    primarySport,
    level,
    fftRanking,
    latitude,
    longitude,
    city,
    postalCode,
    searchRadius,
    availabilities,
    preferredPosition,
    isHandisport,
    handicapDetails,
    bio,
  } = req.body;

  try {
    const profile = await prisma.userProfile.upsert({
      where: { userId: req.userId! },
      update: {
        ...(sports !== undefined && { sports }),
        ...(primarySport !== undefined && { primarySport }),
        ...(level !== undefined && { level }),
        ...(fftRanking !== undefined && { fftRanking }),
        ...(latitude !== undefined && { latitude }),
        ...(longitude !== undefined && { longitude }),
        ...(city !== undefined && { city }),
        ...(postalCode !== undefined && { postalCode }),
        ...(searchRadius !== undefined && { searchRadius }),
        ...(availabilities !== undefined && { availabilities }),
        ...(preferredPosition !== undefined && { preferredPosition }),
        ...(isHandisport !== undefined && { isHandisport }),
        ...(handicapDetails !== undefined && { handicapDetails }),
        ...(bio !== undefined && { bio }),
      },
      create: {
        userId: req.userId!,
        sports: sports ?? [],
        primarySport,
        level: level ?? "BEGINNER",
        fftRanking,
        latitude,
        longitude,
        city,
        postalCode,
        searchRadius: searchRadius ?? 20,
        availabilities,
        preferredPosition,
        isHandisport: isHandisport ?? false,
        handicapDetails,
        bio,
      },
    });

    res.json({ profile });
  } catch (err) {
    console.error("[updateProfile]", err);
    res.status(500).json({ error: "Erreur mise à jour profil" });
  }
}

// ── POST /api/users/avatar ───────────────────────────────────
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

export const uploadAvatar = [
  upload.single("avatar"),
  async (req: AuthRequest, res: Response) => {
    if (!req.file) { res.status(400).json({ error: "Fichier manquant" }); return; }

    try {
      // Fallback local (dev) quand R2 n'est pas configuré
      if (!process.env.R2_ACCOUNT_ID) {
        const base64 = req.file.buffer.toString("base64");
        const avatarUrl = `data:${req.file.mimetype};base64,${base64}`;
        await prisma.user.update({ where: { id: req.userId }, data: { avatarUrl } });
        res.json({ avatarUrl });
        return;
      }

      const s3 = new S3Client({
        region: "auto",
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
        },
      });

      const key = `avatars/${req.userId}-${randomUUID()}.jpg`;

      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: key,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
          ACL: "public-read",
        }),
      );

      const avatarUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

      await prisma.user.update({
        where: { id: req.userId },
        data: { avatarUrl },
      });

      res.json({ avatarUrl });
    } catch (err) {
      console.error("[uploadAvatar]", err);
      res.status(500).json({ error: "Upload échoué" });
    }
  },
];
