import type { Response } from "express";
import { PrismaClient } from "@prisma/client";
import type { AuthRequest } from "../middleware/auth";

const prisma = new PrismaClient();

// ── GET /api/notifications ────────────────────────────────────
export async function getNotifications(req: AuthRequest, res: Response) {
  const { page, limit } = req.query;

  const pageNum = Math.max(1, parseInt(page as string) || 1);
  const limitNum = Math.min(50, parseInt(limit as string) || 20);
  const skip = (pageNum - 1) * limitNum;

  try {
    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: req.userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.notification.count({ where: { userId: req.userId } }),
      prisma.notification.count({ where: { userId: req.userId, isRead: false } }),
    ]);

    res.json({
      notifications,
      total,
      unreadCount,
      page: pageNum,
      limit: limitNum,
      hasMore: skip + notifications.length < total,
    });
  } catch (err) {
    console.error("[getNotifications]", err);
    res.status(500).json({ error: "Erreur lors de la récupération des notifications" });
  }
}

// ── PATCH /api/notifications/:id/read ────────────────────────
export async function markAsRead(req: AuthRequest, res: Response) {
  const { id } = req.params;

  try {
    const notification = await prisma.notification.findUnique({ where: { id } });

    if (!notification) { res.status(404).json({ error: "Notification introuvable" }); return; }
    if (notification.userId !== req.userId) { res.status(403).json({ error: "Non autorisé" }); return; }

    await prisma.notification.update({ where: { id }, data: { isRead: true } });
    res.json({ success: true });
  } catch (err) {
    console.error("[markAsRead]", err);
    res.status(500).json({ error: "Erreur lors de la mise à jour" });
  }
}

// ── PATCH /api/notifications/read-all ────────────────────────
export async function markAllAsRead(req: AuthRequest, res: Response) {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.userId, isRead: false },
      data: { isRead: true },
    });
    res.json({ success: true });
  } catch (err) {
    console.error("[markAllAsRead]", err);
    res.status(500).json({ error: "Erreur lors de la mise à jour" });
  }
}
