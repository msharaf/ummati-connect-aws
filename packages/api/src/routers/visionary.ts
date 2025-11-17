import { router, protectedProcedure } from "../trpc";
import { prisma } from "@ummati/db";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { StartupStage, RiskCategory } from "@ummati/db";

export const visionaryRouter = router({
  // Get current visionary's profile
  getMyProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await prisma.user.findUnique({
      where: { clerkId: ctx.userId },
      include: {
        visionaryProfile: {
          include: {
            barakahScore: true
          }
        }
      }
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      location: user.location,
      avatarUrl: user.avatarUrl,
      startupName: user.visionaryProfile?.startupName || null,
      tagline: user.visionaryProfile?.tagline || null,
      startupStage: user.visionaryProfile?.startupStage || null,
      sector: user.visionaryProfile?.sector || null,
      description: user.visionaryProfile?.description || null,
      pitch: user.visionaryProfile?.pitch || null,
      fundingAsk: user.visionaryProfile?.fundingAsk || null,
      websiteUrl: user.visionaryProfile?.websiteUrl || null,
      logoUrl: user.visionaryProfile?.logoUrl || null,
      teamSize: user.visionaryProfile?.teamSize || null,
      halalCategory: user.visionaryProfile?.halalCategory || null,
      riskCategory: user.visionaryProfile?.riskCategory || null,
      isApproved: user.visionaryProfile?.isApproved || false,
      isFlagged: user.visionaryProfile?.isFlagged || false,
      rejectionReason: user.visionaryProfile?.rejectionReason || null,
      barakahScore: user.visionaryProfile?.barakahScore?.score || null
    };
  }),

  // Save profile details (update existing)
  saveProfileDetails: protectedProcedure
    .input(
      z.object({
        startupName: z.string().min(1),
        tagline: z.string().nullable().optional(),
        startupStage: z.nativeEnum(StartupStage),
        sector: z.string().min(1),
        description: z.string().nullable().optional(),
        pitch: z.string().nullable().optional(),
        fundingAsk: z.number().nullable().optional(),
        location: z.string().nullable().optional(),
        websiteUrl: z.string().url().nullable().optional(),
        logoUrl: z.string().url().nullable().optional(),
        teamSize: z.number().nullable().optional(),
        halalCategory: z.string().nullable().optional()
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

      // Update or create visionary profile
      const profile = await prisma.visionaryProfile.upsert({
        where: { userId: user.id },
        update: {
          startupName: input.startupName,
          tagline: input.tagline || null,
          startupStage: input.startupStage,
          sector: input.sector,
          description: input.description || null,
          pitch: input.pitch || null,
          fundingAsk: input.fundingAsk || null,
          location: input.location || null,
          websiteUrl: input.websiteUrl || null,
          logoUrl: input.logoUrl || null,
          teamSize: input.teamSize || null,
          halalCategory: input.halalCategory || null
        },
        create: {
          userId: user.id,
          startupName: input.startupName,
          tagline: input.tagline || null,
          startupStage: input.startupStage,
          sector: input.sector,
          description: input.description || null,
          pitch: input.pitch || null,
          fundingAsk: input.fundingAsk || null,
          location: input.location || null,
          websiteUrl: input.websiteUrl || null,
          logoUrl: input.logoUrl || null,
          teamSize: input.teamSize || null,
          halalCategory: input.halalCategory || null
        }
      });

      return { success: true, profile };
    }),

  // Create or update profile (alias for saveProfileDetails)
  createOrUpdateProfile: protectedProcedure
    .input(
      z.object({
        startupName: z.string().min(1),
        tagline: z.string().nullable().optional(),
        startupStage: z.nativeEnum(StartupStage),
        sector: z.string().min(1),
        description: z.string().nullable().optional(),
        pitch: z.string().nullable().optional(),
        fundingAsk: z.number().nullable().optional(),
        location: z.string().nullable().optional(),
        websiteUrl: z.string().url().nullable().optional(),
        logoUrl: z.string().url().nullable().optional(),
        teamSize: z.number().nullable().optional(),
        halalCategory: z.string().nullable().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Reuse saveProfileDetails logic
      const user = await prisma.user.findUnique({
        where: { clerkId: ctx.userId }
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found"
        });
      }

      const profile = await prisma.visionaryProfile.upsert({
        where: { userId: user.id },
        update: {
          startupName: input.startupName,
          tagline: input.tagline || null,
          startupStage: input.startupStage,
          sector: input.sector,
          description: input.description || null,
          pitch: input.pitch || null,
          fundingAsk: input.fundingAsk || null,
          location: input.location || null,
          websiteUrl: input.websiteUrl || null,
          logoUrl: input.logoUrl || null,
          teamSize: input.teamSize || null,
          halalCategory: input.halalCategory || null
        },
        create: {
          userId: user.id,
          startupName: input.startupName,
          tagline: input.tagline || null,
          startupStage: input.startupStage,
          sector: input.sector,
          description: input.description || null,
          pitch: input.pitch || null,
          fundingAsk: input.fundingAsk || null,
          location: input.location || null,
          websiteUrl: input.websiteUrl || null,
          logoUrl: input.logoUrl || null,
          teamSize: input.teamSize || null,
          halalCategory: input.halalCategory || null
        }
      });

      return { success: true, profile };
    }),

  // Verify halal compliance
  verifyHalalCompliance: protectedProcedure
    .input(
      z.object({
        halalResponses: z.record(z.any()).optional(),
        riskCategory: z.nativeEnum(RiskCategory).optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await prisma.user.findUnique({
        where: { clerkId: ctx.userId },
        include: { visionaryProfile: true }
      });

      if (!user || !user.visionaryProfile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Visionary profile not found"
        });
      }

      await prisma.visionaryProfile.update({
        where: { userId: user.id },
        data: {
          halalResponses: input.halalResponses || null,
          riskCategory: input.riskCategory || null
        }
      });

      return { success: true };
    })
});

