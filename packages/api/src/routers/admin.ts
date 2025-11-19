import { router, protectedProcedure } from "../trpc";
import { prisma } from "@ummati/db";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export const adminRouter = router({
  // Check if current user is admin
  checkAdmin: protectedProcedure.query(async ({ ctx }) => {
    const user = await prisma.user.findUnique({
      where: { clerkId: ctx.userId },
      select: { isAdmin: true }
    });

    return {
      isAdmin: user?.isAdmin || false
    };
  }),

  // Get all users (admin only)
  getAllUsers: protectedProcedure.query(async ({ ctx }) => {
    // Verify admin
    const user = await prisma.user.findUnique({
      where: { clerkId: ctx.userId }
    });

    if (!user || !user.isAdmin) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Admin access required"
      });
    }

    const users = await prisma.user.findMany({
      include: {
        investorProfile: true,
        visionaryProfile: true
      },
      orderBy: { createdAt: "desc" }
    });

    return users.map(u => ({
      id: u.id,
      clerkId: u.clerkId,
      email: u.email,
      fullName: u.fullName || u.name,
      role: u.role,
      isAdmin: u.isAdmin,
      isBanned: u.isBanned,
      createdAt: u.createdAt,
      investorProfile: u.investorProfile
        ? {
            halalScore: u.investorProfile.halalScore,
            halalCategory: u.investorProfile.halalCategory,
            profileComplete: u.investorProfile.profileComplete,
            onboardingComplete: u.investorProfile.onboardingComplete
          }
        : null,
      visionaryProfile: u.visionaryProfile
        ? {
            halalScore: u.visionaryProfile.halalScore,
            halalCategory: u.visionaryProfile.halalCategory,
            profileComplete: u.visionaryProfile.profileComplete,
            onboardingComplete: u.visionaryProfile.onboardingComplete,
            isApproved: u.visionaryProfile.isApproved,
            isFlagged: u.visionaryProfile.isFlagged
          }
        : null
    }));
  }),

  // Get user by ID (admin only)
  getUserById: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify admin
      const admin = await prisma.user.findUnique({
        where: { clerkId: ctx.userId }
      });

      if (!admin || !admin.isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required"
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: input.userId },
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

      return user;
    }),

  // Override halalCategory (admin only)
  overrideHalalCategory: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        halalCategory: z.enum(["halal", "grey", "forbidden"]).nullable(),
        reason: z.string().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify admin
      const admin = await prisma.user.findUnique({
        where: { clerkId: ctx.userId }
      });

      if (!admin || !admin.isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required"
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: input.userId },
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

      // Update based on role
      if (user.role === "INVESTOR" && user.investorProfile) {
        await prisma.investorProfile.update({
          where: { id: user.investorProfile.id },
          data: {
            halalCategory: input.halalCategory as any,
            halalResponses: input.reason
              ? {
                  adminOverride: {
                    category: input.halalCategory,
                    reason: input.reason,
                    overriddenBy: admin.id,
                    overriddenAt: new Date().toISOString()
                  }
                }
              : undefined
          }
        });
      } else if (user.role === "VISIONARY" && user.visionaryProfile) {
        await prisma.visionaryProfile.update({
          where: { id: user.visionaryProfile.id },
          data: {
            halalCategory: input.halalCategory as any,
            halalResponses: input.reason
              ? {
                  adminOverride: {
                    category: input.halalCategory,
                    reason: input.reason,
                    overriddenBy: admin.id,
                    overriddenAt: new Date().toISOString()
                  }
                }
              : undefined
          }
        });
      } else {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User has no profile to update"
        });
      }

      return { success: true };
    }),

  // Approve/Reject user (admin only)
  approveRejectUser: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        action: z.enum(["approve", "reject"]),
        reason: z.string().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify admin
      const admin = await prisma.user.findUnique({
        where: { clerkId: ctx.userId }
      });

      if (!admin || !admin.isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required"
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: input.userId },
        include: {
          visionaryProfile: true
        }
      });

      if (!user || !user.visionaryProfile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User or profile not found"
        });
      }

      await prisma.visionaryProfile.update({
        where: { id: user.visionaryProfile.id },
        data: {
          isApproved: input.action === "approve",
          isFlagged: input.action === "reject",
          rejectionReason: input.action === "reject" ? input.reason : null
        }
      });

      return { success: true };
    }),

  // Get reports/stats (admin only)
  getReports: protectedProcedure.query(async ({ ctx }) => {
    // Verify admin
    const admin = await prisma.user.findUnique({
      where: { clerkId: ctx.userId }
    });

    if (!admin || !admin.isAdmin) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Admin access required"
      });
    }

    // Get stats
    const [
      totalUsers,
      investors,
      founders,
      totalMatches,
      halalUsers,
      greyUsers,
      forbiddenUsers
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "INVESTOR" } }),
      prisma.user.count({ where: { role: "VISIONARY" } }),
      prisma.match.count(),
      prisma.user.count({
        where: {
          OR: [
            { investorProfile: { halalCategory: "halal" } },
            { visionaryProfile: { halalCategory: "halal" } }
          ]
        }
      }),
      prisma.user.count({
        where: {
          OR: [
            { investorProfile: { halalCategory: "grey" } },
            { visionaryProfile: { halalCategory: "grey" } }
          ]
        }
      }),
      prisma.user.count({
        where: {
          OR: [
            { investorProfile: { halalCategory: "forbidden" } },
            { visionaryProfile: { halalCategory: "forbidden" } }
          ]
        }
      })
    ]);

    return {
      totalUsers,
      investors,
      founders,
      totalMatches,
      halalUsers,
      greyUsers,
      forbiddenUsers
    };
  }),

  // Ban/Unban user (admin only)
  banUser: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        banned: z.boolean(),
        reason: z.string().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify admin
      const admin = await prisma.user.findUnique({
        where: { clerkId: ctx.userId }
      });

      if (!admin || !admin.isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required"
        });
      }

      await prisma.user.update({
        where: { id: input.userId },
        data: {
          isBanned: input.banned
        }
      });

      return { success: true };
    })
});

