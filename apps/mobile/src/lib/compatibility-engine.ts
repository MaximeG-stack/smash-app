import type { UserProfile, Match, CompatibilityScore } from "@/types";
import { getDistanceKm } from "./geo-utils";

const WEIGHTS = {
  level: 0.4,
  proximity: 0.25,
  availability: 0.2,
  social: 0.15,
} as const;

const LEVEL_ORDER = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"] as const;

/**
 * Calcule le score de compatibilité entre un joueur et une partie.
 * Score global = niveau (40%) + proximité (25%) + dispo (20%) + social (15%)
 */
export function calculateCompatibilityScore(
  player: UserProfile,
  match: Match,
): CompatibilityScore {
  const levelScore = calculateLevelScore(player, match);
  const proximityScore = calculateProximityScore(player, match);
  const availabilityScore = 80; // TODO: calculer selon les dispos du joueur
  const socialScore = 50; // TODO: calculer selon l'historique social

  const overall =
    levelScore * WEIGHTS.level +
    proximityScore * WEIGHTS.proximity +
    availabilityScore * WEIGHTS.availability +
    socialScore * WEIGHTS.social;

  return {
    overall: Math.round(overall),
    levelMatch: Math.round(levelScore),
    proximity: Math.round(proximityScore),
    availability: Math.round(availabilityScore),
    socialFit: Math.round(socialScore),
  };
}

function calculateLevelScore(player: UserProfile, match: Match): number {
  if (!match.requiredLevel) return 80;

  const playerIdx = LEVEL_ORDER.indexOf(player.level as typeof LEVEL_ORDER[number]);
  const matchIdx = LEVEL_ORDER.indexOf(match.requiredLevel as typeof LEVEL_ORDER[number]);
  const diff = Math.abs(playerIdx - matchIdx);
  const flexibility = match.levelFlexibility ?? 1;

  if (diff === 0) return 100;
  if (diff <= flexibility) return 70;
  return Math.max(0, 70 - (diff - flexibility) * 30);
}

function calculateProximityScore(player: UserProfile, match: Match): number {
  if (!player.latitude || !player.longitude) return 50;

  const dist = getDistanceKm(
    player.latitude,
    player.longitude,
    match.latitude,
    match.longitude,
  );

  const radius = player.searchRadius ?? 20;
  if (dist <= 5) return 100;
  if (dist <= 10) return 85;
  if (dist <= radius) return Math.max(20, 85 - ((dist - 10) / radius) * 60);
  return 0;
}
