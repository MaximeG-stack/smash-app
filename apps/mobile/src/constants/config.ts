const DEFAULT_API_URL =
  typeof window !== "undefined" && window.location?.hostname !== "localhost"
    ? "https://smashi-api.onrender.com"
    : "http://localhost:3000";

export const Config = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL,
  googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",

  // Matching
  defaultSearchRadius: 20, // km
  maxSearchRadius: 100, // km

  // Pagination
  matchesPerPage: 20,
  usersPerPage: 20,

  // Upload
  maxAvatarSizeMb: 5,
  maxAvatarWidth: 400,
  maxAvatarHeight: 400,
} as const;
