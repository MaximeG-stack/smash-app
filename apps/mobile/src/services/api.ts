import axios from "axios";
import { Config } from "@/constants/config";
import { useAuthStore } from "@/stores/authStore";

export const api = axios.create({
  baseURL: Config.apiUrl,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// Injecter le token JWT sur chaque requête
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Gérer les 401 (token expiré)
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);
