import { router, protectedProcedure } from "../trpc";
import { prisma } from "@ummati/db";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export const userRouter = router({
  // Get current user profile with onboarding status
  me: protectedProcedure.query(async ({ ctx }) => {
    // ctx.userId is the Clerk ID
    const user = await prisma.user.findUnique({
      where: {
        clerkId: ctx.userId
      },
      include: {
        investorProfile: true,
        visionaryProfile: true
      }
    });

    if (!user) {
      return {
        role: null,
        onboardingComplete: false,
        profile: null
      };
    }

    // Determine onboarding completion
    // Onboarding is complete if user has a role AND the corresponding profile
    const onboardingComplete =
      user.role !== null &&
      ((user.role === "INVESTOR" && user.investorProfile !== null) ||
        (user.role === "VISIONARY" && user.visionaryProfile !== null));

    return {
      role: user.role,
      onboardingComplete,
      profile: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        location: user.location,
        investorProfile: user.investorProfile,
        visionaryProfile: user.visionaryProfile
      }
    };
  }),

  // Set user role (INVESTOR or VISIONARY)
  setRole: protectedProcedure
    .input(
      z.object({
        role: z.enum(["INVESTOR", "VISIONARY"])
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get or create user
      // First, try to get user from Clerk to get email
      let user = await prisma.user.findUnique({
        where: {
          clerkId: ctx.userId
        }
      });

      // If user doesn't exist, we need to create them
      // For now, we'll require the user to exist (they should be created during sign-up)
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found. Please complete sign-up first."
        });
      }

      // Update user role
      const updatedUser = await prisma.user.update({
        where: {
          clerkId: ctx.userId
        },
        data: {
          role: input.role
        },
        include: {
          investorProfile: true,
          visionaryProfile: true
        }
      });

      // Determine onboarding completion
      const onboardingComplete =
        updatedUser.role !== null &&
        ((updatedUser.role === "INVESTOR" && updatedUser.investorProfile !== null) ||
          (updatedUser.role === "VISIONARY" && updatedUser.visionaryProfile !== null));

      return {
        role: updatedUser.role,
        onboardingComplete,
        profile: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          avatarUrl: updatedUser.avatarUrl,
          location: updatedUser.location,
          investorProfile: updatedUser.investorProfile,
          visionaryProfile: updatedUser.visionaryProfile
        }
      };
    })
});

