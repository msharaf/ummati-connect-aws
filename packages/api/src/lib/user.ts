import { prisma } from "@ummati/db";

export interface UserProfile {
  id: string;
  clerkId: string;
  email: string;
  name: string | null;
  role: "INVESTOR" | "VISIONARY" | null;
  avatarUrl: string | null;
  location: string | null;
  investorProfile: {
    id: string;
    minTicketSize: number | null;
    maxTicketSize: number | null;
    preferredSectors: string[];
    geoFocus: string | null;
  } | null;
  visionaryProfile: {
    id: string;
    startupName: string;
    tagline: string | null;
    startupStage: string;
    sector: string;
    description: string | null;
    isApproved: boolean;
  } | null;
  onboardingComplete: boolean;
}

/**
 * Get current user profile from Clerk ID
 * Fetches both Clerk user and Prisma user row
 */
export async function getCurrentUserProfile(
  clerkId: string | null
): Promise<UserProfile | null> {
  if (!clerkId) {
    return null;
  }

  try {
    // Fetch user from database
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

    // Determine if onboarding is complete
    // Onboarding is complete if:
    // - User has a role (INVESTOR or VISIONARY)
    // - User has the corresponding profile (investorProfile or visionaryProfile)
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
      avatarUrl: user.avatarUrl,
      location: user.location,
      investorProfile: user.investorProfile
        ? {
            id: user.investorProfile.id,
            minTicketSize: user.investorProfile.minTicketSize,
            maxTicketSize: user.investorProfile.maxTicketSize,
            preferredSectors: user.investorProfile.preferredSectors,
            geoFocus: user.investorProfile.geoFocus
          }
        : null,
      visionaryProfile: user.visionaryProfile
        ? {
            id: user.visionaryProfile.id,
            startupName: user.visionaryProfile.startupName,
            tagline: user.visionaryProfile.tagline,
            startupStage: user.visionaryProfile.startupStage,
            sector: user.visionaryProfile.sector,
            description: user.visionaryProfile.description,
            isApproved: user.visionaryProfile.isApproved
          }
        : null,
      onboardingComplete
    };
  } catch (error) {
    // Log error without exposing PII
    console.error("Error fetching user profile:", error instanceof Error ? error.message : "Unknown error");
    return null;
  }
}

