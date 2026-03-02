import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  getProfile,
  updateProfile,
  uploadAvatar,
  getSuggestions,
  getFavorites,
  getPublicProfile,
  getCompatibility,
  addFavorite,
  removeFavorite,
  registerFcmToken,
} from "../controllers/usersController";

export const usersRouter = Router();

usersRouter.use(requireAuth);

// IMPORTANT : routes fixes AVANT /:id pour éviter les conflits
usersRouter.get("/me", getProfile);
usersRouter.get("/suggestions", getSuggestions);
usersRouter.get("/favorites", getFavorites);
usersRouter.patch("/profile", updateProfile);
usersRouter.post("/avatar", uploadAvatar);
usersRouter.post("/fcm-token", registerFcmToken);

// Routes dynamiques avec /:id
usersRouter.get("/:id", getPublicProfile);
usersRouter.get("/:id/compatibility", getCompatibility);
usersRouter.post("/:id/favorite", addFavorite);
usersRouter.delete("/:id/favorite", removeFavorite);
