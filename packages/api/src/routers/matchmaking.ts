import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { prisma } from "@ummati/db";
import { TRPCError } from "@trpc/server";
import { getInvestorRecommendations, getFounderRecommendations } from "../lib/matching";

export const matchmakingRouter = router({
  // Get recommendations for the current user
  getRecommendations: protectedProcedure.query(async ({ ctx }) => {
    // Get current user
    const user = await prisma.user.findUnique({
      where: { clerkId: ctx.userId },
      include: {
        investorProfile: true,
        visionaryProfile: true
      }
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found"
      });
    }

    // Check onboarding completion
    const onboardingComplete =
      user.role !== null &&
      ((user.role === "INVESTOR" && user.investorProfile?.onboardingComplete) ||
        (user.role === "VISIONARY" && user.visionaryProfile?.onboardingComplete));

    if (!onboardingComplete) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Complete onboarding first"
      });
    }

    // Get recommendations based on role
    if (user.role === "INVESTOR") {
      const recommendations = await getInvestorRecommendations(user.id, 50);
      return {
        recommendations: recommendations.map(r => ({
          ...r.profile,
          matchScore: r.score,
          matchReasons: r.reasons
        }))
      };
    } else if (user.role === "VISIONARY") {
      const recommendations = await getFounderRecommendations(user.id, 50);
      return {
        recommendations: recommendations.map(r => ({
          ...r.profile,
          matchScore: r.score,
          matchReasons: r.reasons
        }))
      };
    }

    return { recommendations: [] };
  }),

  // Swipe on a profile (like or dislike)
  swipe: protectedProcedure
    .input(
      z.object({
        targetUserId: z.string(),
        direction: z.enum(["LIKE", "DISLIKE"])
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get current user
      const swiper = await prisma.user.findUnique({
        where: { clerkId: ctx.userId }
      });

      if (!swiper) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found"
        });
      }

      // Validate target user exists
      const target = await prisma.user.findUnique({
        where: { id: input.targetUserId }
      });

      if (!target) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Target user not found"
        });
      }

      if (swiper.id === target.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot swipe on yourself"
        });
      }

      // Create or update swipe
      const swipe = await prisma.swipe.upsert({
        where: {
          swiperId_targetId: {
            swiperId: swiper.id,
            targetId: target.id
          }
        },
        update: {
          direction: input.direction
        },
        create: {
          swiperId: swiper.id,
          targetId: target.id,
          direction: input.direction
        }
      });

      // If it's a LIKE, check for mutual match
      if (input.direction === "LIKE") {
        // Check if target has also liked the swiper
        const mutualSwipe = await prisma.swipe.findUnique({
          where: {
            swiperId_targetId: {
              swiperId: target.id,
              targetId: swiper.id
            }
          }
        });

        if (mutualSwipe && mutualSwipe.direction === "LIKE") {
          // Create match (ensure consistent ordering: smaller ID first)
          const userIdA = swiper.id < target.id ? swiper.id : target.id;
          const userIdB = swiper.id < target.id ? target.id : swiper.id;

          const existingMatch = await prisma.match.findUnique({
            where: {
              userAId_userBId: {
                userAId: userIdA,
                userBId: userIdB
              }
            }
          });

          if (!existingMatch) {
            await prisma.match.create({
              data: {
                userAId: userIdA,
                userBId: userIdB
              }
            });

            return {
              swipe,
              matchCreated: true
            };
          }
        }
      }

      return {
        swipe,
        matchCreated: false
      };
    }),

  // Get existing matches for the current user
  getMatches: protectedProcedure.query(async ({ ctx }) => {
    const user = await prisma.user.findUnique({
      where: { clerkId: ctx.userId }
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found"
      });
    }

    // Get all matches where user is involved
    const matches = await prisma.match.findMany({
      where: {
        OR: [{ userAId: user.id }, { userBId: user.id }]
      },
      include: {
        userA: {
          include: {
            investorProfile: true,
            visionaryProfile: true
          }
        },
        userB: {
          include: {
            investorProfile: true,
            visionaryProfile: true
          }
        },
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    // Map matches to include the other user's profile
    return matches.map(match => {
      const otherUser = match.userAId === user.id ? match.userB : match.userA;
      const lastMessage = match.messages[0] || null;

      return {
        id: match.id,
        createdAt: match.createdAt,
        otherUser: {
          id: otherUser.id,
          email: otherUser.email,
          fullName: otherUser.fullName || otherUser.name,
          avatarUrl: otherUser.avatarUrl,
          role: otherUser.role,
          investorProfile: otherUser.investorProfile,
          visionaryProfile: otherUser.visionaryProfile
        },
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              text: lastMessage.text,
              senderId: lastMessage.senderId,
              createdAt: lastMessage.createdAt,
              readBy: lastMessage.readBy
            }
          : null
      };
    });
  }),

  // Get a specific match by ID
  getMatch: protectedProcedure
    .input(z.object({ matchId: z.string() }))
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

      const match = await prisma.match.findUnique({
        where: { id: input.matchId },
        include: {
          userA: {
            include: {
              investorProfile: true,
              visionaryProfile: true
            }
          },
          userB: {
            include: {
              investorProfile: true,
              visionaryProfile: true
            }
          }
        }
      });

      if (!match) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Match not found"
        });
      }

      // Verify user is part of this match
      if (match.userAId !== user.id && match.userBId !== user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to view this match"
        });
      }

      const otherUser = match.userAId === user.id ? match.userB : match.userA;

      return {
        id: match.id,
        createdAt: match.createdAt,
        otherUser: {
          id: otherUser.id,
          email: otherUser.email,
          fullName: otherUser.fullName || otherUser.name,
          avatarUrl: otherUser.avatarUrl,
          role: otherUser.role,
          investorProfile: otherUser.investorProfile,
          visionaryProfile: otherUser.visionaryProfile
        }
      };
    })
});

