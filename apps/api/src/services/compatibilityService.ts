import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ── Types ───────────────────────────────────────────────────────

export interface CompatibilityResult {
  overall: number;
  levelScore: number;
  proximityScore: number;
  sportScore: number;
  socialScore: number;
  feedbackBonus: number;
}

interface ProfileData {
  userId: string;
  sports: string[];
  primarySport: string | null;
  level: string;
  latitude: number | null;
  longitude: number | null;
}

// ── Constantes ──────────────────────────────────────────────────

const WEIGHTS = { level: 0.35, proximity: 0.25, sport: 0.15, social: 0.10, feedback: 0.15 };

const LEVEL_MAP: Record<string, number> = {
  BEGINNER: 1,
  INTERMEDIATE: 2,
  ADVANCED: 3,
  EXPERT: 4,
};

// ── Fonctions utilitaires ───────────────────────────────────────

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Calcul des sous-scores ──────────────────────────────────────

function computeLevelScore(levelA: string, levelB: string): number {
  const diff = Math.abs((LEVEL_MAP[levelA] ?? 1) - (LEVEL_MAP[levelB] ?? 1));
  if (diff === 0) return 100;
  if (diff === 1) return 70;
  if (diff === 2) return 30;
  return 0;
}

function computeProximityScore(a: ProfileData, b: ProfileData): number {
  if (!a.latitude || !a.longitude || !b.latitude || !b.longitude) return 50; // score neutre si pas de localisation
  const dist = distanceKm(a.latitude, a.longitude, b.latitude, b.longitude);
  if (dist < 5) return 100;
  if (dist < 15) return 80;
  if (dist < 30) return 50;
  if (dist < 50) return 20;
  return 0;
}

function computeSportScore(a: ProfileData, b: ProfileData): number {
  const sportsA = new Set(a.sports);
  const sportsB = new Set(b.sports);
  const allSports = new Set([...sportsA, ...sportsB]);
  if (allSports.size === 0) return 50;

  const common = [...sportsA].filter((s) => sportsB.has(s)).length;
  let score = (common / allSports.size) * 100;

  // Bonus si même sport principal
  if (a.primarySport && b.primarySport && a.primarySport === b.primarySport) {
    score = Math.min(100, score + 20);
  }

  return Math.round(score);
}

// feedbackData : feedbacks des matchs joués ensemble entre les deux joueurs
interface FeedbackData {
  balancedCount: number;   // Nombre de feedbacks "BALANCED" entre ces 2 joueurs
  totalFeedbacks: number;  // Nombre total de feedbacks entre ces 2 joueurs
  avgOverallRating: number; // Note moyenne globale du candidat (tous matchs confondus)
}

function computeFeedbackScore(feedbackData: FeedbackData | null): number {
  if (!feedbackData || feedbackData.totalFeedbacks === 0) return 50; // score neutre si pas de données

  // 1. Ratio de matchs "équilibrés" entre ces 2 joueurs (0-60 pts)
  const balancedRatio = feedbackData.balancedCount / feedbackData.totalFeedbacks;
  const balancedScore = balancedRatio * 60;

  // 2. Note moyenne globale du joueur (0-40 pts) — un joueur bien noté = meilleure expérience
  const ratingScore = ((feedbackData.avgOverallRating - 1) / 4) * 40; // 1-5 → 0-40

  return Math.round(Math.min(100, balancedScore + ratingScore));
}

function computeSocialScore(sharedMatchCount: number, isMutualFavorite: boolean): number {
  let score: number;
  if (sharedMatchCount === 0) score = 20;
  else if (sharedMatchCount <= 2) score = 50;
  else if (sharedMatchCount <= 5) score = 70;
  else score = 100;

  if (isMutualFavorite) score = Math.min(100, score + 15);
  return score;
}

// ── Fonction principale ─────────────────────────────────────────

export function calculateCompatibility(
  profileA: ProfileData,
  profileB: ProfileData,
  sharedMatchCount: number,
  isMutualFavorite: boolean,
  feedbackData?: FeedbackData | null,
): CompatibilityResult {
  const levelScore = computeLevelScore(profileA.level, profileB.level);
  const proximityScore = computeProximityScore(profileA, profileB);
  const sportScore = computeSportScore(profileA, profileB);
  const socialScore = computeSocialScore(sharedMatchCount, isMutualFavorite);
  const feedbackBonus = computeFeedbackScore(feedbackData ?? null);

  const overall = Math.round(
    WEIGHTS.level * levelScore +
    WEIGHTS.proximity * proximityScore +
    WEIGHTS.sport * sportScore +
    WEIGHTS.social * socialScore +
    WEIGHTS.feedback * feedbackBonus,
  );

  return { overall, levelScore, proximityScore, sportScore, socialScore, feedbackBonus };
}

// ── Fonction batch : suggestions ────────────────────────────────

export async function getSuggestionsForUser(userId: string, limit = 10) {
  // 1. Récupérer le profil de l'utilisateur
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });

  if (!currentUser?.profile) return [];

  const myProfile: ProfileData = {
    userId: currentUser.id,
    sports: currentUser.profile.sports,
    primarySport: currentUser.profile.primarySport,
    level: currentUser.profile.level,
    latitude: currentUser.profile.latitude,
    longitude: currentUser.profile.longitude,
  };

  // 2. Trouver les candidats dans le rayon géographique
  const radius = currentUser.profile.searchRadius ?? 20;
  const latDelta = radius / 111;
  const lngDelta =
    myProfile.latitude
      ? radius / (111 * Math.cos((myProfile.latitude * Math.PI) / 180))
      : radius / 111;

  const whereClause: Record<string, unknown> = {
    userId: { not: userId },
  };

  if (myProfile.latitude && myProfile.longitude) {
    whereClause.latitude = {
      gte: myProfile.latitude - latDelta,
      lte: myProfile.latitude + latDelta,
    };
    whereClause.longitude = {
      gte: myProfile.longitude - lngDelta,
      lte: myProfile.longitude + lngDelta,
    };
  }

  const candidates = await prisma.userProfile.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
    },
    take: 50,
  });

  if (candidates.length === 0) return [];

  // 3. Récupérer les données sociales en batch
  const candidateUserIds = candidates.map((c) => c.userId);

  // Parties jouées ensemble
  const myMatchIds = await prisma.matchPlayer.findMany({
    where: { userId },
    select: { matchId: true },
  });
  const myMatchIdSet = new Set(myMatchIds.map((m) => m.matchId));

  const candidateMatchPlayers = await prisma.matchPlayer.findMany({
    where: {
      userId: { in: candidateUserIds },
      matchId: { in: [...myMatchIdSet] },
    },
    select: { userId: true, matchId: true },
  });

  const sharedMatchCounts = new Map<string, number>();
  for (const mp of candidateMatchPlayers) {
    sharedMatchCounts.set(mp.userId, (sharedMatchCounts.get(mp.userId) ?? 0) + 1);
  }

  // Favoris mutuels
  const [myFavorites, favoritedBy] = await Promise.all([
    prisma.userFavorite.findMany({
      where: { userId, favoriteId: { in: candidateUserIds } },
      select: { favoriteId: true },
    }),
    prisma.userFavorite.findMany({
      where: { userId: { in: candidateUserIds }, favoriteId: userId },
      select: { userId: true },
    }),
  ]);

  const myFavoriteIds = new Set(myFavorites.map((f) => f.favoriteId));
  const favoritedByIds = new Set(favoritedBy.map((f) => f.userId));

  // 3b. Récupérer les feedbacks des matchs partagés entre l'user et les candidats
  const sharedMatchIds = [...myMatchIdSet];
  const allFeedbacks = sharedMatchIds.length > 0
    ? await prisma.matchFeedback.findMany({
        where: {
          matchId: { in: sharedMatchIds },
          userId: { in: [userId, ...candidateUserIds] },
        },
        select: { matchId: true, userId: true, levelRating: true, overallRating: true },
      })
    : [];

  // Calculer les feedbackData par candidat
  const feedbackDataMap = new Map<string, FeedbackData>();

  // Pour chaque candidat, trouver les matchs en commun et les feedbacks croisés
  for (const candidateId of candidateUserIds) {
    const candidateMatchIds = candidateMatchPlayers
      .filter((mp) => mp.userId === candidateId)
      .map((mp) => mp.matchId);

    if (candidateMatchIds.length === 0) continue;

    // Feedbacks de l'user et du candidat sur leurs matchs communs
    const relevantFeedbacks = allFeedbacks.filter(
      (f) => candidateMatchIds.includes(f.matchId) && (f.userId === userId || f.userId === candidateId)
    );

    const balancedCount = relevantFeedbacks.filter((f) => f.levelRating === "BALANCED").length;
    const totalFeedbacks = relevantFeedbacks.length;

    // Note moyenne globale du candidat (tous ses feedbacks)
    const candidateRatings = allFeedbacks.filter((f) => f.userId === candidateId && f.overallRating);
    const avgOverallRating = candidateRatings.length > 0
      ? candidateRatings.reduce((sum, f) => sum + f.overallRating, 0) / candidateRatings.length
      : 3;

    feedbackDataMap.set(candidateId, { balancedCount, totalFeedbacks, avgOverallRating });
  }

  // 4. Calculer les scores
  const results = candidates.map((candidate) => {
    const candidateProfile: ProfileData = {
      userId: candidate.userId,
      sports: candidate.sports,
      primarySport: candidate.primarySport,
      level: candidate.level,
      latitude: candidate.latitude,
      longitude: candidate.longitude,
    };

    const sharedCount = sharedMatchCounts.get(candidate.userId) ?? 0;
    const isMutual = myFavoriteIds.has(candidate.userId) && favoritedByIds.has(candidate.userId);
    const feedbackData = feedbackDataMap.get(candidate.userId) ?? null;

    const compatibility = calculateCompatibility(myProfile, candidateProfile, sharedCount, isMutual, feedbackData);

    return {
      user: {
        id: candidate.user.id,
        firstName: candidate.user.firstName,
        lastName: candidate.user.lastName,
        avatarUrl: candidate.user.avatarUrl,
        profile: {
          sports: candidate.sports,
          primarySport: candidate.primarySport,
          level: candidate.level,
          city: candidate.city,
          totalMatchesPlayed: candidate.totalMatchesPlayed,
        },
      },
      compatibility,
    };
  });

  // 5. Trier par score et retourner le top N
  results.sort((a, b) => b.compatibility.overall - a.compatibility.overall);
  return results.slice(0, limit);
}
