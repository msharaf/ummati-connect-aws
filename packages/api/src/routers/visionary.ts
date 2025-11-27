import { router, protectedProcedure } from "../trpc";
import { prisma } from "@ummati/db";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { StartupStage, RiskCategory } from "@ummati/db";
import { calculateHalalFocus, getHalalFocusQuestionnaire, type HalalFocusResponse } from "../lib/halalfocus";

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
      fullName: user.fullName || user.name,
      location: user.location,
      avatarUrl: user.avatarUrl,
      startupName: user.visionaryProfile?.startupName || null,
      tagline: user.visionaryProfile?.tagline || null,
      startupStage: user.visionaryProfile?.startupStage || null,
      industry: user.visionaryProfile?.industry || user.visionaryProfile?.sector || null,
      sector: user.visionaryProfile?.sector || null, // Legacy
      description: user.visionaryProfile?.description || null,
      pitch: user.visionaryProfile?.pitch || null,
      fundingNeeded: user.visionaryProfile?.fundingNeeded || user.visionaryProfile?.fundingAsk || null,
      fundingAsk: user.visionaryProfile?.fundingAsk || null, // Legacy
      websiteUrl: user.visionaryProfile?.websiteUrl || null,
      logoUrl: user.visionaryProfile?.logoUrl || null,
      teamSize: user.visionaryProfile?.teamSize || null,
      halalScore: user.visionaryProfile?.halalScore || null,
      halalCategory: user.visionaryProfile?.halalCategory || null,
      riskCategory: user.visionaryProfile?.riskCategory || null, // Legacy
      profileComplete: user.visionaryProfile?.profileComplete || false,
      onboardingComplete: user.visionaryProfile?.onboardingComplete || false,
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
        fullName: z.string().optional(),
        startupName: z.string().min(1),
        tagline: z.string().nullable().optional(),
        startupStage: z.nativeEnum(StartupStage),
        industry: z.string().min(1).optional(), // New field
        sector: z.string().min(1).optional(), // Legacy - keep for backward compatibility
        description: z.string().nullable().optional(),
        pitch: z.string().nullable().optional(),
        fundingNeeded: z.number().nullable().optional(), // New field
        fundingAsk: z.number().nullable().optional(), // Legacy
        location: z.string().nullable().optional(),
        websiteUrl: z.string().url().nullable().optional(),
        logoUrl: z.string().url().nullable().optional(),
        teamSize: z.number().nullable().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await prisma.user.findUnique({
        where: { clerkId: ctx.userId },
        include: { visionaryProfile: true }
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found"
        });
      }

      // Check if HalalFocus is completed (required before profile can be complete)
      const hasHalalFocus = user.visionaryProfile?.halalCategory !== null;

      if (!hasHalalFocus) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Complete HalalFocus verification first"
        });
      }

      // Determine industry (use new field or legacy sector)
      const industry = input.industry || input.sector || user.visionaryProfile?.industry || user.visionaryProfile?.sector || "General";

      // Determine if profile is complete (all required fields filled)
      const profileComplete = !!(
        (input.fullName || user.visionaryProfile?.fullName || user.fullName || user.name) &&
        input.startupName &&
        input.startupStage &&
        industry &&
        (input.location !== undefined || user.visionaryProfile?.location) &&
        (input.description !== undefined || user.visionaryProfile?.description)
      );

      // Onboarding is complete when profile is complete and HalalFocus is done
      const onboardingComplete = profileComplete && hasHalalFocus;

      // Update or create visionary profile
      const profile = await prisma.visionaryProfile.upsert({
        where: { userId: user.id },
        update: {
          fullName: input.fullName !== undefined ? input.fullName : undefined,
          startupName: input.startupName,
          tagline: input.tagline !== undefined ? input.tagline : undefined,
          startupStage: input.startupStage,
          industry: industry,
          sector: input.sector !== undefined ? input.sector : undefined, // Legacy
          description: input.description !== undefined ? input.description : undefined,
          pitch: input.pitch !== undefined ? input.pitch : undefined,
          fundingNeeded: input.fundingNeeded !== undefined ? input.fundingNeeded : (input.fundingAsk !== undefined ? input.fundingAsk : undefined),
          fundingAsk: input.fundingAsk !== undefined ? input.fundingAsk : undefined, // Legacy
          location: input.location !== undefined ? input.location : undefined,
          websiteUrl: input.websiteUrl !== undefined ? input.websiteUrl : undefined,
          logoUrl: input.logoUrl !== undefined ? input.logoUrl : undefined,
          teamSize: input.teamSize !== undefined ? input.teamSize : undefined,
          profileComplete,
          onboardingComplete
        },
        create: {
          userId: user.id,
          fullName: input.fullName || user.fullName || user.name || "",
          email: user.email,
          startupName: input.startupName,
          tagline: input.tagline || null,
          startupStage: input.startupStage,
          industry: industry,
          sector: input.sector || industry, // Legacy
          description: input.description || null,
          pitch: input.pitch || null,
          fundingNeeded: input.fundingNeeded || input.fundingAsk || null,
          fundingAsk: input.fundingAsk || null, // Legacy
          location: input.location || null,
          websiteUrl: input.websiteUrl || null,
          logoUrl: input.logoUrl || null,
          teamSize: input.teamSize || null,
          profileComplete,
          onboardingComplete
        }
      });

      // Update user's fullName if provided
      if (input.fullName) {
        await prisma.user.update({
          where: { id: user.id },
          data: { fullName: input.fullName }
        });
      }

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

  // Get HalalFocus questionnaire
  getHalalFocusQuestionnaire: protectedProcedure.query(async () => {
    return getHalalFocusQuestionnaire();
  }),

  // Submit HalalFocus verification
  submitHalalFocus: protectedProcedure
    .input(
      z.object({
        responses: z.object({
          industryInvolvesInterest: z.boolean().optional(),
          industryInvolvesGambling: z.boolean().optional(),
          industryInvolvesAdultContent: z.boolean().optional(),
          industryInvolvesIntoxicants: z.boolean().optional(),
          industryInvolvesNonHalalProducts: z.boolean().optional(),
          industryInvolvesHighRiskBehaviors: z.boolean().optional(),
          industryInvolvesDeceptivePractices: z.boolean().optional(),
          additionalNotes: z.string().optional()
        })
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await prisma.user.findUnique({
        where: { clerkId: ctx.userId },
        include: { visionaryProfile: true }
      });

      if (!user || user.role !== "VISIONARY") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only visionaries can submit HalalFocus"
        });
      }

      // Calculate HalalFocus score and category
      const result = calculateHalalFocus(input.responses as HalalFocusResponse);

      // If forbidden, reject immediately
      if (result.halalCategory === "forbidden") {
        // Update profile even if rejected (to store rejection reason)
        if (user.visionaryProfile) {
          await prisma.visionaryProfile.update({
            where: { userId: user.id },
            data: {
              halalScore: result.halalScore,
              halalCategory: result.halalCategory as any,
              halalResponses: input.responses as any,
              rejectionReason: result.rejectionReason,
              isFlagged: true
            }
          });
        }

        return {
          success: false,
          rejected: true,
          halalCategory: result.halalCategory,
          halalScore: result.halalScore,
          rejectionReason: result.rejectionReason
        };
      }

      // Update or create profile with HalalFocus results
      const profile = await prisma.visionaryProfile.upsert({
        where: { userId: user.id },
        update: {
          halalScore: result.halalScore,
          halalCategory: result.halalCategory as any,
          halalResponses: input.responses as any,
          ...(user.visionaryProfile ? {} : {
            fullName: user.fullName || user.name || "",
            email: user.email,
            startupName: "Temporary", // Will be updated later
            startupStage: StartupStage.IDEA,
            industry: "Temporary" // Will be updated later
          })
        },
        create: {
          userId: user.id,
          fullName: user.fullName || user.name || "",
          email: user.email,
          startupName: "Temporary", // Will be updated later
          startupStage: StartupStage.IDEA,
          industry: "Temporary", // Will be updated later
          halalScore: result.halalScore,
          halalCategory: result.halalCategory as any,
          halalResponses: input.responses as any
        }
      });

      return {
        success: true,
        rejected: false,
        halalCategory: result.halalCategory,
        halalScore: result.halalScore,
        profile
      };
    }),

  // Verify halal compliance - processes detailed questionnaire form
  verifyHalalCompliance: protectedProcedure
    .input(
      z.object({
        industry: z.string().min(1),
        responses: z.object({
          q1: z.string().optional(),
          q2: z.string().optional(),
          q3: z.boolean().optional(),
          q4: z.string().optional(),
          q5: z.string().optional(),
          q6: z.string().optional(),
          q7: z.boolean().optional(),
          q8: z.string().optional(),
          haramCategories: z.array(z.string()).optional()
        })
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await prisma.user.findUnique({
        where: { clerkId: ctx.userId },
        include: { visionaryProfile: true }
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found"
        });
      }

      // Determine risk category based on haram categories and industry
      let riskCategory: RiskCategory = RiskCategory.HALAL;
      let halalCategory: "halal" | "grey" | "forbidden" = "halal";
      let isFlagged = false;
      let isApproved = false;
      let rejectionReason: string | null = null;
      let halalScore = 100;

      // Check if haram categories are selected (automatic rejection)
      if (input.responses.haramCategories && input.responses.haramCategories.length > 0) {
        riskCategory = RiskCategory.HARAM;
        halalCategory = "forbidden";
        halalScore = 0;
        rejectionReason = `Industry involves prohibited categories: ${input.responses.haramCategories.join(", ")}`;
      } else {
        // Check for grey area industries
        const greyAreaKeywords = ["fintech", "crypto", "ai", "automation", "marketplace", "social"];
        const industryLower = input.industry.toLowerCase();
        const isGreyArea = greyAreaKeywords.some(keyword => industryLower.includes(keyword));

        // Check for interest/riba in responses
        const hasInterestConcerns = 
          input.responses.q4?.toLowerCase().includes("interest") ||
          input.responses.q4?.toLowerCase().includes("riba") ||
          input.responses.q5?.toLowerCase().includes("interest") ||
          input.responses.q5?.toLowerCase().includes("riba");

        // Check for high-risk indicators
        const hasRiskFactors = input.responses.q7 === true || hasInterestConcerns;

        if (hasInterestConcerns || (input.responses.q4 && input.responses.q4.toLowerCase().includes("yes"))) {
          riskCategory = RiskCategory.HARAM;
          halalCategory = "forbidden";
          halalScore = 0;
          rejectionReason = "Industry involves interest-based revenue (Riba)";
        } else if (isGreyArea || hasRiskFactors) {
          riskCategory = RiskCategory.GREY;
          halalCategory = "grey";
          halalScore = 60; // Grey area score
          isFlagged = true; // Needs manual review
        } else {
          riskCategory = RiskCategory.HALAL;
          halalCategory = "halal";
          halalScore = 85; // Good halal score
          isApproved = true; // Auto-approve clear halal cases
        }
      }

      // Prepare full responses object to store
      const fullResponses = {
        industry: input.industry,
        ...input.responses
      };

      // Create or update visionary profile
      await prisma.visionaryProfile.upsert({
        where: { userId: user.id },
        update: {
          industry: input.industry,
          halalResponses: fullResponses as any,
          riskCategory,
          halalCategory: halalCategory as any,
          halalScore,
          isFlagged,
          isApproved,
          rejectionReason
        },
        create: {
          userId: user.id,
          fullName: user.fullName || user.name || "",
          email: user.email,
          startupName: "Temporary", // Will be updated later
          startupStage: StartupStage.IDEA,
          industry: input.industry,
          halalResponses: fullResponses as any,
          riskCategory,
          halalCategory: halalCategory as any,
          halalScore,
          isFlagged,
          isApproved,
          rejectionReason
        }
      });

      // Return status that matches frontend expectations
      let status: "approved" | "flagged" | "rejected";
      if (riskCategory === RiskCategory.HARAM) {
        status = "rejected";
      } else if (isFlagged || riskCategory === RiskCategory.GREY) {
        status = "flagged";
      } else {
        status = "approved";
      }

      return {
        status,
        riskCategory,
        halalCategory,
        halalScore,
        rejectionReason
      };
    })
});

