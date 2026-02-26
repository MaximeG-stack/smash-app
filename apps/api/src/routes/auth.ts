import { Router } from "express";
import { register, login, getMe } from "../controllers/authController";
import { requireAuth } from "../middleware/auth";

export const authRouter = Router();

// POST /api/auth/register — Firebase token → créer User + émettre JWT
authRouter.post("/register", register);

// POST /api/auth/login — Firebase token → vérifier User + émettre JWT
authRouter.post("/login", login);

// GET /api/auth/me — profil de l'utilisateur connecté
authRouter.get("/me", requireAuth, getMe);
