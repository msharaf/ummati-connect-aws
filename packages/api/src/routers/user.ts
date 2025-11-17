import { router, protectedProcedure } from "../trpc";
import { prisma } from "@ummati/db";

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
  })
});

