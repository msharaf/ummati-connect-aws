import { router, protectedProcedure } from "../trpc";
import { prisma } from "@ummati/db";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { isAdminEmail } from "../lib/admin-emails";

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
    // Onboarding is complete if user has a role AND the corresponding profile is complete
    const onboardingComplete =
      user.role !== null &&
      ((user.role === "INVESTOR" && user.investorProfile?.onboardingComplete) ||
        (user.role === "VISIONARY" && user.visionaryProfile?.onboardingComplete));

    return {
      role: user.role,
      onboardingComplete,
        profile: {
          id: user.id,
          email: user.email,
          name: user.name,
          fullName: user.fullName || user.name,
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
      let user = await prisma.user.findUnique({
        where: {
          clerkId: ctx.userId
        }
      });

      // If user doesn't exist, create them from Clerk data
      if (!user) {
        try {
          // Get user info from Clerk
          const clerkUser = await ctx.clerk.users.getUser(ctx.userId);
          const email = clerkUser.emailAddresses[0]?.emailAddress;
          const fullName = clerkUser.firstName || clerkUser.lastName 
            ? `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim()
            : null;
          const name = fullName; // Legacy field

          if (!email) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "User email not found in Clerk"
            });
          }

          // Check if this email should be granted admin status
          const shouldBeAdmin = isAdminEmail(email);

          // Create user in database
          user = await prisma.user.create({
            data: {
              clerkId: ctx.userId,
              email,
              name,
              fullName,
              role: input.role,
              isAdmin: shouldBeAdmin
            }
          });
        } catch (error) {
          // If Clerk call fails or user creation fails
          if (error instanceof TRPCError) {
            throw error;
          }
          console.error("Error creating user:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create user. Please try again."
          });
        }
      } else {
        // User exists, just update role
        user = await prisma.user.update({
          where: {
            clerkId: ctx.userId
          },
          data: {
            role: input.role
          }
        });
      }

      // Get updated user with profiles
      const updatedUser = await prisma.user.findUnique({
        where: {
          clerkId: ctx.userId
        },
        include: {
          investorProfile: true,
          visionaryProfile: true
        }
      });

      if (!updatedUser) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve updated user"
        });
      }

      // Determine onboarding completion
      const onboardingComplete =
        updatedUser.role !== null &&
        ((updatedUser.role === "INVESTOR" && updatedUser.investorProfile?.onboardingComplete) ||
          (updatedUser.role === "VISIONARY" && updatedUser.visionaryProfile?.onboardingComplete));

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

