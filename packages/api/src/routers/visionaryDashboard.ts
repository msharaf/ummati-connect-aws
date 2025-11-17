import { router, protectedProcedure } from "../trpc";
import { prisma } from "@ummati/db";

export const visionaryDashboardRouter = router({
  // Get overview stats
  getOverviewStats: protectedProcedure.query(async ({ ctx }) => {
    const user = await prisma.user.findUnique({
      where: { clerkId: ctx.userId },
      include: { visionaryProfile: true }
    });

    if (!user || !user.visionaryProfile) {
      return {
        totalViews: 0,
        totalShortlists: 0,
        totalMatches: 0,
        totalMessages: 0,
        profileCompleteness: 0
      };
    }

    // Count profile views
    const totalViews = await prisma.profileView.count({
      where: { visionaryId: user.visionaryProfile.id }
    });

    // Count shortlists
    const totalShortlists = await prisma.shortlist.count({
      where: { visionaryId: user.visionaryProfile.id }
    });

    // Count matches
    const totalMatches = await prisma.match.count({
      where: {
        OR: [
          { userAId: user.id },
          { userBId: user.id }
        ]
      }
    });

    // Count messages
    const totalMessages = await prisma.message.count({
      where: {
        match: {
          OR: [
            { userAId: user.id },
            { userBId: user.id }
          ]
        }
      }
    });

    // Calculate profile completeness
    const profile = user.visionaryProfile;
    let completeness = 0;
    const fields = [
      profile.startupName,
      profile.tagline,
      profile.description,
      profile.pitch,
      profile.fundingAsk,
      profile.location,
      profile.websiteUrl,
      profile.logoUrl,
      profile.teamSize,
      profile.halalCategory
    ];
    const completedFields = fields.filter((f) => f !== null && f !== undefined);
    completeness = Math.round((completedFields.length / fields.length) * 100);

    return {
      totalViews,
      totalShortlists,
      totalMatches,
      totalMessages,
      profileCompleteness: completeness
    };
  }),

  // Get recent activity
  getRecentActivity: protectedProcedure.query(async ({ ctx }) => {
    const user = await prisma.user.findUnique({
      where: { clerkId: ctx.userId },
      include: { visionaryProfile: true }
    });

    if (!user || !user.visionaryProfile) {
      return [];
    }

    // Get recent profile views
    const recentViews = await prisma.profileView.findMany({
      where: { visionaryId: user.visionaryProfile.id },
      include: {
        investor: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 10
    });

    // Get recent shortlists
    const recentShortlists = await prisma.shortlist.findMany({
      where: { visionaryId: user.visionaryProfile.id },
      include: {
        investor: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 10
    });

    // Combine and format activities
    const activities = [
      ...recentViews.map((view) => ({
        id: `view-${view.id}`,
        type: "profile_view" as const,
        investor: view.investor,
        createdAt: view.createdAt,
        message: `${view.investor.name || "An investor"} viewed your profile`
      })),
      ...recentShortlists.map((shortlist) => ({
        id: `shortlist-${shortlist.id}`,
        type: "shortlist" as const,
        investor: shortlist.investor,
        createdAt: shortlist.createdAt,
        message: `${shortlist.investor.name || "An investor"} added you to their shortlist`
      }))
    ]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);

    return activities;
  }),

  // Get profile completeness
  getProfileCompleteness: protectedProcedure.query(async ({ ctx }) => {
    const user = await prisma.user.findUnique({
      where: { clerkId: ctx.userId },
      include: { visionaryProfile: true }
    });

    if (!user || !user.visionaryProfile) {
      return {
        completeness: 0,
        missingFields: [],
        completedFields: []
      };
    }

    const profile = user.visionaryProfile;
    const fields = {
      startupName: profile.startupName,
      tagline: profile.tagline,
      description: profile.description,
      pitch: profile.pitch,
      fundingAsk: profile.fundingAsk,
      location: profile.location,
      websiteUrl: profile.websiteUrl,
      logoUrl: profile.logoUrl,
      teamSize: profile.teamSize,
      halalCategory: profile.halalCategory
    };

    const completedFields: string[] = [];
    const missingFields: string[] = [];

    Object.entries(fields).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        completedFields.push(key);
      } else {
        missingFields.push(key);
      }
    });

    const completeness = Math.round(
      (completedFields.length / Object.keys(fields).length) * 100
    );

    return {
      completeness,
      missingFields,
      completedFields
    };
  })
});

