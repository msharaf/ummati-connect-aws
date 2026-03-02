/**
 * Matching Algorithm
 * 
 * Implements the matching logic for investors and founders based on:
 * 1. halalCategory alignment
 * 2. halalScore similarity
 * 3. Industry match
 * 4. Ticket size compatibility
 * 5. Recency
 */

import { prisma } from "@ummati/db";
import type { HalalCategory } from "./halalfocus";
import { isCategoryAllowed } from "./halalfocus";

export interface MatchScore {
  userId: string;
  profile: Record<string, unknown>;
  score: number;
  reasons: string[];
}

/**
 * Calculate match score between investor and founder
 */
function calculateMatchScore(
  investor: {
    halalCategory: HalalCategory | null;
    halalScore: number | null;
    preferredSectors?: string[];
    industriesInterestedIn?: string[];
    minTicketSize: number | null;
    maxTicketSize: number | null;
  },
  founder: {
    halalCategory: HalalCategory | null;
    halalScore: number | null;
    industry: string;
    sector?: string | null;
    fundingNeeded: number | null;
  }
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // 1. HalalCategory alignment (most important - 40 points)
  if (investor.halalCategory && founder.halalCategory) {
    if (investor.halalCategory === founder.halalCategory) {
      if (investor.halalCategory === "halal") {
        score += 40;
        reasons.push("Both are halal-compliant");
      } else if (investor.halalCategory === "grey") {
        score += 25;
        reasons.push("Both are in grey area");
      }
    } else {
      // One is halal, one is grey - partial match
      score += 15;
      reasons.push("Halal category mismatch (halal/grey)");
    }
  }

  // 2. HalalScore similarity (20 points)
  const investorScore = investor.halalScore || 0;
  const founderScore = founder.halalScore || 0;
  const scoreDiff = Math.abs(investorScore - founderScore);
  if (scoreDiff <= 10) {
    score += 20;
    reasons.push("Very similar halal scores");
  } else if (scoreDiff <= 25) {
    score += 12;
    reasons.push("Similar halal scores");
  } else if (scoreDiff <= 40) {
    score += 6;
    reasons.push("Moderate halal score difference");
  }

  // 3. Industry match (25 points)
  const industries = [
    ...(investor.preferredSectors || []),
    ...(investor.industriesInterestedIn || [])
  ];
  const founderIndustry = founder.industry || founder.sector || "";
  
  if (industries.length > 0) {
    const lowerIndustries = industries.map(i => i.toLowerCase());
    const lowerFounderIndustry = founderIndustry.toLowerCase();
    
    // Check if founder's industry matches any of investor's preferences
    const matches = lowerIndustries.some(
      ind => lowerFounderIndustry.includes(ind) || ind.includes(lowerFounderIndustry)
    );
    
    if (matches) {
      score += 25;
      reasons.push(`Industry match: ${founderIndustry}`);
    } else {
      // Partial match if industries are similar
      const similar = lowerIndustries.some(ind => {
        const words = ind.split(/\s+/);
        return words.some(w => lowerFounderIndustry.includes(w));
      });
      if (similar) {
        score += 10;
        reasons.push(`Similar industry: ${founderIndustry}`);
      }
    }
  }

  // 4. Ticket size compatibility (15 points)
  const fundingNeeded = founder.fundingNeeded ?? 0;
  const minTicket = investor.minTicketSize ?? 0;
  const maxTicket = investor.maxTicketSize ?? Infinity;

  if (fundingNeeded > 0 && maxTicket > 0) {
    if (fundingNeeded >= minTicket && fundingNeeded <= maxTicket) {
      score += 15;
      reasons.push("Perfect ticket size match");
    } else if (fundingNeeded > maxTicket && fundingNeeded <= maxTicket * 1.5) {
      score += 8;
      reasons.push("Ticket size slightly above range");
    } else if (fundingNeeded < minTicket && fundingNeeded >= minTicket * 0.7) {
      score += 8;
      reasons.push("Ticket size slightly below range");
    } else if (fundingNeeded > maxTicket * 1.5) {
      score += 0;
      reasons.push("Funding ask too high");
    } else {
      score += 0;
      reasons.push("Ticket size mismatch");
    }
  }

  return { score, reasons };
}

/**
 * Get recommendations for an investor (show founders)
 */
export async function getInvestorRecommendations(
  investorUserId: string,
  limit: number = 50
): Promise<MatchScore[]> {
  // Get investor profile
  const investor = await prisma.user.findUnique({
    where: { id: investorUserId },
    include: { investorProfile: true }
  });

  if (!investor || !investor.investorProfile || investor.role !== "INVESTOR") {
    return [];
  }

  const investorProfile = investor.investorProfile;

  // Get all founders who have completed onboarding and are not forbidden
  const founders = await prisma.user.findMany({
    where: {
      role: "VISIONARY",
      id: { not: investorUserId },
      visionaryProfile: {
        onboardingComplete: true,
        profileComplete: true,
        halalCategory: { not: "forbidden" }
      }
    },
    include: {
      visionaryProfile: true
    },
    take: 200, // Get more than needed to sort
    orderBy: { createdAt: "desc" } // Recency
  });

  // Get swipes already made by this investor
  const existingSwipes = await prisma.swipe.findMany({
    where: { swiperId: investorUserId },
    select: { targetId: true }
  });
  const swipedUserIds = new Set(existingSwipes.map(s => s.targetId));

  // Calculate match scores
  const matches: MatchScore[] = [];

  for (const founder of founders) {
    // Skip if already swiped
    if (swipedUserIds.has(founder.id)) continue;

    const founderProfile = founder.visionaryProfile;
    if (!founderProfile) continue;

    // Skip forbidden categories
    if (!isCategoryAllowed(founderProfile.halalCategory)) continue;

    const { score, reasons } = calculateMatchScore(
      {
        halalCategory: investorProfile.halalCategory,
        halalScore: investorProfile.halalScore,
        preferredSectors: investorProfile.preferredSectors,
        industriesInterestedIn: investorProfile.industriesInterestedIn,
        minTicketSize: investorProfile.minTicketSize,
        maxTicketSize: investorProfile.maxTicketSize
      },
      {
        halalCategory: founderProfile.halalCategory,
        halalScore: founderProfile.halalScore,
        industry: founderProfile.industry,
        sector: founderProfile.sector,
        fundingNeeded: founderProfile.fundingNeeded
      }
    );

    // Add recency bonus (0-10 points based on how recent)
    const daysSinceCreated = Math.floor(
      (Date.now() - founder.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    let recencyScore = 0;
    if (daysSinceCreated <= 7) recencyScore = 10;
    else if (daysSinceCreated <= 30) recencyScore = 5;
    else if (daysSinceCreated <= 90) recencyScore = 2;

    matches.push({
      userId: founder.id,
      profile: {
        ...founderProfile,
        user: {
          id: founder.id,
          email: founder.email,
          fullName: founder.fullName || founder.name,
          avatarUrl: founder.avatarUrl
        }
      },
      score: score + recencyScore,
      reasons: [...reasons, daysSinceCreated <= 7 ? "Recently joined" : ""].filter(Boolean)
    });
  }

  // Sort by score (highest first)
  matches.sort((a, b) => b.score - a.score);

  return matches.slice(0, limit);
}

/**
 * Get recommendations for a founder (show investors)
 */
export async function getFounderRecommendations(
  founderUserId: string,
  limit: number = 50
): Promise<MatchScore[]> {
  // Get founder profile
  const founder = await prisma.user.findUnique({
    where: { id: founderUserId },
    include: { visionaryProfile: true }
  });

  if (!founder || !founder.visionaryProfile || founder.role !== "VISIONARY") {
    return [];
  }

  const founderProfile = founder.visionaryProfile;

  // Skip if forbidden
  if (!isCategoryAllowed(founderProfile.halalCategory)) {
    return [];
  }

  // Get all investors who have completed onboarding
  const investors = await prisma.user.findMany({
    where: {
      role: "INVESTOR",
      id: { not: founderUserId },
      investorProfile: {
        onboardingComplete: true,
        profileComplete: true,
        halalCategory: { not: "forbidden" }
      }
    },
    include: {
      investorProfile: true
    },
    take: 200,
    orderBy: { createdAt: "desc" }
  });

  // Get swipes already made by this founder
  const existingSwipes = await prisma.swipe.findMany({
    where: { swiperId: founderUserId },
    select: { targetId: true }
  });
  const swipedUserIds = new Set(existingSwipes.map(s => s.targetId));

  // Calculate match scores
  const matches: MatchScore[] = [];

  for (const investor of investors) {
    // Skip if already swiped
    if (swipedUserIds.has(investor.id)) continue;

    const investorProfile = investor.investorProfile;
    if (!investorProfile) continue;

    // Skip forbidden categories
    if (!isCategoryAllowed(investorProfile.halalCategory)) continue;

    const { score, reasons } = calculateMatchScore(
      {
        halalCategory: investorProfile.halalCategory,
        halalScore: investorProfile.halalScore,
        preferredSectors: investorProfile.preferredSectors,
        industriesInterestedIn: investorProfile.industriesInterestedIn,
        minTicketSize: investorProfile.minTicketSize,
        maxTicketSize: investorProfile.maxTicketSize
      },
      {
        halalCategory: founderProfile.halalCategory,
        halalScore: founderProfile.halalScore,
        industry: founderProfile.industry,
        sector: founderProfile.sector,
        fundingNeeded: founderProfile.fundingNeeded
      }
    );

    // Add recency bonus
    const daysSinceCreated = Math.floor(
      (Date.now() - investor.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    let recencyScore = 0;
    if (daysSinceCreated <= 7) recencyScore = 10;
    else if (daysSinceCreated <= 30) recencyScore = 5;
    else if (daysSinceCreated <= 90) recencyScore = 2;

    matches.push({
      userId: investor.id,
      profile: {
        ...investorProfile,
        user: {
          id: investor.id,
          email: investor.email,
          fullName: investor.fullName || investor.name,
          avatarUrl: investor.avatarUrl
        }
      },
      score: score + recencyScore,
      reasons: [...reasons, daysSinceCreated <= 7 ? "Recently joined" : ""].filter(Boolean)
    });
  }

  // Sort by score (highest first)
  matches.sort((a, b) => b.score - a.score);

  return matches.slice(0, limit);
}

