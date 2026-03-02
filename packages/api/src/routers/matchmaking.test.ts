import { describe, it, expect, vi, beforeEach } from "vitest";
import { matchmakingRouter } from "./matchmaking";
import { createMockClerkClient } from "../testUtils/mockClerk";
import { prisma } from "@ummati/db";

vi.mock("@ummati/db", () => ({
  prisma: {
    user: { findUnique: vi.fn(), findMany: vi.fn() },
    match: { findMany: vi.fn() },
    swipe: { findMany: vi.fn() },
    investorProfile: { findMany: vi.fn() },
    visionaryProfile: { findMany: vi.fn() }
  }
}));

describe("matchmakingRouter", () => {
  const mockCtx = {
    userId: "user_clerk_123",
    clerk: createMockClerkClient()
  };

  const mockUser = {
    id: "user_123",
    clerkId: "user_clerk_123",
    role: "INVESTOR" as const,
    investorProfile: { onboardingComplete: true },
    visionaryProfile: null
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.user.findMany).mockResolvedValue([]);
    vi.mocked(prisma.match.findMany).mockResolvedValue([]);
    vi.mocked(prisma.swipe.findMany).mockResolvedValue([]);
    vi.mocked(prisma.investorProfile.findMany).mockResolvedValue([]);
    vi.mocked(prisma.visionaryProfile.findMany).mockResolvedValue([]);
  });

  describe("getRecommendations query", () => {
    it("should return recommendations structure", async () => {
      const caller = matchmakingRouter.createCaller(mockCtx);
      const result = await caller.getRecommendations();

      expect(result).toHaveProperty("recommendations");
      expect(Array.isArray(result.recommendations)).toBe(true);
    });
  });

  describe("getMatches query", () => {
    it("should return matches structure", async () => {
      const caller = matchmakingRouter.createCaller(mockCtx);
      const result = await caller.getMatches();

      expect(Array.isArray(result)).toBe(true);
    });
  });
});

