import { Platform } from "react-native";

const isWeb = Platform.OS === "web";
const isLocalhost = isWeb && typeof window !== "undefined" && window.location?.hostname === "localhost";

export const Config = {
  apiUrl: isLocalhost ? "http://localhost:3000" : "https://smashi-api.onrender.com",
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
