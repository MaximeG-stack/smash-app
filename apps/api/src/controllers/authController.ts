import type { Request, Response } from "express";
import * as admin from "firebase-admin";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import type { AuthRequest } from "../middleware/auth";

const prisma = new PrismaClient();

function signJwt(userId: string, role: string): string {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET ?? "secret",
    { expiresIn: process.env.JWT_EXPIRES_IN ?? "7d" } as jwt.SignOptions,
  );
}

async function verifyFirebaseToken(token: string) {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(
        JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY ?? "{}"),
      ),
    });
  }
  return admin.auth().verifyIdToken(token);
}

// ── POST /api/auth/register ──────────────────────────────────
export async function register(req: Request, res: Response) {
  const { firebaseToken, firstName, lastName } = req.body;

  if (!firebaseToken || !firstName || !lastName) {
    res.status(400).json({ error: "Champs manquants" });
    return;
  }

  try {
    const decoded = await verifyFirebaseToken(firebaseToken);

    const user = await prisma.user.create({
      data: {
        email: decoded.email ?? "",
        firebaseUid: decoded.uid,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      },
    });

    const token = signJwt(user.id, user.role);
    res.status(201).json({ user, token });
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      err.message.includes("Unique constraint") &&
      err.message.includes("email")
    ) {
      res.status(409).json({ error: "Cet email est déjà utilisé" });
    } else {
      console.error("[register]", err);
      res.status(500).json({ error: "Erreur lors de l'inscription" });
    }
  }
}

// ── POST /api/auth/login ─────────────────────────────────────
export async function login(req: Request, res: Response) {
  const { firebaseToken } = req.body;

  if (!firebaseToken) {
    res.status(400).json({ error: "Token Firebase manquant" });
    return;
  }

  try {
    const decoded = await verifyFirebaseToken(firebaseToken);

    const user = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
      include: { profile: true },
    });

    if (!user) {
      res.status(404).json({ error: "Utilisateur introuvable. Inscris-toi d'abord." });
      return;
    }

    const token = signJwt(user.id, user.role);
    res.json({ user, token });
  } catch (err) {
    console.error("[login]", err);
    res.status(401).json({ error: "Token Firebase invalide" });
  }
}

// ── GET /api/auth/me ─────────────────────────────────────────
export async function getMe(req: AuthRequest, res: Response) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { profile: true },
    });

    if (!user) {
      res.status(404).json({ error: "Utilisateur introuvable" });
      return;
    }

    res.json({ user });
  } catch (err) {
    console.error("[getMe]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
}
