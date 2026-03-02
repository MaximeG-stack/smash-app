import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  createMatch,
  getMatches,
  getMatchSuggestions,
  getMyMatches,
  getMatchById,
  updateMatch,
  cancelMatch,
  joinMatch,
  leaveMatch,
  acceptRequest,
  rejectRequest,
  completeMatch,
  submitFeedback,
  proposeMatch,
} from "../controllers/matchesController";

export const matchesRouter = Router();

// Toutes les routes de parties nécessitent d'être authentifié
matchesRouter.use(requireAuth);

// Routes fixes AVANT /:id pour éviter le conflit de route
matchesRouter.get("/my", getMyMatches);
matchesRouter.get("/suggestions", getMatchSuggestions);
matchesRouter.post("/propose", proposeMatch);

// CRUD
matchesRouter.post("/", createMatch);
matchesRouter.get("/", getMatches);
matchesRouter.get("/:id", getMatchById);
matchesRouter.patch("/:id", updateMatch);
matchesRouter.delete("/:id", cancelMatch);

// Actions joueur
matchesRouter.post("/:id/join", joinMatch);
matchesRouter.post("/:id/leave", leaveMatch);

// Gestion des demandes (Sprint 3)
matchesRouter.post("/:id/requests/:reqId/accept", acceptRequest);
matchesRouter.post("/:id/requests/:reqId/reject", rejectRequest);

// Terminer + Feedback (Sprint 5)
matchesRouter.post("/:id/complete", completeMatch);
matchesRouter.post("/:id/feedback", submitFeedback);
