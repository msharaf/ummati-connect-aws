import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import { userRouter } from "./user";
import { prisma } from "@ummati/db";
import { createCallerFactory } from "@trpc/server";
import { createContext } from "../context";

// Mock Prisma
vi.mock("@ummati/db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn()
    }
  }
}));

const createCaller = createCallerFactory(userRouter);

describe("userRouter", () => {
  const mockCtx = {
    userId: "user_clerk_123",
    clerk: {}
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("me query", () => {
    it("should return user profile when user exists", async () => {
      const mockUser = {
        id: "user_123",
        clerkId: "user_clerk_123",
        email: "test@example.com",
        name: "Test User",
        role: "INVESTOR" as const,
        avatarUrl: null,
        location: "New York",
        investorProfile: {
          id: "investor_123",
          minTicketSize: 10000,
          maxTicketSize: 100000,
          preferredSectors: ["Tech", "Healthcare"],
          geoFocus: "US"
        },
        visionaryProfile: null
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const caller = createCaller(mockCtx);
      const result = await caller.me();

      expect(result.role).toBe("INVESTOR");
      expect(result.onboardingComplete).toBe(true);
      expect(result.profile?.email).toBe("test@example.com");
      expect(result.profile?.investorProfile).toBeDefined();
    });

    it("should return null profile when user does not exist", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const caller = createCaller(mockCtx);
      const result = await caller.me();

      expect(result.role).toBeNull();
      expect(result.onboardingComplete).toBe(false);
      expect(result.profile).toBeNull();
    });

    it("should return onboardingComplete false when user has role but no profile", async () => {
      const mockUser = {
        id: "user_123",
        clerkId: "user_clerk_123",
        email: "test@example.com",
        name: "Test User",
        role: "INVESTOR" as const,
        avatarUrl: null,
        location: null,
        investorProfile: null,
        visionaryProfile: null
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const caller = createCaller(mockCtx);
      const result = await caller.me();

      expect(result.role).toBe("INVESTOR");
      expect(result.onboardingComplete).toBe(false);
    });

    it("should return onboardingComplete true for VISIONARY with profile", async () => {
      const mockUser = {
        id: "user_123",
        clerkId: "user_clerk_123",
        email: "test@example.com",
        name: "Test User",
        role: "VISIONARY" as const,
        avatarUrl: null,
        location: null,
        investorProfile: null,
        visionaryProfile: {
          id: "visionary_123",
          startupName: "Test Startup",
          tagline: "Innovative solution",
          startupStage: "SEED",
          sector: "Tech",
          description: "A great startup",
          isApproved: false
        }
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const caller = createCaller(mockCtx);
      const result = await caller.me();

      expect(result.role).toBe("VISIONARY");
      expect(result.onboardingComplete).toBe(true);
      expect(result.profile?.visionaryProfile).toBeDefined();
    });
  });

  describe("setRole mutation", () => {
    it("should update user role successfully", async () => {
      const existingUser = {
        id: "user_123",
        clerkId: "user_clerk_123",
        email: "test@example.com",
        name: "Test User",
        role: null,
        avatarUrl: null,
        location: null,
        investorProfile: null,
        visionaryProfile: null
      };

      const updatedUser = {
        ...existingUser,
        role: "INVESTOR" as const
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(existingUser as any);
      vi.mocked(prisma.user.update).mockResolvedValue(updatedUser as any);

      const caller = createCaller(mockCtx);
      const result = await caller.setRole({ role: "INVESTOR" });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { clerkId: "user_clerk_123" },
        data: { role: "INVESTOR" },
        include: {
          investorProfile: true,
          visionaryProfile: true
        }
      });

      expect(result.role).toBe("INVESTOR");
      expect(result.onboardingComplete).toBe(false);
    });

    it("should throw error when user does not exist", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const caller = createCaller(mockCtx);

      await expect(caller.setRole({ role: "INVESTOR" })).rejects.toThrow(
        TRPCError
      );
      await expect(caller.setRole({ role: "INVESTOR" })).rejects.toThrow(
        "User not found"
      );
    });

    it("should update role to VISIONARY", async () => {
      const existingUser = {
        id: "user_123",
        clerkId: "user_clerk_123",
        email: "test@example.com",
        name: "Test User",
        role: null,
        avatarUrl: null,
        location: null,
        investorProfile: null,
        visionaryProfile: null
      };

      const updatedUser = {
        ...existingUser,
        role: "VISIONARY" as const
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(existingUser as any);
      vi.mocked(prisma.user.update).mockResolvedValue(updatedUser as any);

      const caller = createCaller(mockCtx);
      const result = await caller.setRole({ role: "VISIONARY" });

      expect(result.role).toBe("VISIONARY");
    });

    it("should return onboardingComplete true when user has profile after role update", async () => {
      const existingUser = {
        id: "user_123",
        clerkId: "user_clerk_123",
        email: "test@example.com",
        name: "Test User",
        role: null,
        avatarUrl: null,
        location: null,
        investorProfile: null,
        visionaryProfile: null
      };

      const updatedUser = {
        ...existingUser,
        role: "INVESTOR" as const,
        investorProfile: {
          id: "investor_123",
          minTicketSize: 10000,
          maxTicketSize: 100000,
          preferredSectors: ["Tech"],
          geoFocus: "US"
        }
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(existingUser as any);
      vi.mocked(prisma.user.update).mockResolvedValue(updatedUser as any);

      const caller = createCaller(mockCtx);
      const result = await caller.setRole({ role: "INVESTOR" });

      expect(result.onboardingComplete).toBe(true);
    });
  });
});

