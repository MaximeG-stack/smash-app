import type { Response } from "express";
import { PrismaClient } from "@prisma/client";
import type { AuthRequest } from "../middleware/auth";
import multer from "multer";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

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
