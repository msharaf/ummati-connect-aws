import { router, protectedProcedure } from "../trpc";
import { prisma, type Prisma } from "@ummati/db";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { calculateHalalFocus, getHalalFocusQuestionnaire, type HalalFocusResponse } from "../lib/halalfocus";

export const investorProfileRouter = router({
  // Get current investor's profile
  getMyInvestorProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await prisma.user.findUnique({
      where: { clerkId: ctx.userId },
      include: { investorProfile: true }
    });

    if (!user || user.role !== "INVESTOR") {
      return null;
    }

    return {
      id: user.investorProfile?.id || null,
      fullName: user.investorProfile?.fullName || null,
      email: user.investorProfile?.email || user.email,
      halalScore: user.investorProfile?.halalScore || null,
      halalCategory: user.investorProfile?.halalCategory || null,
      minTicketSize: user.investorProfile?.minTicketSize || null,
      maxTicketSize: user.investorProfile?.maxTicketSize || null,
      investmentPreferences: user.investorProfile?.investmentPreferences || null,
      location: user.investorProfile?.location || null,
      bio: user.investorProfile?.bio || null,
      industriesInterestedIn: user.investorProfile?.industriesInterestedIn || [],
      profileComplete: user.investorProfile?.profileComplete || false,
      onboardingComplete: user.investorProfile?.onboardingComplete || false,
      // Legacy fields
      hasAcceptedHalalTerms: user.investorProfile?.hasAcceptedHalalTerms || false,
      preferredSectors: user.investorProfile?.preferredSectors || [],
      geoFocus: user.investorProfile?.geoFocus || null,
      investmentThesis: user.investorProfile?.investmentThesis || null
    };
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
        include: { investorProfile: true }
      });

      if (!user || user.role !== "INVESTOR") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only investors can submit HalalFocus"
        });
      }

      // Calculate HalalFocus score and category
      const result = calculateHalalFocus(input.responses as HalalFocusResponse);

      // If forbidden, reject immediately
      if (result.halalCategory === "forbidden") {
        return {
          success: false,
          rejected: true,
          halalCategory: result.halalCategory,
          halalScore: result.halalScore,
          rejectionReason: result.rejectionReason
        };
      }

      // Update or create profile with HalalFocus results
      const profile = await prisma.investorProfile.upsert({
        where: { userId: user.id },
        update: {
          halalScore: result.halalScore,
          halalCategory: result.halalCategory as Prisma.InvestorProfileUpdateInput["halalCategory"],
          halalResponses: input.responses as Prisma.InputJsonValue,
          ...(user.investorProfile ? {} : {
            fullName: user.fullName || user.name || "",
            email: user.email
          })
        },
        create: {
          userId: user.id,
          fullName: user.fullName || user.name || "",
          email: user.email,
          halalScore: result.halalScore,
          halalCategory: result.halalCategory as Prisma.InvestorProfileUpdateInput["halalCategory"],
          halalResponses: input.responses as Prisma.InputJsonValue
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

  // Save profile details
  saveProfileDetails: protectedProcedure
    .input(
      z.object({
        fullName: z.string().optional(),
        minTicketSize: z.number().nullable().optional(),
        maxTicketSize: z.number().nullable().optional(),
        investmentPreferences: z.string().nullable().optional(),
        location: z.string().nullable().optional(),
        bio: z.string().nullable().optional(),
        industriesInterestedIn: z.array(z.string()).optional(),
        // Legacy fields
        preferredSectors: z.array(z.string()).optional(),
        geoFocus: z.string().nullable().optional(),
        investmentThesis: z.string().nullable().optional(),
        hasAcceptedHalalTerms: z.boolean().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await prisma.user.findUnique({
        where: { clerkId: ctx.userId },
        include: { investorProfile: true }
      });

      if (!user || user.role !== "INVESTOR") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only investors can update investor profile"
        });
      }

      // Check if HalalFocus is completed (required before profile can be complete)
      // ⚠️ DEVELOPMENT ONLY: Also accept hasAcceptedHalalTerms as sufficient
      // TODO: Remove this before production - require halalCategory to be set
      const hasHalalFocus = user.investorProfile?.halalCategory !== null || 
                           (user.investorProfile?.hasAcceptedHalalTerms === true);

      if (!hasHalalFocus) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Complete HalalFocus verification first"
        });
      }

      // If halalCategory is not set but hasAcceptedHalalTerms is true, set default values
      // This handles legacy profiles that accepted terms before halalCategory was required
      if (user.investorProfile?.halalCategory === null && user.investorProfile?.hasAcceptedHalalTerms === true) {
        await prisma.investorProfile.update({
          where: { userId: user.id },
          data: {
            halalCategory: "halal",
            halalScore: 85
          }
        });
      }

      // Determine if profile is complete (all required fields filled)
      const profileComplete = !!(
        (input.fullName || user.investorProfile?.fullName) &&
        (input.minTicketSize !== undefined || user.investorProfile?.minTicketSize !== null) &&
        (input.maxTicketSize !== undefined || user.investorProfile?.maxTicketSize !== null) &&
        (input.location !== undefined || user.investorProfile?.location) &&
        (input.bio !== undefined || user.investorProfile?.bio)
      );

      // Onboarding is complete when profile is complete
      const onboardingComplete = profileComplete && hasHalalFocus;

      const profile = await prisma.investorProfile.upsert({
        where: { userId: user.id },
        update: {
          fullName: input.fullName !== undefined ? input.fullName : undefined,
          minTicketSize: input.minTicketSize !== undefined ? input.minTicketSize : undefined,
          maxTicketSize: input.maxTicketSize !== undefined ? input.maxTicketSize : undefined,
          investmentPreferences: input.investmentPreferences !== undefined ? input.investmentPreferences : undefined,
          location: input.location !== undefined ? input.location : undefined,
          bio: input.bio !== undefined ? input.bio : undefined,
          industriesInterestedIn: input.industriesInterestedIn !== undefined ? input.industriesInterestedIn : undefined,
          profileComplete,
          onboardingComplete,
          // Legacy fields
          preferredSectors: input.preferredSectors !== undefined ? input.preferredSectors : undefined,
          geoFocus: input.geoFocus !== undefined ? input.geoFocus : undefined,
          investmentThesis: input.investmentThesis !== undefined ? input.investmentThesis : undefined,
          hasAcceptedHalalTerms: input.hasAcceptedHalalTerms !== undefined ? input.hasAcceptedHalalTerms : undefined
        },
        create: {
          userId: user.id,
          fullName: input.fullName || user.fullName || user.name || "",
          email: user.email,
          minTicketSize: input.minTicketSize || null,
          maxTicketSize: input.maxTicketSize || null,
          investmentPreferences: input.investmentPreferences || null,
          location: input.location || null,
          bio: input.bio || null,
          industriesInterestedIn: input.industriesInterestedIn || [],
          profileComplete,
          onboardingComplete,
          // Legacy fields
          preferredSectors: input.preferredSectors || [],
          geoFocus: input.geoFocus || null,
          investmentThesis: input.investmentThesis || null,
          hasAcceptedHalalTerms: input.hasAcceptedHalalTerms ?? false
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
    })
});

