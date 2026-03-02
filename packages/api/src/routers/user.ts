import { router, protectedProcedure } from "../trpc";
import { prisma } from "@ummati/db";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { isAdminEmail } from "../lib/admin-emails";

const isDevLinkAllowed = () =>
  process.env.NODE_ENV === "development" ||
  process.env.UMMATI_DEV_LINK_BY_EMAIL === "true";

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

    // HalalFocus verified = halalCategory set (from submitHalalFocus) or legacy hasAcceptedHalalTerms
    const halalFocusVerified =
      user.role === "INVESTOR" &&
      (user.investorProfile?.halalCategory !== null ||
        user.investorProfile?.hasAcceptedHalalTerms === true);

    return {
      role: user.role,
      onboardingComplete,
      halalFocusVerified: user.role === "INVESTOR" ? halalFocusVerified : undefined,
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
      const clerkId = ctx.userId;
      let user = await prisma.user.findUnique({
        where: { clerkId }
      });

      if (!user) {
        if (!process.env.CLERK_SECRET_KEY) {
          console.error("[user.setRole] CLERK_SECRET_KEY not set");
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Server configuration error. Please contact support."
          });
        }
        let email: string;
        let fullName: string | null;
        let name: string | null;
        try {
          const clerkUser = await ctx.clerk.users.getUser(ctx.userId);
          email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
          fullName =
            clerkUser.firstName || clerkUser.lastName
              ? `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim()
              : null;
          name = fullName;
        } catch (clerkError) {
          const err = clerkError as { status?: number };
          console.error("[user.setRole] Clerk getUser failed", {
            errorMessage: clerkError instanceof Error ? clerkError.message : String(clerkError),
            clerkStatus: err.status
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "User lookup failed. Please try again or contact support."
          });
        }
        if (!email) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "User email not found in Clerk"
          });
        }

        if (!email) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "User email not found in Clerk"
          });
        }

        const userByEmail = await prisma.user.findUnique({
          where: { email }
        });

        if (userByEmail) {
          if (userByEmail.clerkId === clerkId) {
            user = userByEmail;
          } else if (isDevLinkAllowed()) {
            user = await prisma.user.update({
              where: { email },
              data: { clerkId }
            });
          } else {
            throw new TRPCError({
              code: "CONFLICT",
              message:
                "An account with this email already exists. Please sign in with your existing account."
            });
          }
        } else {
          try {
            user = await prisma.user.create({
              data: {
                clerkId,
                email,
                name,
                fullName,
                role: input.role,
                isAdmin: isAdminEmail(email)
              }
            });
          } catch (error) {
            if (error instanceof TRPCError) {
              throw error;
            }
            const err = error as {
              code?: string;
              meta?: { target?: string[] };
              status?: number;
              errors?: unknown;
            };
            const target = Array.isArray(err.meta?.target) ? err.meta.target : [];
            if (err.code === "P2002" && target.includes("email")) {
              const existingByEmail = await prisma.user.findUnique({
                where: { email }
              });
              if (existingByEmail) {
                if (existingByEmail.clerkId === clerkId) {
                  user = existingByEmail;
                } else if (isDevLinkAllowed()) {
                  user = await prisma.user.update({
                    where: { email },
                    data: { clerkId }
                  });
                } else {
                  throw new TRPCError({
                    code: "CONFLICT",
                    message:
                      "An account with this email already exists. Please sign in with your existing account."
                  });
                }
              } else {
                console.error("[user.setRole] P2002 on email but findUnique returned null", {
                  email,
                  prismaCode: err.code,
                  prismaMeta: err.meta
                });
                throw new TRPCError({
                  code: "INTERNAL_SERVER_ERROR",
                  message: "User record conflict. Please try again or contact support."
                });
              }
            } else {
              const logData: Record<string, unknown> = {
                errorName: error instanceof Error ? error.name : "Unknown",
                errorMessage: error instanceof Error ? error.message : String(error),
                prismaCode: err.code,
                prismaMeta: err.meta,
                clerkStatus: err.status,
                clerkErrors: err.errors
              };
              console.error("[user.setRole] create user failed", logData);
              if (err.code === "P2002" && target.includes("clerkId")) {
                throw new TRPCError({
                  code: "CONFLICT",
                  message: "User record already exists. Please try again."
                });
              }
              const safeMessage =
                err.code === "P2002"
                  ? "User record conflict. Please try again or contact support."
                  : err.status
                    ? "User lookup failed. Please try again or contact support."
                    : "User record creation failed. Please try again or contact support.";
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: safeMessage
              });
            }
          }
        }
      }

      await prisma.user.update({
        where: { clerkId },
        data: { role: input.role }
      });

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
    }),

  // Alias for me (for backward compatibility with mobile app)
  getMe: protectedProcedure.query(async ({ ctx }) => {
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
    const onboardingComplete =
      user.role !== null &&
      ((user.role === "INVESTOR" && user.investorProfile?.onboardingComplete) ||
        (user.role === "VISIONARY" && user.visionaryProfile?.onboardingComplete));

    const halalFocusVerified =
      user.role === "INVESTOR" &&
      (user.investorProfile?.halalCategory !== null ||
        user.investorProfile?.hasAcceptedHalalTerms === true);

    return {
      role: user.role,
      onboardingComplete,
      halalFocusVerified: user.role === "INVESTOR" ? halalFocusVerified : undefined,
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
  })
});

