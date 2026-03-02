import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  getConversations,
  createConversation,
  getMessages,
  sendMessage,
  getUnreadCount,
} from "../controllers/conversationsController";

export const conversationsRouter = Router();

// Toutes les routes de conversations nécessitent d'être authentifié
conversationsRouter.use(requireAuth);

// Routes fixes AVANT /:id
conversationsRouter.get("/unread-count", getUnreadCount);

// CRUD
conversationsRouter.get("/", getConversations);
conversationsRouter.post("/", createConversation);

// Messages d'une conversation
conversationsRouter.get("/:id/messages", getMessages);
conversationsRouter.post("/:id/messages", sendMessage);
