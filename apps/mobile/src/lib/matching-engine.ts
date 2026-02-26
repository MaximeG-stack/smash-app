import type { Match, UserProfile, CompatibilityScore } from "@/types";
import { calculateCompatibilityScore } from "./compatibility-engine";
import { getDistanceKm } from "./geo-utils";

export interface MatchSuggestion {
  match: Match;
  score: CompatibilityScore;
  isRecommended: boolean;
}

/**
 * Filtre et trie les parties disponibles pour un joueur donné.
 * Trie par score de compatibilité global décroissant.
 */
export function rankMatches(
  matches: Match[],
  playerProfile: UserProfile,
): MatchSuggestion[] {
  return matches
    .map((match) => {
      const score = calculateCompatibilityScore(playerProfile, match);
      return {
        match,
        score,
        isRecommended: score.overall >= 70,
      };
    })
    .sort((a, b) => b.score.overall - a.score.overall);
}

/**
 * Filtre les parties par sport, zone géographique et date.
 */
export function filterMatches(
  matches: Match[],
  options: {
    sport?: string;
    latitude?: number;
    longitude?: number;
    radiusKm?: number;
    date?: Date;
  },
): Match[] {
  return matches.filter((match) => {
    if (options.sport && match.sport !== options.sport) return false;

    if (options.latitude && options.longitude && options.radiusKm) {
      const dist = getDistanceKm(
        options.latitude,
        options.longitude,
        match.latitude,
        match.longitude,
      );
      if (dist > options.radiusKm) return false;
    }

    if (options.date) {
      const matchDate = new Date(match.scheduledAt);
      const targetDate = options.date;
      if (
        matchDate.toDateString() !== targetDate.toDateString()
      )
        return false;
    }

    return true;
  });
}
