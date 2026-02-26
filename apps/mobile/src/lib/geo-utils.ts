const EARTH_RADIUS_KM = 6371;

/**
 * Calcule la distance en km entre deux coordonnées GPS (formule de Haversine).
 */
export function getDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Formate une distance pour l'affichage.
 * < 1km → "800 m", >= 1km → "2.3 km"
 */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

/**
 * Filtre un tableau d'éléments avec coordonnées dans un rayon donné.
 */
export function filterByRadius<T extends { latitude: number; longitude: number }>(
  items: T[],
  center: { latitude: number; longitude: number },
  radiusKm: number,
): T[] {
  return items.filter(
    (item) =>
      getDistanceKm(center.latitude, center.longitude, item.latitude, item.longitude) <=
      radiusKm,
  );
}
