import { router, protectedProcedure } from "../trpc";
import { prisma, type Prisma } from "@ummati/db";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export const investorRouter = router({
  // Get current investor's profile
  getMyProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await prisma.user.findUnique({
      where: { clerkId: ctx.userId },
      include: { investorProfile: true }
    });

    if (!user || user.role !== "INVESTOR") {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Investor profile not found"
      });
    }

    return {
      id: user.investorProfile?.id || null,
      hasAcceptedHalalTerms: user.investorProfile?.hasAcceptedHalalTerms || false,
      minTicketSize: user.investorProfile?.minTicketSize || null,
      maxTicketSize: user.investorProfile?.maxTicketSize || null,
      preferredSectors: user.investorProfile?.preferredSectors || [],
      geoFocus: user.investorProfile?.geoFocus || null,
      investmentThesis: user.investorProfile?.investmentThesis || null
    };
  }),

  // Browse visionaries with filters and pagination
  browseVisionaries: protectedProcedure
    .input(
      z.object({
        sector: z.string().nullable().optional(),
        location: z.string().nullable().optional(),
        halalCategory: z.string().nullable().optional(),
        minBarakah: z.number().optional(),
        stage: z.string().nullable().optional(),
        search: z.string().nullable().optional(),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional()
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify user is an investor
      const user = await prisma.user.findUnique({
        where: { clerkId: ctx.userId },
        include: { investorProfile: true }
      });

      if (!user || user.role !== "INVESTOR") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only investors can browse visionaries"
        });
      }

      // Build where clause for filters
      const where: Prisma.UserWhereInput = {
        role: "VISIONARY",
        visionaryProfile: {
          isApproved: true,
          ...(input.sector && { sector: input.sector }),
          ...(input.location && { location: input.location }),
          ...(input.halalCategory && { halalCategory: input.halalCategory }),
          ...(input.stage && { startupStage: input.stage }),
          ...(input.search && {
            OR: [
              { startupName: { contains: input.search, mode: "insensitive" } },
              { description: { contains: input.search, mode: "insensitive" } },
              { tagline: { contains: input.search, mode: "insensitive" } }
            ]
          })
        }
      };

      const profiles = await prisma.user.findMany({
        where,
        include: {
          visionaryProfile: {
            include: {
              barakahScore: true
            }
          }
        },
        take: input.limit + 1,
        ...(input.cursor && {
          skip: 1,
          cursor: { id: input.cursor }
        }),
        orderBy: { createdAt: "desc" }
      });

      let nextCursor: string | undefined = undefined;
      if (profiles.length > input.limit) {
        const nextItem = profiles.pop();
        nextCursor = nextItem?.id;
      }

      return {
        profiles: profiles.map((user) => ({
          id: user.id,
          name: user.name || "",
          email: user.email,
          location: user.location || "",
          avatarUrl: user.avatarUrl,
          visionaryProfile: user.visionaryProfile
            ? {
                id: user.visionaryProfile.id,
                startupName: user.visionaryProfile.startupName,
                tagline: user.visionaryProfile.tagline,
                startupStage: user.visionaryProfile.startupStage,
                sector: user.visionaryProfile.sector,
                description: user.visionaryProfile.description,
                fundingNeeded: user.visionaryProfile.fundingNeeded,
                location: user.visionaryProfile.location,
                logoUrl: user.visionaryProfile.logoUrl,
                barakahScore: user.visionaryProfile.barakahScore?.score || null
              }
            : null
        })),
        nextCursor
      };
    }),

  // Get filter options for browsing
  getFilterOptions: protectedProcedure.query(async ({ _ctx }) => {
    const sectors = await prisma.visionaryProfile.findMany({
      select: { sector: true },
      distinct: ["sector"]
    });

    const locations = await prisma.visionaryProfile.findMany({
      select: { location: true },
      distinct: ["location"]
    });

    const halalCategories = await prisma.visionaryProfile.findMany({
      select: { halalCategory: true },
      distinct: ["halalCategory"],
      where: { halalCategory: { not: null } }
    });

    return {
      sectors: sectors.map((s) => s.sector),
      locations: locations.map((l) => l.location).filter(Boolean),
      halalCategories: halalCategories
        .map((c) => c.halalCategory)
        .filter(Boolean) as string[],
      stages: ["IDEA", "MVP", "TRACTION", "SCALING"]
    };
  }),

  // Get detailed visionary profile
  getVisionaryDetails: protectedProcedure
    .input(z.object({ visionaryId: z.string() }))
    .query(async ({ _ctx, input }) => {
      const visionary = await prisma.user.findUnique({
        where: { id: input.visionaryId },
        include: {
          visionaryProfile: {
            include: {
              barakahScore: true
            }
          }
        }
      });

      if (!visionary || visionary.role !== "VISIONARY") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Visionary not found"
        });
      }

      return {
        id: visionary.id,
        name: visionary.name || "",
        email: visionary.email,
        location: visionary.location,
        avatarUrl: visionary.avatarUrl,
        visionaryProfile: visionary.visionaryProfile
      };
    }),

  // Shortlist a visionary
  shortlistVisionary: protectedProcedure
    .input(z.object({ visionaryId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const investor = await prisma.user.findUnique({
        where: { clerkId: ctx.userId },
        include: { investorProfile: true }
      });

      if (!investor || investor.role !== "INVESTOR") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only investors can shortlist"
        });
      }

      // Find visionary by user ID or visionary profile ID
      const visionaryUser = await prisma.user.findUnique({
        where: { id: input.visionaryId },
        include: { visionaryProfile: true }
      });

      if (!visionaryUser || !visionaryUser.visionaryProfile) {
        // Try finding by visionary profile ID
        const visionaryProfile = await prisma.visionaryProfile.findUnique({
          where: { id: input.visionaryId }
        });

        if (!visionaryProfile) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Visionary profile not found"
          });
        }

        // Check if already shortlisted
        const existing = await prisma.shortlist.findUnique({
          where: {
            investorId_visionaryId: {
              investorId: investor.id,
              visionaryId: visionaryProfile.id
            }
          }
        });

        if (existing) {
          return { success: true, alreadyShortlisted: true };
        }

        // Create shortlist entry
        await prisma.shortlist.create({
          data: {
            investorId: investor.id,
            visionaryId: visionaryProfile.id
          }
        });

        return { success: true, alreadyShortlisted: false };
      }

      // Check if already shortlisted
      const existing = await prisma.shortlist.findUnique({
        where: {
          investorId_visionaryId: {
            investorId: investor.id,
            visionaryId: visionaryUser.visionaryProfile.id
          }
        }
      });

      if (existing) {
        return { success: true, alreadyShortlisted: true };
      }

      // Create shortlist entry
      await prisma.shortlist.create({
        data: {
          investorId: investor.id,
          visionaryId: visionaryUser.visionaryProfile.id
        }
      });

      return { success: true, alreadyShortlisted: false };
    }),

  // Accept halal terms
  acceptHalalTerms: protectedProcedure.mutation(async ({ ctx }) => {
    const user = await prisma.user.findUnique({
      where: { clerkId: ctx.userId },
      include: { investorProfile: true }
    });

    if (!user || user.role !== "INVESTOR") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only investors can accept halal terms"
      });
    }

    // ⚠️ DEVELOPMENT ONLY: Set default halalCategory when accepting terms
    // This allows investors to proceed without completing full HalalFocus questionnaire
    // TODO: Remove this before production - require full HalalFocus submission
    const defaultHalalCategory = "halal" as const;
    const defaultHalalScore = 85;

    if (!user.investorProfile) {
      // Create investor profile if it doesn't exist
      await prisma.investorProfile.create({
        data: {
          userId: user.id,
          fullName: user.fullName || user.name || "",
          email: user.email,
          hasAcceptedHalalTerms: true,
          halalCategory: defaultHalalCategory,
          halalScore: defaultHalalScore
        }
      });
    } else {
      // Update existing profile
      await prisma.investorProfile.update({
        where: { userId: user.id },
        data: { 
          hasAcceptedHalalTerms: true,
          // Only set halalCategory if not already set (don't overwrite existing HalalFocus results)
          ...(user.investorProfile.halalCategory === null ? {
            halalCategory: defaultHalalCategory,
            halalScore: defaultHalalScore
          } : {})
        }
      });
    }

    return { success: true };
  })
});

