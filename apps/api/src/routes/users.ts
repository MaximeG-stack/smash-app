import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getProfile, updateProfile, uploadAvatar } from "../controllers/usersController";

export const usersRouter = Router();

usersRouter.use(requireAuth);

// GET /api/users/me
usersRouter.get("/me", getProfile);

// PATCH /api/users/profile
usersRouter.patch("/profile", updateProfile);

// POST /api/users/avatar
usersRouter.post("/avatar", uploadAvatar);
