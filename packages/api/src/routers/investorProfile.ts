import { router, protectedProcedure } from "../trpc";
import { prisma } from "@ummati/db";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

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
      hasAcceptedHalalTerms: user.investorProfile?.hasAcceptedHalalTerms || false,
      minTicketSize: user.investorProfile?.minTicketSize || null,
      maxTicketSize: user.investorProfile?.maxTicketSize || null,
      preferredSectors: user.investorProfile?.preferredSectors || [],
      geoFocus: user.investorProfile?.geoFocus || null,
      investmentThesis: user.investorProfile?.investmentThesis || null
    };
  }),

  // Save profile details
  saveProfileDetails: protectedProcedure
    .input(
      z.object({
        minTicketSize: z.number().nullable().optional(),
        maxTicketSize: z.number().nullable().optional(),
        preferredSectors: z.array(z.string()).optional(),
        geoFocus: z.string().nullable().optional(),
        investmentThesis: z.string().nullable().optional(),
        hasAcceptedHalalTerms: z.boolean().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await prisma.user.findUnique({
        where: { clerkId: ctx.userId }
      });

      if (!user || user.role !== "INVESTOR") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only investors can update investor profile"
        });
      }

      const profile = await prisma.investorProfile.upsert({
        where: { userId: user.id },
        update: {
          minTicketSize: input.minTicketSize || null,
          maxTicketSize: input.maxTicketSize || null,
          preferredSectors: input.preferredSectors || [],
          geoFocus: input.geoFocus || null,
          investmentThesis: input.investmentThesis || null,
          hasAcceptedHalalTerms: input.hasAcceptedHalalTerms ?? false
        },
        create: {
          userId: user.id,
          minTicketSize: input.minTicketSize || null,
          maxTicketSize: input.maxTicketSize || null,
          preferredSectors: input.preferredSectors || [],
          geoFocus: input.geoFocus || null,
          investmentThesis: input.investmentThesis || null,
          hasAcceptedHalalTerms: input.hasAcceptedHalalTerms ?? false
        }
      });

      return { success: true, profile };
    })
});

