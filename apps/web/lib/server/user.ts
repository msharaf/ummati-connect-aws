import { auth } from "@clerk/nextjs/server";
import { prisma } from "@ummati/db";

export interface ServerUserProfile {
  id: string;
  clerkId: string;
  email: string;
  name: string | null;
  role: "INVESTOR" | "VISIONARY" | null;
  onboardingComplete: boolean;
}

/**
 * Get current user profile on the server side
 * Use this in Server Components and Server Actions
 */
export async function getCurrentUserProfile(): Promise<ServerUserProfile | null> {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        investorProfile: true,
        visionaryProfile: true
      }
    });

    if (!user) {
      return null;
    }

    // Determine onboarding completion
    const onboardingComplete =
      user.role !== null &&
      ((user.role === "INVESTOR" && user.investorProfile !== null) ||
        (user.role === "VISIONARY" && user.visionaryProfile !== null));

    return {
      id: user.id,
      clerkId: user.clerkId,
      email: user.email,
      name: user.name,
      role: user.role,
      onboardingComplete
    };
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
}

