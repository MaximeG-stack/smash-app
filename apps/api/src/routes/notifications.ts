import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getNotifications, markAsRead, markAllAsRead } from "../controllers/notificationsController";

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

// IMPORTANT : /read-all AVANT /:id pour éviter le conflit de route
notificationsRouter.patch("/read-all", markAllAsRead);
notificationsRouter.get("/", getNotifications);
notificationsRouter.patch("/:id/read", markAsRead);
