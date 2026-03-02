import type { Response } from "express";
import { PrismaClient } from "@prisma/client";
import type { AuthRequest } from "../middleware/auth";
import { sendPushNotification } from "../services/pushService";

const prisma = new PrismaClient();

const userSelect = {
  id: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
} as const;

// ── GET /api/conversations ──────────────────────────────────
export async function getConversations(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ participant1Id: userId }, { participant2Id: userId }],
      },
      include: {
        participant1: { select: userSelect },
        participant2: { select: userSelect },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { lastMessageAt: { sort: "desc", nulls: "last" } },
    });

    const result = await Promise.all(
      conversations.map(async (conv) => {
        const otherUser =
          conv.participant1Id === userId ? conv.participant2 : conv.participant1;
        const lastMessage = conv.messages[0] ?? null;

        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: userId },
            isRead: false,
          },
        });

        return {
          id: conv.id,
          otherUser,
          lastMessage: lastMessage
            ? {
                content: lastMessage.content,
                senderId: lastMessage.senderId,
                createdAt: lastMessage.createdAt,
              }
            : null,
          unreadCount,
        };
      })
    );

    res.json({ conversations: result });
  } catch (err) {
    console.error("[getConversations]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
}

// ── POST /api/conversations ─────────────────────────────────
export async function createConversation(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { userId: otherUserId } = req.body;

    if (!otherUserId) {
      res.status(400).json({ error: "userId requis" });
      return;
    }

    if (otherUserId === userId) {
      res.status(400).json({ error: "Impossible de créer une conversation avec soi-même" });
      return;
    }

    // Vérifier que l'autre utilisateur existe
    const otherUser = await prisma.user.findUnique({ where: { id: otherUserId } });
    if (!otherUser) {
      res.status(404).json({ error: "Utilisateur introuvable" });
      return;
    }

    // Chercher une conversation existante (dans les 2 sens)
    let conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { participant1Id: userId, participant2Id: otherUserId },
          { participant1Id: otherUserId, participant2Id: userId },
        ],
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          participant1Id: userId,
          participant2Id: otherUserId,
        },
      });
    }

    res.json({ conversation: { id: conversation.id } });
  } catch (err) {
    console.error("[createConversation]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
}

// ── GET /api/conversations/:id/messages ─────────────────────
export async function getMessages(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 30));

    // Vérifier que l'user est participant
    const conversation = await prisma.conversation.findUnique({ where: { id } });
    if (!conversation) {
      res.status(404).json({ error: "Conversation introuvable" });
      return;
    }
    if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
      res.status(403).json({ error: "Non autorisé" });
      return;
    }

    const total = await prisma.message.count({ where: { conversationId: id } });

    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      include: {
        sender: { select: userSelect },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Marquer les messages reçus comme lus
    await prisma.message.updateMany({
      where: {
        conversationId: id,
        senderId: { not: userId },
        isRead: false,
      },
      data: { isRead: true },
    });

    res.json({
      messages: messages.reverse(), // Ordre chronologique
      total,
      page,
      hasMore: page * limit < total,
    });
  } catch (err) {
    console.error("[getMessages]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
}

// ── POST /api/conversations/:id/messages ────────────────────
export async function sendMessage(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { content } = req.body;

    if (!content?.trim()) {
      res.status(400).json({ error: "Le message ne peut pas être vide" });
      return;
    }

    // Vérifier que l'user est participant
    const conversation = await prisma.conversation.findUnique({ where: { id } });
    if (!conversation) {
      res.status(404).json({ error: "Conversation introuvable" });
      return;
    }
    if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
      res.status(403).json({ error: "Non autorisé" });
      return;
    }

    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId: id,
          senderId: userId,
          content: content.trim(),
        },
        include: {
          sender: { select: userSelect },
        },
      }),
      prisma.conversation.update({
        where: { id },
        data: { lastMessageAt: new Date() },
      }),
    ]);

    // Envoyer push notification à l'autre participant
    const otherUserId =
      conversation.participant1Id === userId
        ? conversation.participant2Id
        : conversation.participant1Id;

    const sender = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true },
    });

    sendPushNotification({
      userId: otherUserId,
      type: "MESSAGE_RECEIVED",
      title: `Message de ${sender?.firstName ?? "Quelqu'un"}`,
      body: content.trim().length > 80 ? content.trim().slice(0, 80) + "…" : content.trim(),
      data: { conversationId: id },
    });

    res.json({ message });
  } catch (err) {
    console.error("[sendMessage]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
}

// ── GET /api/conversations/unread-count ─────────────────────
export async function getUnreadCount(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;

    // Trouver toutes les conversations de l'user
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ participant1Id: userId }, { participant2Id: userId }],
      },
      select: { id: true },
    });

    const conversationIds = conversations.map((c) => c.id);

    const unreadCount = conversationIds.length > 0
      ? await prisma.message.count({
          where: {
            conversationId: { in: conversationIds },
            senderId: { not: userId },
            isRead: false,
          },
        })
      : 0;

    res.json({ unreadCount });
  } catch (err) {
    console.error("[getUnreadCount]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
}
