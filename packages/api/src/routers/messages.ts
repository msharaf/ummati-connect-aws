import { router, protectedProcedure } from "../trpc";
import { prisma } from "@ummati/db";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export const messagesRouter = router({
  // Get messages for a specific match
  getMessages: protectedProcedure
    .input(
      z.object({
        matchId: z.string(),
        limit: z.number().min(1).max(100).optional().default(50),
        cursor: z.string().optional()
      })
    )
    .query(async ({ ctx, input }) => {
      // Get current user
      const user = await prisma.user.findUnique({
        where: { clerkId: ctx.userId }
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found"
        });
      }

      // Verify user is part of this match
      const match = await prisma.match.findUnique({
        where: { id: input.matchId }
      });

      if (!match) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Match not found"
        });
      }

      if (match.userAId !== user.id && match.userBId !== user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to view messages for this match"
        });
      }

      // Get messages
      const messages = await prisma.message.findMany({
        where: { matchId: input.matchId },
        include: {
          sender: {
            select: {
              id: true,
              email: true,
              fullName: true,
              name: true,
              avatarUrl: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined
      });

      const hasMore = messages.length > input.limit;
      const items = hasMore ? messages.slice(0, -1) : messages;

      // Mark messages as read by current user
      const unreadMessageIds = items
        .filter(msg => !msg.readBy.includes(user.id))
        .map(msg => msg.id);

      if (unreadMessageIds.length > 0) {
        await prisma.message.updateMany({
          where: {
            id: { in: unreadMessageIds }
          },
          data: {
            readBy: {
              push: user.id
            }
          }
        });
      }

      return {
        messages: items.reverse().map(msg => ({
          id: msg.id,
          text: msg.text,
          senderId: msg.senderId,
          sender: {
            id: msg.sender.id,
            email: msg.sender.email,
            fullName: msg.sender.fullName || msg.sender.name,
            avatarUrl: msg.sender.avatarUrl
          },
          createdAt: msg.createdAt,
          readBy: msg.readBy
        })),
        nextCursor: hasMore ? items[items.length - 1]?.id : null
      };
    }),

  // Send a message in a match
  sendMessage: protectedProcedure
    .input(
      z.object({
        matchId: z.string(),
        text: z.string().min(1).max(5000)
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get current user
      const user = await prisma.user.findUnique({
        where: { clerkId: ctx.userId }
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found"
        });
      }

      // Verify user is part of this match
      const match = await prisma.match.findUnique({
        where: { id: input.matchId }
      });

      if (!match) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Match not found"
        });
      }

      if (match.userAId !== user.id && match.userBId !== user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to send messages in this match"
        });
      }

      // Create message
      const message = await prisma.message.create({
        data: {
          matchId: input.matchId,
          senderId: user.id,
          text: input.text,
          readBy: [] // Start with empty readBy array
        },
        include: {
          sender: {
            select: {
              id: true,
              email: true,
              fullName: true,
              name: true,
              avatarUrl: true
            }
          }
        }
      });

      return {
        id: message.id,
        text: message.text,
        senderId: message.senderId,
        sender: {
          id: message.sender.id,
          email: message.sender.email,
          fullName: message.sender.fullName || message.sender.name,
          avatarUrl: message.sender.avatarUrl
        },
        createdAt: message.createdAt,
        readBy: message.readBy
      };
    }),

  // Get unread message count for all matches
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const user = await prisma.user.findUnique({
      where: { clerkId: ctx.userId }
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found"
      });
    }

    // Get all matches for user
    const matches = await prisma.match.findMany({
      where: {
        OR: [{ userAId: user.id }, { userBId: user.id }]
      },
      select: { id: true }
    });

    const matchIds = matches.map(m => m.id);

    if (matchIds.length === 0) {
      return { count: 0 };
    }

    // Count unread messages
    const unreadCount = await prisma.message.count({
      where: {
        matchId: { in: matchIds },
        senderId: { not: user.id },
        NOT: {
          readBy: {
            has: user.id
          }
        }
      }
    });

    return { count: unreadCount };
  })
});

