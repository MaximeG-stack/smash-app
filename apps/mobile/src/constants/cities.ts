// Coordonnées GPS des villes PACA pour la création de parties
export const PACA_CITY_COORDS: Record<string, { latitude: number; longitude: number }> = {
  "Marseille": { latitude: 43.2965, longitude: 5.3698 },
  "Aix-en-Provence": { latitude: 43.5297, longitude: 5.4474 },
  "Toulon": { latitude: 43.1242, longitude: 5.9280 },
  "Nice": { latitude: 43.7102, longitude: 7.2620 },
  "Cannes": { latitude: 43.5528, longitude: 7.0174 },
  "Antibes": { latitude: 43.5808, longitude: 7.1203 },
  "Aubagne": { latitude: 43.2946, longitude: 5.5688 },
  "La Ciotat": { latitude: 43.1741, longitude: 5.6064 },
  "Martigues": { latitude: 43.4048, longitude: 5.0503 },
  "Arles": { latitude: 43.6762, longitude: 4.6274 },
};

export const PACA_CITIES_LIST = Object.keys(PACA_CITY_COORDS);

// Retourne les coordonnées d'une ville ou Marseille par défaut
export function getCityCoords(city: string): { latitude: number; longitude: number } {
  return PACA_CITY_COORDS[city] ?? PACA_CITY_COORDS["Marseille"];
}
