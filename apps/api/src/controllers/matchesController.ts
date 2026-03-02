import type { Response } from "express";
import { PrismaClient, Prisma, Sport, PlayerLevel, MatchStatus } from "@prisma/client";
import type { AuthRequest } from "../middleware/auth";
import { sendPushNotification } from "../services/pushService";

const prisma = new PrismaClient();

// Sélection des champs creator pour les listes
const creatorSelect = {
  id: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
} as const;

// Helper : transitions de statut lazy (appelé dans getMatchById)
async function applyStatusTransitions(match: { id: string; status: string; scheduledAt: Date; durationMinutes: number }) {
  const now = new Date();
  const endTime = new Date(match.scheduledAt.getTime() + match.durationMinutes * 60_000);
  let newStatus: string = match.status;

  if ((match.status === "OPEN" || match.status === "FULL") && match.scheduledAt < now) {
    newStatus = "IN_PROGRESS";
  } else if (match.status === "IN_PROGRESS" && endTime < now) {
    newStatus = "COMPLETED";
  }

  if (newStatus !== match.status) {
    await prisma.match.update({ where: { id: match.id }, data: { status: newStatus as MatchStatus } });
    match.status = newStatus;
  }
}

// ── POST /api/matches ─────────────────────────────────────────
export async function createMatch(req: AuthRequest, res: Response) {
  const {
    sport, title, description, locationName, latitude, longitude,
    scheduledAt, durationMinutes, requiredLevel, levelFlexibility, maxPlayers, isPublic,
  } = req.body;

  if (!sport || !locationName || latitude === undefined || longitude === undefined || !scheduledAt || !maxPlayers) {
    res.status(400).json({ error: "Champs manquants : sport, locationName, latitude, longitude, scheduledAt, maxPlayers" });
    return;
  }

  const validSports = ["TENNIS", "PADEL", "SQUASH"];
  if (!validSports.includes(sport)) { res.status(400).json({ error: "Sport invalide" }); return; }

  const parsedDate = new Date(scheduledAt);
  if (isNaN(parsedDate.getTime())) { res.status(400).json({ error: "Date invalide" }); return; }
  if (parsedDate < new Date()) { res.status(400).json({ error: "La date de la partie doit être dans le futur" }); return; }

  const parsedMaxPlayers = parseInt(maxPlayers);
  if (isNaN(parsedMaxPlayers) || parsedMaxPlayers < 2 || parsedMaxPlayers > 10) {
    res.status(400).json({ error: "Nombre de joueurs invalide (2-10)" });
    return;
  }

  try {
    const match = await prisma.$transaction(async (tx) => {
      const newMatch = await tx.match.create({
        data: {
          creatorId: req.userId!,
          sport: sport as Sport,
          title: title?.trim() || null,
          description: description?.trim() || null,
          locationName: locationName.trim(),
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          scheduledAt: parsedDate,
          durationMinutes: parseInt(durationMinutes) || 60,
          requiredLevel: requiredLevel || null,
          levelFlexibility: parseInt(levelFlexibility) || 1,
          maxPlayers: parsedMaxPlayers,
          currentPlayers: 1,
          isPublic: isPublic !== false,
          status: "OPEN",
        },
        include: {
          creator: { select: creatorSelect },
          players: { include: { user: { select: creatorSelect } } },
        },
      });
      await tx.matchPlayer.create({ data: { matchId: newMatch.id, userId: req.userId! } });
      return newMatch;
    });

    res.status(201).json({ match });
  } catch (err) {
    console.error("[createMatch]", err);
    res.status(500).json({ error: "Erreur lors de la création de la partie" });
  }
}

// ── GET /api/matches ──────────────────────────────────────────
export async function getMatches(req: AuthRequest, res: Response) {
  const { sport, level, lat, lng, radius, date, status, search, page, limit, sort } = req.query;

  try {
    const where: Prisma.MatchWhereInput = {};

    where.status = (status as MatchStatus) || "OPEN";
    if (sport) where.sport = sport as Sport;
    if (level) where.requiredLevel = level as PlayerLevel;

    if (date) {
      const filterDate = new Date(date as string);
      filterDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(filterDate);
      nextDay.setDate(nextDay.getDate() + 1);
      where.scheduledAt = { gte: filterDate, lt: nextDay };
    } else {
      where.scheduledAt = { gte: new Date() };
    }

    if (lat && lng) {
      const radiusKm = parseFloat(radius as string) || 20;
      const latNum = parseFloat(lat as string);
      const lngNum = parseFloat(lng as string);
      const latDelta = radiusKm / 111;
      const lngDelta = radiusKm / (111 * Math.cos((latNum * Math.PI) / 180));
      where.latitude = { gte: latNum - latDelta, lte: latNum + latDelta };
      where.longitude = { gte: lngNum - lngDelta, lte: lngNum + lngDelta };
    }

    if (search) {
      where.OR = [
        { locationName: { contains: search as string, mode: "insensitive" } },
        { title: { contains: search as string, mode: "insensitive" } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(50, parseInt(limit as string) || 20);
    const skip = (pageNum - 1) * limitNum;

    const [matches, total] = await Promise.all([
      prisma.match.findMany({
        where,
        include: { creator: { select: creatorSelect } },
        orderBy: { scheduledAt: "asc" },
        skip,
        take: limitNum,
      }),
      prisma.match.count({ where }),
    ]);

    // Tri intelligent si sort=smart et user a un profil
    if (sort === "smart") {
      const profile = await prisma.userProfile.findUnique({ where: { userId: req.userId! } });
      if (profile) {
        const LEVEL_MAP: Record<string, number> = { BEGINNER: 1, INTERMEDIATE: 2, ADVANCED: 3, EXPERT: 4 };
        const userLevelNum = LEVEL_MAP[profile.level] ?? 2;

        const scored = matches.map((match) => {
          let score = 50;
          if (profile.sports.includes(match.sport)) score += 25;
          if (profile.primarySport === match.sport) score += 10;
          if (match.requiredLevel) {
            const diff = Math.abs(userLevelNum - (LEVEL_MAP[match.requiredLevel] ?? 2));
            if (diff === 0) score += 15;
            else if (diff === 1) score += 5;
            else score -= 10;
          } else {
            score += 10;
          }
          return { match, score, isRecommended: score >= 70 };
        });

        scored.sort((a, b) => b.score - a.score);
        const sortedMatches = scored.map(({ match, score, isRecommended }) => ({
          ...match,
          compatibilityScore: score,
          isRecommended,
        }));

        res.json({ matches: sortedMatches, total, page: pageNum, limit: limitNum, hasMore: skip + matches.length < total });
        return;
      }
    }

    res.json({ matches, total, page: pageNum, limit: limitNum, hasMore: skip + matches.length < total });
  } catch (err) {
    console.error("[getMatches]", err);
    res.status(500).json({ error: "Erreur lors de la récupération des parties" });
  }
}

// ── GET /api/matches/suggestions ──────────────────────────────
export async function getMatchSuggestions(req: AuthRequest, res: Response) {
  try {
    const limit = Math.min(20, parseInt(req.query.limit as string) || 10);

    const profile = await prisma.userProfile.findUnique({ where: { userId: req.userId! } });
    if (!profile || !profile.latitude || !profile.longitude) {
      return res.json({ suggestions: [] });
    }

    const radiusKm = profile.searchRadius ?? 20;
    const latDelta = radiusKm / 111;
    const lngDelta = radiusKm / (111 * Math.cos((profile.latitude * Math.PI) / 180));

    const LEVEL_MAP: Record<string, number> = { BEGINNER: 1, INTERMEDIATE: 2, ADVANCED: 3, EXPERT: 4 };
    const userLevelNum = LEVEL_MAP[profile.level] ?? 2;

    // Parties OPEN dans le rayon, pas créées par moi, pas encore rejointes
    const matches = await prisma.match.findMany({
      where: {
        status: "OPEN",
        scheduledAt: { gte: new Date() },
        creatorId: { not: req.userId! },
        latitude: { gte: profile.latitude - latDelta, lte: profile.latitude + latDelta },
        longitude: { gte: profile.longitude - lngDelta, lte: profile.longitude + lngDelta },
        players: { none: { userId: req.userId! } },
      },
      include: { creator: { select: creatorSelect } },
      take: 50,
    });

    // Scoring : sport match + level proximity
    const scored = matches.map((match) => {
      let score = 50; // baseline

      // Sport match
      if (profile.sports.includes(match.sport)) score += 25;
      if (profile.primarySport === match.sport) score += 10;

      // Level compatibility
      if (match.requiredLevel) {
        const matchLevelNum = LEVEL_MAP[match.requiredLevel] ?? 2;
        const diff = Math.abs(userLevelNum - matchLevelNum);
        if (diff === 0) score += 15;
        else if (diff === 1) score += 5;
        else score -= 10;
      } else {
        score += 10; // "tous niveaux" = bonus
      }

      return { match, score, isRecommended: score >= 70 };
    });

    scored.sort((a, b) => b.score - a.score);

    res.json({
      suggestions: scored.slice(0, limit).map(({ match, score, isRecommended }) => ({
        ...match,
        compatibilityScore: score,
        isRecommended,
      })),
    });
  } catch (err) {
    console.error("[getMatchSuggestions]", err);
    res.status(500).json({ error: "Erreur lors de la récupération des suggestions" });
  }
}

// ── GET /api/matches/my ───────────────────────────────────────
export async function getMyMatches(req: AuthRequest, res: Response) {
  try {
    const [created, joinedPlayers] = await Promise.all([
      prisma.match.findMany({
        where: { creatorId: req.userId },
        include: { creator: { select: creatorSelect } },
        orderBy: { scheduledAt: "desc" },
      }),
      prisma.matchPlayer.findMany({
        where: { userId: req.userId, match: { creatorId: { not: req.userId } } },
        include: { match: { include: { creator: { select: creatorSelect } } } },
        orderBy: { joinedAt: "desc" },
      }),
    ]);

    const joined = joinedPlayers.map((p) => p.match);
    res.json({ created, joined });
  } catch (err) {
    console.error("[getMyMatches]", err);
    res.status(500).json({ error: "Erreur lors de la récupération de mes parties" });
  }
}

// ── GET /api/matches/:id ──────────────────────────────────────
export async function getMatchById(req: AuthRequest, res: Response) {
  const { id } = req.params;

  try {
    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        creator: { select: creatorSelect },
        players: {
          include: { user: { select: creatorSelect } },
          orderBy: { joinedAt: "asc" },
        },
      },
    });

    if (!match) { res.status(404).json({ error: "Partie introuvable" }); return; }

    // Transitions de statut lazy
    await applyStatusTransitions(match as { id: string; status: string; scheduledAt: Date; durationMinutes: number });

    const isCreator = match.creatorId === req.userId;
    const isPlayer = match.players.some((p) => p.userId === req.userId);

    let pendingRequests: Array<{
      id: string;
      userId: string;
      user: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
      status: string;
      message: string | null;
      createdAt: Date;
    }> = [];
    if (isCreator) {
      pendingRequests = (await prisma.matchRequest.findMany({
        where: { matchId: id, status: "PENDING" },
        include: { user: { select: creatorSelect } },
        orderBy: { createdAt: "asc" },
      })) as typeof pendingRequests;
    }

    let myRequest = null;
    if (!isCreator) {
      myRequest = await prisma.matchRequest.findUnique({
        where: { matchId_userId: { matchId: id, userId: req.userId! } },
        select: { id: true, status: true, createdAt: true },
      });
    }

    // Feedback de l'utilisateur (si partie terminée)
    let myFeedback = null;
    if (match.status === "COMPLETED" && req.userId) {
      myFeedback = await prisma.matchFeedback.findUnique({
        where: { matchId_userId: { matchId: id, userId: req.userId } },
        select: { levelRating: true, overallRating: true, fairPlayRating: true, punctualityRating: true, ambianceRating: true, comment: true },
      });
    }

    res.json({ match, isCreator, isPlayer, myRequest, pendingRequests, myFeedback });
  } catch (err) {
    console.error("[getMatchById]", err);
    res.status(500).json({ error: "Erreur lors de la récupération de la partie" });
  }
}

// ── PATCH /api/matches/:id ────────────────────────────────────
export async function updateMatch(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { title, description, locationName, scheduledAt, durationMinutes, requiredLevel, maxPlayers } = req.body;

  try {
    const match = await prisma.match.findUnique({ where: { id } });
    if (!match) { res.status(404).json({ error: "Partie introuvable" }); return; }
    if (match.creatorId !== req.userId) { res.status(403).json({ error: "Non autorisé" }); return; }
    if (match.status === "CANCELLED" || match.status === "COMPLETED") {
      res.status(400).json({ error: "Impossible de modifier une partie terminée ou annulée" });
      return;
    }

    const updated = await prisma.match.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(locationName !== undefined && { locationName: locationName.trim() }),
        ...(scheduledAt !== undefined && { scheduledAt: new Date(scheduledAt) }),
        ...(durationMinutes !== undefined && { durationMinutes: parseInt(durationMinutes) }),
        ...(requiredLevel !== undefined && { requiredLevel: requiredLevel || null }),
        ...(maxPlayers !== undefined && { maxPlayers: parseInt(maxPlayers) }),
      },
      include: { creator: { select: creatorSelect } },
    });

    res.json({ match: updated });
  } catch (err) {
    console.error("[updateMatch]", err);
    res.status(500).json({ error: "Erreur lors de la mise à jour de la partie" });
  }
}

// ── DELETE /api/matches/:id ───────────────────────────────────
export async function cancelMatch(req: AuthRequest, res: Response) {
  const { id } = req.params;

  try {
    const match = await prisma.match.findUnique({ where: { id } });
    if (!match) { res.status(404).json({ error: "Partie introuvable" }); return; }
    if (match.creatorId !== req.userId) { res.status(403).json({ error: "Non autorisé" }); return; }
    if (match.status === "CANCELLED") { res.status(400).json({ error: "Partie déjà annulée" }); return; }
    if (match.status === "COMPLETED") { res.status(400).json({ error: "Impossible d'annuler une partie terminée" }); return; }

    await prisma.match.update({ where: { id }, data: { status: "CANCELLED" } });
    res.json({ success: true });
  } catch (err) {
    console.error("[cancelMatch]", err);
    res.status(500).json({ error: "Erreur lors de l'annulation de la partie" });
  }
}

// ── POST /api/matches/:id/join ────────────────────────────────
// Sprint 3 : crée une MatchRequest PENDING (le créateur doit accepter)
export async function joinMatch(req: AuthRequest, res: Response) {
  const { id } = req.params;

  try {
    const match = await prisma.match.findUnique({
      where: { id },
      include: { players: { select: { userId: true } }, creator: { select: creatorSelect } },
    });

    if (!match) { res.status(404).json({ error: "Partie introuvable" }); return; }
    if (match.status !== "OPEN") { res.status(400).json({ error: "Cette partie n'est plus ouverte aux inscriptions" }); return; }
    if (match.creatorId === req.userId) { res.status(400).json({ error: "Tu es le créateur de cette partie" }); return; }

    const isAlreadyPlayer = match.players.some((p) => p.userId === req.userId);
    if (isAlreadyPlayer) { res.status(400).json({ error: "Tu es déjà inscrit dans cette partie" }); return; }

    if (match.currentPlayers >= match.maxPlayers) {
      res.status(400).json({ error: "La partie est complète" });
      return;
    }

    // Vérifier si une demande existe déjà
    const existingRequest = await prisma.matchRequest.findUnique({
      where: { matchId_userId: { matchId: id, userId: req.userId! } },
    });

    if (existingRequest?.status === "PENDING") {
      res.status(400).json({ error: "Tu as déjà une demande en cours pour cette partie" });
      return;
    }
    if (existingRequest?.status === "ACCEPTED") {
      res.status(400).json({ error: "Tu es déjà inscrit dans cette partie" });
      return;
    }

    // Récupérer le prénom/nom du demandeur pour la notification
    const requester = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { firstName: true, lastName: true },
    });

    if (existingRequest) {
      // Réactiver une demande précédemment refusée
      await prisma.matchRequest.update({ where: { id: existingRequest.id }, data: { status: "PENDING" } });
    } else {
      await prisma.matchRequest.create({ data: { matchId: id, userId: req.userId!, status: "PENDING" } });
    }

    await sendPushNotification({
      userId: match.creatorId,
      type: "REQUEST_RECEIVED",
      title: "Nouvelle demande",
      body: `${requester?.firstName ?? "Quelqu'un"} ${requester?.lastName ?? ""} veut rejoindre ta partie`.trim(),
      data: { matchId: id },
    });

    res.json({ success: true, status: "PENDING" });
  } catch (err) {
    console.error("[joinMatch]", err);
    res.status(500).json({ error: "Erreur lors de l'envoi de la demande" });
  }
}

// ── POST /api/matches/:id/requests/:reqId/accept ──────────────
export async function acceptRequest(req: AuthRequest, res: Response) {
  const { id, reqId } = req.params;

  try {
    const [match, request] = await Promise.all([
      prisma.match.findUnique({ where: { id }, include: { players: { select: { userId: true } } } }),
      prisma.matchRequest.findUnique({ where: { id: reqId } }),
    ]);

    if (!match) { res.status(404).json({ error: "Partie introuvable" }); return; }
    if (match.creatorId !== req.userId) { res.status(403).json({ error: "Non autorisé — tu n'es pas le créateur" }); return; }
    if (!request || request.matchId !== id) { res.status(404).json({ error: "Demande introuvable" }); return; }
    if (request.status !== "PENDING") { res.status(400).json({ error: "Cette demande n'est plus en attente" }); return; }
    if (match.status !== "OPEN") { res.status(400).json({ error: "La partie n'est plus ouverte" }); return; }
    if (match.currentPlayers >= match.maxPlayers) { res.status(400).json({ error: "La partie est complète" }); return; }

    const newCount = match.currentPlayers + 1;
    const newStatus: MatchStatus = newCount >= match.maxPlayers ? "FULL" : "OPEN";

    const updatedMatch = await prisma.$transaction(async (tx) => {
      await tx.matchRequest.update({ where: { id: reqId }, data: { status: "ACCEPTED" } });
      await tx.matchPlayer.create({ data: { matchId: id, userId: request.userId } });
      return tx.match.update({
        where: { id },
        data: { currentPlayers: newCount, status: newStatus },
        include: {
          creator: { select: creatorSelect },
          players: { include: { user: { select: creatorSelect } } },
        },
      });
    });

    // Notifier le joueur accepté
    await sendPushNotification({
      userId: request.userId,
      type: "REQUEST_ACCEPTED",
      title: "Demande acceptée !",
      body: "Tu es maintenant inscrit à la partie. Bonne chance !",
      data: { matchId: id },
    });

    res.json({ match: updatedMatch });
  } catch (err) {
    console.error("[acceptRequest]", err);
    res.status(500).json({ error: "Erreur lors de l'acceptation de la demande" });
  }
}

// ── POST /api/matches/:id/requests/:reqId/reject ──────────────
export async function rejectRequest(req: AuthRequest, res: Response) {
  const { id, reqId } = req.params;

  try {
    const [match, request] = await Promise.all([
      prisma.match.findUnique({ where: { id } }),
      prisma.matchRequest.findUnique({ where: { id: reqId } }),
    ]);

    if (!match) { res.status(404).json({ error: "Partie introuvable" }); return; }
    if (match.creatorId !== req.userId) { res.status(403).json({ error: "Non autorisé" }); return; }
    if (!request || request.matchId !== id) { res.status(404).json({ error: "Demande introuvable" }); return; }
    if (request.status !== "PENDING") { res.status(400).json({ error: "Cette demande n'est plus en attente" }); return; }

    await prisma.matchRequest.update({ where: { id: reqId }, data: { status: "REJECTED" } });

    await sendPushNotification({
      userId: request.userId,
      type: "REQUEST_REJECTED",
      title: "Demande refusée",
      body: "Ta demande pour rejoindre cette partie n'a pas été acceptée.",
      data: { matchId: id },
    });

    res.json({ success: true });
  } catch (err) {
    console.error("[rejectRequest]", err);
    res.status(500).json({ error: "Erreur lors du refus de la demande" });
  }
}

// ── POST /api/matches/:id/leave ───────────────────────────────
export async function leaveMatch(req: AuthRequest, res: Response) {
  const { id } = req.params;

  try {
    const match = await prisma.match.findUnique({
      where: { id },
      include: { players: { select: { userId: true } } },
    });

    if (!match) { res.status(404).json({ error: "Partie introuvable" }); return; }
    if (match.creatorId === req.userId) { res.status(400).json({ error: "Le créateur ne peut pas quitter sa partie — annule-la plutôt" }); return; }
    if (match.status === "CANCELLED" || match.status === "COMPLETED") {
      res.status(400).json({ error: "Impossible de quitter une partie terminée ou annulée" });
      return;
    }

    const isPlayer = match.players.some((p) => p.userId === req.userId);
    if (!isPlayer) { res.status(400).json({ error: "Tu n'es pas inscrit dans cette partie" }); return; }

    await prisma.$transaction(async (tx) => {
      await tx.matchPlayer.delete({ where: { matchId_userId: { matchId: id, userId: req.userId! } } });
      await tx.match.update({ where: { id }, data: { currentPlayers: { decrement: 1 }, status: "OPEN" } });
      // Remettre la MatchRequest en PENDING pour permettre de rejoindre à nouveau
      await tx.matchRequest.updateMany({
        where: { matchId: id, userId: req.userId!, status: "ACCEPTED" },
        data: { status: "CANCELLED" },
      });
    });

    res.json({ success: true });
  } catch (err) {
    console.error("[leaveMatch]", err);
    res.status(500).json({ error: "Erreur lors du départ de la partie" });
  }
}

// ── POST /api/matches/:id/complete ──────────────────────────
export async function completeMatch(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        players: { select: { userId: true } },
        creator: { select: { firstName: true } },
      },
    });

    if (!match) { res.status(404).json({ error: "Partie introuvable" }); return; }
    if (match.creatorId !== req.userId) { res.status(403).json({ error: "Seul le créateur peut terminer la partie" }); return; }

    if (match.status === "COMPLETED" || match.status === "CANCELLED") {
      res.status(400).json({ error: "Cette partie est déjà terminée ou annulée" });
      return;
    }

    // Vérifier que l'heure de début du match est passée
    const now = new Date();
    if (match.scheduledAt > now) {
      res.status(400).json({ error: "Tu ne peux pas terminer une partie qui n'a pas encore commencé" });
      return;
    }

    const updated = await prisma.match.update({
      where: { id },
      data: { status: "COMPLETED" },
    });

    // Notifier tous les joueurs (sauf le créateur)
    const playerIds = match.players
      .map((p) => p.userId)
      .filter((uid) => uid !== req.userId);

    for (const playerId of playerIds) {
      sendPushNotification({
        userId: playerId,
        type: "MATCH_COMPLETED",
        title: "Partie terminée !",
        body: "Donne ton avis sur le niveau du match 🎾",
        data: { matchId: id },
      });
    }

    res.json({ match: updated });
  } catch (err) {
    console.error("[completeMatch]", err);
    res.status(500).json({ error: "Erreur lors de la finalisation" });
  }
}

// ── POST /api/matches/:id/feedback ──────────────────────────
export async function submitFeedback(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const { levelRating, overallRating, fairPlayRating, punctualityRating, ambianceRating, comment } = req.body;

    const validRatings = ["TOO_LOW", "BALANCED", "TOO_HIGH"];
    if (!levelRating || !validRatings.includes(levelRating)) {
      res.status(400).json({ error: "levelRating requis : TOO_LOW, BALANCED ou TOO_HIGH" });
      return;
    }

    const clamp = (v: any) => {
      const n = parseInt(v);
      return isNaN(n) ? null : Math.min(5, Math.max(1, n));
    };
    const parsedOverall = clamp(overallRating) ?? 3;
    const parsedFairPlay = clamp(fairPlayRating);
    const parsedPunctuality = clamp(punctualityRating);
    const parsedAmbiance = clamp(ambianceRating);

    const match = await prisma.match.findUnique({
      where: { id },
      include: { players: { select: { userId: true } } },
    });

    if (!match) { res.status(404).json({ error: "Partie introuvable" }); return; }
    if (match.status !== "COMPLETED") {
      res.status(400).json({ error: "La partie doit être terminée pour donner un avis" });
      return;
    }

    // Vérifier que l'user est joueur ou créateur
    const isPlayer = match.players.some((p) => p.userId === userId);
    const isCreator = match.creatorId === userId;
    if (!isPlayer && !isCreator) {
      res.status(403).json({ error: "Tu ne participes pas à cette partie" });
      return;
    }

    // Vérifier qu'il n'a pas déjà donné son feedback
    const existing = await prisma.matchFeedback.findUnique({
      where: { matchId_userId: { matchId: id, userId } },
    });
    if (existing) {
      res.status(400).json({ error: "Tu as déjà donné ton avis pour cette partie" });
      return;
    }

    const [feedback] = await prisma.$transaction([
      prisma.matchFeedback.create({
        data: {
          matchId: id,
          userId,
          levelRating,
          overallRating: parsedOverall,
          fairPlayRating: parsedFairPlay,
          punctualityRating: parsedPunctuality,
          ambianceRating: parsedAmbiance,
          comment: comment?.trim() || null,
        },
      }),
      prisma.userProfile.updateMany({
        where: { userId },
        data: { totalMatchesPlayed: { increment: 1 } },
      }),
    ]);

    res.json({ feedback });
  } catch (err: any) {
    if (err?.code === "P2002") {
      res.status(400).json({ error: "Tu as déjà donné ton avis pour cette partie" });
      return;
    }
    console.error("[submitFeedback]", err);
    res.status(500).json({ error: "Erreur lors de l'envoi de l'avis" });
  }
}

// ── POST /api/matches/propose ───────────────────────────────
export async function proposeMatch(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const {
      targetUserId, sport, locationName, latitude, longitude,
      scheduledAt, durationMinutes, maxPlayers, requiredLevel, description,
    } = req.body;

    if (!targetUserId || !sport || !locationName || latitude === undefined || longitude === undefined || !scheduledAt || !maxPlayers) {
      res.status(400).json({ error: "Champs manquants" });
      return;
    }

    if (targetUserId === userId) {
      res.status(400).json({ error: "Impossible de te proposer une partie à toi-même" });
      return;
    }

    const validSports = ["TENNIS", "PADEL", "SQUASH"];
    if (!validSports.includes(sport)) { res.status(400).json({ error: "Sport invalide" }); return; }

    const parsedDate = new Date(scheduledAt);
    if (isNaN(parsedDate.getTime())) { res.status(400).json({ error: "Date invalide" }); return; }

    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true, firstName: true } });
    if (!targetUser) { res.status(404).json({ error: "Joueur introuvable" }); return; }

    const creator = await prisma.user.findUnique({ where: { id: userId }, select: { firstName: true } });

    // Créer la partie + MatchPlayer créateur + MatchRequest pour le joueur cible
    const match = await prisma.$transaction(async (tx) => {
      const newMatch = await tx.match.create({
        data: {
          creatorId: userId,
          sport: sport as Sport,
          title: `Partie proposée à ${targetUser.firstName}`,
          description: description?.trim() || null,
          locationName,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          scheduledAt: parsedDate,
          durationMinutes: parseInt(durationMinutes) || 60,
          maxPlayers: parseInt(maxPlayers),
          requiredLevel: requiredLevel || null,
          isPublic: true,
        },
      });

      // Le créateur est joueur
      await tx.matchPlayer.create({
        data: { matchId: newMatch.id, userId },
      });

      // Créer la demande pour le joueur cible
      await tx.matchRequest.create({
        data: {
          matchId: newMatch.id,
          userId: targetUserId,
          status: "PENDING",
          message: `${creator?.firstName ?? "Un joueur"} te propose cette partie !`,
        },
      });

      return newMatch;
    });

    // Notification push
    sendPushNotification({
      userId: targetUserId,
      type: "MATCH_PROPOSAL",
      title: `${creator?.firstName ?? "Un joueur"} te propose une partie !`,
      body: `Partie de ${sport.toLowerCase()} à ${locationName}`,
      data: { matchId: match.id },
    });

    res.status(201).json({ match });
  } catch (err) {
    console.error("[proposeMatch]", err);
    res.status(500).json({ error: "Erreur lors de la proposition" });
  }
}
