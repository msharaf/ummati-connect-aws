import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import { visionaryRouter } from "./visionary";
import { prisma } from "@ummati/db";
import { RiskCategory, StartupStage, type User, type VisionaryProfile } from "@ummati/db";
import { createMockClerkClient } from "../testUtils/mockClerk";

// Mock Prisma
vi.mock("@ummati/db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn()
    },
    visionaryProfile: {
      upsert: vi.fn(),
      findUnique: vi.fn()
    }
  },
  RiskCategory: {
    HALAL: "HALAL",
    GREY: "GREY",
    HARAM: "HARAM"
  },
  HalalCategory: {
    halal: "halal",
    grey: "grey",
    forbidden: "forbidden"
  },
  StartupStage: {
    IDEA: "IDEA",
    MVP: "MVP",
    TRACTION: "TRACTION",
    SCALING: "SCALING"
  }
}));

describe("visionaryRouter", () => {
  const mockCtx = {
    userId: "user_clerk_123",
    clerk: createMockClerkClient()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getMyProfile query", () => {
    it("should return visionary profile when user exists", async () => {
      const mockUser = {
        id: "user_123",
        clerkId: "user_clerk_123",
        email: "test@example.com",
        name: "Test User",
        visionaryProfile: {
          id: "visionary_123",
          startupName: "Test Startup",
          startupStage: StartupStage.IDEA,
          industry: "Tech",
          halalScore: 85,
          halalCategory: "halal",
          riskCategory: RiskCategory.HALAL,
          isApproved: true,
          isFlagged: false,
          barakahScore: { score: 75 }
        }
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as unknown as User);

      const caller = visionaryRouter.createCaller(mockCtx);
      const result = await caller.getMyProfile();

      expect(result).toBeDefined();
      expect(result?.startupName).toBe("Test Startup");
      expect(result?.halalScore).toBe(85);
    });

    it("should return null when user does not exist", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const caller = visionaryRouter.createCaller(mockCtx);
      const result = await caller.getMyProfile();

      expect(result).toBeNull();
    });
  });

  describe("verifyHalalCompliance mutation", () => {
    const mockUser = {
      id: "user_123",
      clerkId: "user_clerk_123",
      email: "test@example.com",
      name: "Test User",
      fullName: "Test User",
      visionaryProfile: null
    };

    it("should reject when haram categories are selected", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as unknown as User);
      vi.mocked(prisma.visionaryProfile.upsert).mockResolvedValue({} as unknown as VisionaryProfile);

      const caller = visionaryRouter.createCaller(mockCtx);
      const result = await caller.verifyHalalCompliance({
        industry: "Tech",
        responses: {
          q1: "Test activity",
          q2: "Test model",
          haramCategories: ["Alcohol", "Gambling"]
        }
      });

      expect(result.status).toBe("rejected");
      expect(result.riskCategory).toBe(RiskCategory.HARAM);
      expect(result.halalCategory).toBe("forbidden");
      expect(result.halalScore).toBe(0);
      expect(result.rejectionReason).toContain("prohibited categories");
    });

    it("should reject when interest/riba is detected", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as unknown as User);
      vi.mocked(prisma.visionaryProfile.upsert).mockResolvedValue({} as unknown as VisionaryProfile);

      const caller = visionaryRouter.createCaller(mockCtx);
      const result = await caller.verifyHalalCompliance({
        industry: "FinTech",
        responses: {
          q1: "Test activity",
          q2: "Test model",
          q4: "Yes, we use interest-based revenue",
          q5: "We charge interest"
        }
      });

      expect(result.status).toBe("rejected");
      expect(result.riskCategory).toBe(RiskCategory.HARAM);
      expect(result.rejectionReason).toContain("interest-based revenue");
    });

    it("should flag grey area industries for review", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as unknown as User);
      vi.mocked(prisma.visionaryProfile.upsert).mockResolvedValue({} as unknown as VisionaryProfile);

      const caller = visionaryRouter.createCaller(mockCtx);
      const result = await caller.verifyHalalCompliance({
        industry: "FinTech",
        responses: {
          q1: "Financial technology services",
          q2: "Payment processing",
          q4: "Subscription fees only",
          q5: "Revenue from services"
        }
      });

      // Dev mode: non-HARAM submissions are auto-approved (status=approved)
      expect(result.status).toBe("approved");
      expect(result.riskCategory).toBe(RiskCategory.GREY);
      expect(result.halalCategory).toBe("grey");
      expect(result.halalScore).toBeGreaterThanOrEqual(60);
    });

    it("should approve clear halal cases", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as unknown as User);
      vi.mocked(prisma.visionaryProfile.upsert).mockResolvedValue({} as unknown as VisionaryProfile);

      const caller = visionaryRouter.createCaller(mockCtx);
      const result = await caller.verifyHalalCompliance({
        industry: "EdTech",
        responses: {
          q1: "Educational platform",
          q2: "Subscription-based learning",
          q4: "Subscription revenue",
          q5: "Service fees"
        }
      });

      expect(result.status).toBe("approved");
      expect(result.riskCategory).toBe(RiskCategory.HALAL);
      expect(result.halalCategory).toBe("halal");
      expect(result.halalScore).toBe(85);
    });

    it("should throw error when user not found", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const caller = visionaryRouter.createCaller(mockCtx);

      await expect(
        caller.verifyHalalCompliance({
          industry: "Tech",
          responses: { q1: "Test", q2: "Test" }
        })
      ).rejects.toThrow(TRPCError);
    });

    it("should create profile if it doesn't exist", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as unknown as User);
      vi.mocked(prisma.visionaryProfile.upsert).mockResolvedValue({} as unknown as VisionaryProfile);

      const caller = visionaryRouter.createCaller(mockCtx);
      await caller.verifyHalalCompliance({
        industry: "EdTech",
        responses: { q1: "Test", q2: "Test" }
      });

      expect(prisma.visionaryProfile.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            userId: "user_123",
            startupName: "Temporary",
            startupStage: StartupStage.IDEA,
            industry: "EdTech"
          })
        })
      );
    });
  });
});
