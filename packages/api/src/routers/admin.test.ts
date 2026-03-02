import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import { adminRouter } from "./admin";
import { prisma, type User, type InvestorProfile, type VisionaryProfile } from "@ummati/db";
import { createMockClerkClient } from "../testUtils/mockClerk";

// Mock Prisma
vi.mock("@ummati/db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn()
    },
    investorProfile: {
      update: vi.fn()
    },
    visionaryProfile: {
      update: vi.fn()
    },
    match: {
      count: vi.fn()
    }
  }
}));

describe("adminRouter", () => {
  const mockAdminCtx = {
    userId: "admin_clerk_123",
    clerk: createMockClerkClient()
  };

  const mockUserCtx = {
    userId: "user_clerk_123",
    clerk: createMockClerkClient()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("checkAdmin query", () => {
    it("should return true when user is admin", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        isAdmin: true
      } as unknown as User);

      const caller = adminRouter.createCaller(mockAdminCtx);
      const result = await caller.checkAdmin();

      expect(result.isAdmin).toBe(true);
    });

    it("should return false when user is not admin", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        isAdmin: false
      } as unknown as User);

      const caller = adminRouter.createCaller(mockUserCtx);
      const result = await caller.checkAdmin();

      expect(result.isAdmin).toBe(false);
    });

    it("should return false when user does not exist", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const caller = adminRouter.createCaller(mockUserCtx);
      const result = await caller.checkAdmin();

      expect(result.isAdmin).toBe(false);
    });
  });

  describe("getAllUsers query", () => {
    const mockAdminUser = {
      id: "admin_123",
      clerkId: "admin_clerk_123",
      isAdmin: true
    };

    const mockUsers = [
      {
        id: "user_1",
        clerkId: "clerk_1",
        email: "user1@example.com",
        name: "User One",
        fullName: "User One",
        role: "INVESTOR" as const,
        isAdmin: false,
        isBanned: false,
        createdAt: new Date(),
        investorProfile: {
          halalScore: 85,
          halalCategory: "halal",
          profileComplete: true,
          onboardingComplete: true
        },
        visionaryProfile: null
      },
      {
        id: "user_2",
        clerkId: "clerk_2",
        email: "user2@example.com",
        name: "User Two",
        fullName: null,
        role: "VISIONARY" as const,
        isAdmin: false,
        isBanned: false,
        createdAt: new Date(),
        investorProfile: null,
        visionaryProfile: {
          halalScore: 75,
          halalCategory: "grey",
          profileComplete: true,
          onboardingComplete: true,
          isApproved: false,
          isFlagged: true
        }
      }
    ];

    it("should return all users when admin", async () => {
      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce(mockAdminUser as unknown as User);
      vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers as unknown as User[]);

      const caller = adminRouter.createCaller(mockAdminCtx);
      const result = await caller.getAllUsers();

      expect(result.users).toHaveLength(2);
      expect(result.users[0].email).toBe("user1@example.com");
      expect(result.users[0].investorProfile).toBeDefined();
      expect(result.users[1].visionaryProfile).toBeDefined();
      expect(result.nextCursor).toBeUndefined(); // No more pages
    });

    it("should throw FORBIDDEN when user is not admin", async () => {
      const mockNonAdminUser = {
        id: "user_123",
        clerkId: "user_clerk_123",
        isAdmin: false
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockNonAdminUser as unknown as User);

      const caller = adminRouter.createCaller(mockUserCtx);

      await expect(caller.getAllUsers()).rejects.toThrow(TRPCError);
      await expect(caller.getAllUsers()).rejects.toThrow("Admin access required");
    });

    it("should throw FORBIDDEN when user does not exist", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const caller = adminRouter.createCaller(mockUserCtx);

      await expect(caller.getAllUsers()).rejects.toThrow(TRPCError);
      await expect(caller.getAllUsers()).rejects.toThrow("Admin access required");
    });
  });

  describe("getUserById query", () => {
    const mockAdminUser = {
      id: "admin_123",
      clerkId: "admin_clerk_123",
      isAdmin: true
    };

    const mockTargetUser = {
      id: "target_123",
      clerkId: "target_clerk_123",
      email: "target@example.com",
      investorProfile: {
        id: "inv_123"
      },
      visionaryProfile: null
    };

    it("should return user when admin", async () => {
      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce(mockAdminUser as unknown as User)
        .mockResolvedValueOnce(mockTargetUser as unknown as User);

      const caller = adminRouter.createCaller(mockAdminCtx);
      const result = await caller.getUserById({ userId: "target_123" });

      expect(result.id).toBe("target_123");
      expect(result.email).toBe("target@example.com");
    });

    it("should throw FORBIDDEN when user is not admin", async () => {
      const mockNonAdminUser = {
        id: "user_123",
        clerkId: "user_clerk_123",
        isAdmin: false
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockNonAdminUser as unknown as User);

      const caller = adminRouter.createCaller(mockUserCtx);

      await expect(caller.getUserById({ userId: "target_123" })).rejects.toThrow("Admin access required");
    });

    it("should throw NOT_FOUND when target user does not exist", async () => {
      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce(mockAdminUser as unknown as User)
        .mockResolvedValueOnce(null);

      const caller = adminRouter.createCaller(mockAdminCtx);

      await expect(caller.getUserById({ userId: "nonexistent_123" })).rejects.toThrow("User not found");
    });
  });

  describe("overrideHalalCategory mutation", () => {
    const mockAdminUser = {
      id: "admin_123",
      clerkId: "admin_clerk_123",
      isAdmin: true
    };

    it("should override halal category for investor profile", async () => {
      const mockInvestorUser = {
        id: "investor_123",
        role: "INVESTOR" as const,
        investorProfile: {
          id: "inv_profile_123"
        },
        visionaryProfile: null
      };

      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce(mockAdminUser as unknown as User)
        .mockResolvedValueOnce(mockInvestorUser as unknown as User);
      vi.mocked(prisma.investorProfile.update).mockResolvedValue({} as unknown as InvestorProfile);

      const caller = adminRouter.createCaller(mockAdminCtx);
      const result = await caller.overrideHalalCategory({
        userId: "investor_123",
        halalCategory: "halal",
        reason: "Manual override"
      });

      expect(result.success).toBe(true);
      expect(prisma.investorProfile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "inv_profile_123" },
          data: expect.objectContaining({
            halalCategory: "halal"
          })
        })
      );
    });

    it("should override halal category for visionary profile", async () => {
      const mockVisionaryUser = {
        id: "visionary_123",
        role: "VISIONARY" as const,
        investorProfile: null,
        visionaryProfile: {
          id: "vis_profile_123"
        }
      };

      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce(mockAdminUser as unknown as User)
        .mockResolvedValueOnce(mockVisionaryUser as unknown as User);
      vi.mocked(prisma.visionaryProfile.update).mockResolvedValue({} as unknown as VisionaryProfile);

      const caller = adminRouter.createCaller(mockAdminCtx);
      const result = await caller.overrideHalalCategory({
        userId: "visionary_123",
        halalCategory: "grey",
        reason: "Review needed"
      });

      expect(result.success).toBe(true);
      expect(prisma.visionaryProfile.update).toHaveBeenCalled();
    });

    it("should throw FORBIDDEN when user is not admin", async () => {
      const mockNonAdminUser = {
        id: "user_123",
        isAdmin: false
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockNonAdminUser as unknown as User);

      const caller = adminRouter.createCaller(mockUserCtx);

      await expect(
        caller.overrideHalalCategory({
          userId: "target_123",
          halalCategory: "halal"
        })
      ).rejects.toThrow(TRPCError);
    });

    it("should throw NOT_FOUND when target user does not exist", async () => {
      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce(mockAdminUser as unknown as User)
        .mockResolvedValueOnce(null);

      const caller = adminRouter.createCaller(mockAdminCtx);

      await expect(
        caller.overrideHalalCategory({
          userId: "nonexistent_123",
          halalCategory: "halal"
        })
      ).rejects.toThrow("User not found");
    });

    it("should throw BAD_REQUEST when user has no profile", async () => {
      const mockUserWithoutProfile = {
        id: "user_123",
        role: "INVESTOR" as const,
        investorProfile: null,
        visionaryProfile: null
      };

      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce(mockAdminUser as unknown as User)
        .mockResolvedValueOnce(mockUserWithoutProfile as unknown as User);

      const caller = adminRouter.createCaller(mockAdminCtx);

      await expect(
        caller.overrideHalalCategory({
          userId: "user_123",
          halalCategory: "halal"
        })
      ).rejects.toThrow("User has no profile to update");
    });
  });

  describe("approveRejectUser mutation", () => {
    const mockAdminUser = {
      id: "admin_123",
      clerkId: "admin_clerk_123",
      isAdmin: true
    };

    it("should approve user when admin", async () => {
      const mockVisionaryUser = {
        id: "visionary_123",
        visionaryProfile: {
          id: "vis_profile_123"
        }
      };

      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce(mockAdminUser as unknown as User)
        .mockResolvedValueOnce(mockVisionaryUser as unknown as User);
      vi.mocked(prisma.visionaryProfile.update).mockResolvedValue({} as unknown as VisionaryProfile);

      const caller = adminRouter.createCaller(mockAdminCtx);
      const result = await caller.approveRejectUser({
        userId: "visionary_123",
        action: "approve"
      });

      expect(result.success).toBe(true);
      expect(prisma.visionaryProfile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isApproved: true,
            isFlagged: false,
            rejectionReason: null
          })
        })
      );
    });

    it("should reject user when admin", async () => {
      const mockVisionaryUser = {
        id: "visionary_123",
        visionaryProfile: {
          id: "vis_profile_123"
        }
      };

      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce(mockAdminUser as unknown as User)
        .mockResolvedValueOnce(mockVisionaryUser as unknown as User);
      vi.mocked(prisma.visionaryProfile.update).mockResolvedValue({} as unknown as VisionaryProfile);

      const caller = adminRouter.createCaller(mockAdminCtx);
      const result = await caller.approveRejectUser({
        userId: "visionary_123",
        action: "reject",
        reason: "Does not meet criteria"
      });

      expect(result.success).toBe(true);
      expect(prisma.visionaryProfile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isApproved: false,
            isFlagged: true,
            rejectionReason: "Does not meet criteria"
          })
        })
      );
    });

    it("should throw FORBIDDEN when user is not admin", async () => {
      const mockNonAdminUser = {
        id: "user_123",
        isAdmin: false
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockNonAdminUser as unknown as User);

      const caller = adminRouter.createCaller(mockUserCtx);

      await expect(
        caller.approveRejectUser({
          userId: "target_123",
          action: "approve"
        })
      ).rejects.toThrow(TRPCError);
    });

    it("should throw NOT_FOUND when user or profile does not exist", async () => {
      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce(mockAdminUser as unknown as User)
        .mockResolvedValueOnce(null);

      const caller = adminRouter.createCaller(mockAdminCtx);

      await expect(
        caller.approveRejectUser({
          userId: "nonexistent_123",
          action: "approve"
        })
      ).rejects.toThrow("User or profile not found");
    });
  });

  describe("getReports query", () => {
    const mockAdminUser = {
      id: "admin_123",
      clerkId: "admin_clerk_123",
      isAdmin: true
    };

    it("should return reports when admin", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockAdminUser as unknown as User);
      vi.mocked(prisma.user.count)
        .mockResolvedValueOnce(100) // totalUsers
        .mockResolvedValueOnce(50) // investors
        .mockResolvedValueOnce(50) // founders
        .mockResolvedValueOnce(30) // halalUsers
        .mockResolvedValueOnce(15) // greyUsers
        .mockResolvedValueOnce(5); // forbiddenUsers
      vi.mocked(prisma.match.count).mockResolvedValue(200);

      const caller = adminRouter.createCaller(mockAdminCtx);
      const result = await caller.getReports();

      expect(result.totalUsers).toBe(100);
      expect(result.investors).toBe(50);
      expect(result.founders).toBe(50);
      expect(result.totalMatches).toBe(200);
      expect(result.halalUsers).toBe(30);
      expect(result.greyUsers).toBe(15);
      expect(result.forbiddenUsers).toBe(5);
    });

    it("should throw FORBIDDEN when user is not admin", async () => {
      const mockNonAdminUser = {
        id: "user_123",
        isAdmin: false
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockNonAdminUser as unknown as User);

      const caller = adminRouter.createCaller(mockUserCtx);

      await expect(caller.getReports()).rejects.toThrow(TRPCError);
    });
  });

  describe("banUser mutation", () => {
    const mockAdminUser = {
      id: "admin_123",
      clerkId: "admin_clerk_123",
      isAdmin: true
    };

    it("should ban user when admin", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockAdminUser as unknown as User);
      vi.mocked(prisma.user.update).mockResolvedValue({} as unknown as User);

      const caller = adminRouter.createCaller(mockAdminCtx);
      const result = await caller.banUser({
        userId: "user_123",
        banned: true,
        reason: "Violation of terms"
      });

      expect(result.success).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "user_123" },
          data: { isBanned: true }
        })
      );
    });

    it("should unban user when admin", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockAdminUser as unknown as User);
      vi.mocked(prisma.user.update).mockResolvedValue({} as unknown as User);

      const caller = adminRouter.createCaller(mockAdminCtx);
      const result = await caller.banUser({
        userId: "user_123",
        banned: false
      });

      expect(result.success).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { isBanned: false }
        })
      );
    });

    it("should throw FORBIDDEN when user is not admin", async () => {
      const mockNonAdminUser = {
        id: "user_123",
        isAdmin: false
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockNonAdminUser as unknown as User);

      const caller = adminRouter.createCaller(mockUserCtx);

      await expect(
        caller.banUser({
          userId: "target_123",
          banned: true
        })
      ).rejects.toThrow(TRPCError);
    });
  });
});
