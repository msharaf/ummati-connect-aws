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

      // Get messages with pagination
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
        ...(input.cursor && {
          skip: 1,
          cursor: { id: input.cursor }
        })
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

  // Alias for getMessages (for compatibility)
  getMessagesForMatch: protectedProcedure
    .input(
      z.object({
        matchId: z.string(),
        limit: z.number().min(1).max(100).optional().default(50),
        cursor: z.string().optional()
      })
    )
    .query(async ({ ctx, input }) => {
      // Reuse getMessages logic
      const user = await prisma.user.findUnique({
        where: { clerkId: ctx.userId }
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found"
        });
      }

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
        take: (input.limit ?? 50) + 1,
        ...(input.cursor && {
          skip: 1,
          cursor: { id: input.cursor }
        })
      });

      const hasMore = messages.length > (input.limit ?? 50);
      const items = hasMore ? messages.slice(0, -1) : messages;

      const unreadMessageIds = items
        .filter(msg => !msg.readBy.includes(user.id))
        .map(msg => msg.id);

      if (unreadMessageIds.length > 0) {
        await prisma.message.updateMany({
          where: { id: { in: unreadMessageIds } },
          data: { readBy: { push: user.id } }
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

  // Get matches with last message for current user
  getMatchesWithLastMessage: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50)
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const user = await prisma.user.findUnique({
        where: { clerkId: ctx.userId }
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found"
        });
      }

      const limit = input?.limit ?? 50;

      // Get matches with last message, limited and ordered
      const matches = await prisma.match.findMany({
        where: {
          OR: [{ userAId: user.id }, { userBId: user.id }]
        },
        include: {
          userA: {
            select: {
              id: true,
              name: true,
              fullName: true,
              avatarUrl: true,
              role: true,
              location: true
            }
          },
          userB: {
            select: {
              id: true,
              name: true,
              fullName: true,
              avatarUrl: true,
              role: true,
              location: true
            }
          },
          messages: {
            take: 1,
            orderBy: { createdAt: "desc" },
            include: {
              sender: {
                select: {
                  id: true,
                  name: true,
                  fullName: true,
                  avatarUrl: true,
                  role: true
                }
              }
            }
          }
        },
        take: limit,
        orderBy: { createdAt: "desc" }
      });

      // Get unread counts for each match (batch query for efficiency)
      const matchIds = matches.map(m => m.id);
      const unreadCounts = matchIds.length > 0 ? await prisma.message.groupBy({
        by: ["matchId"],
        where: {
          matchId: { in: matchIds },
          senderId: { not: user.id },
          NOT: {
            readBy: {
              has: user.id
            }
          }
        },
        _count: {
          id: true
        }
      }) : [];

      const unreadCountMap = new Map(
        unreadCounts.map(item => [item.matchId, item._count.id])
      );

      // Map to expected format
      return matches.map(match => {
        const otherUser = match.userAId === user.id ? match.userB : match.userA;
        const lastMessage = match.messages[0] || null;

        return {
          matchId: match.id,
          otherUser: {
            id: otherUser.id,
            name: otherUser.name || otherUser.fullName,
            avatarUrl: otherUser.avatarUrl,
            role: otherUser.role,
            location: otherUser.location
          },
          lastMessage: lastMessage ? {
            id: lastMessage.id,
            text: lastMessage.text,
            createdAt: lastMessage.createdAt,
            senderId: lastMessage.senderId,
            sender: {
              id: lastMessage.sender.id,
              name: lastMessage.sender.name || lastMessage.sender.fullName,
              avatarUrl: lastMessage.sender.avatarUrl,
              role: lastMessage.sender.role
            }
          } : null,
          unreadCount: unreadCountMap.get(match.id) || 0,
          createdAt: match.createdAt
        };
      });
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

  // Mark messages as read
  markAsRead: protectedProcedure
    .input(
      z.object({
        matchId: z.string()
      })
    )
    .mutation(async ({ ctx, input }) => {
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

      if (!match || (match.userAId !== user.id && match.userBId !== user.id)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized"
        });
      }

      // Mark all messages in this match as read by current user
      await prisma.message.updateMany({
        where: {
          matchId: input.matchId,
          senderId: { not: user.id },
          NOT: {
            readBy: {
              has: user.id
            }
          }
        },
        data: {
          readBy: {
            push: user.id
          }
        }
      });

      return { success: true };
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

    // Use count query directly - more efficient than fetching all matches
    // This counts messages across all matches where user is involved
    const unreadCount = await prisma.message.count({
      where: {
        match: {
          OR: [{ userAId: user.id }, { userBId: user.id }]
        },
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
