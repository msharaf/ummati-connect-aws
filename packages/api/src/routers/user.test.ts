import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import { userRouter } from "./user";
import { createCallerFactory } from "../trpc";
import { prisma, type User } from "@ummati/db";
import { createMockClerkClient } from "../testUtils/mockClerk";
import type { Context } from "../context";

const createCaller = createCallerFactory(userRouter);

// Mock Prisma
vi.mock("@ummati/db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn()
    }
  }
}));

describe("userRouter", () => {
  const mockCtx = {
    userId: "user_clerk_123",
    auth: null,
    clerk: createMockClerkClient()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY || "sk_test_fake";
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
          geoFocus: "US",
          onboardingComplete: true
        },
        visionaryProfile: null
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as unknown as User);

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

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as unknown as User);

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
          isApproved: false,
          onboardingComplete: true
        }
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as unknown as User);

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

      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce(existingUser as unknown as User)
        .mockResolvedValueOnce(updatedUser as unknown as User);
      vi.mocked(prisma.user.update).mockResolvedValue(updatedUser as unknown as User);

      const caller = createCaller(mockCtx);
      const result = await caller.setRole({ role: "INVESTOR" });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { clerkId: "user_clerk_123" },
        data: { role: "INVESTOR" }
      });

      expect(result.role).toBe("INVESTOR");
      expect(result.onboardingComplete).toBe(false);
    });

    it("should create user when user does not exist in DB (user-missing path)", async () => {
      const newUser = {
        id: "user_new",
        clerkId: "user_clerk_123",
        email: "test@example.com",
        name: "Test User",
        fullName: "Test User",
        role: "INVESTOR" as const,
        avatarUrl: null,
        location: null,
        investorProfile: null,
        visionaryProfile: null
      };
      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(newUser as unknown as User);
      vi.mocked(prisma.user.create).mockResolvedValue(newUser as unknown as User);
      vi.mocked(prisma.user.update).mockResolvedValue(newUser as unknown as User);

      const caller = createCaller(mockCtx);
      const result = await caller.setRole({ role: "INVESTOR" });

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          clerkId: "user_clerk_123",
          email: "test@example.com",
          name: "Test User",
          fullName: "Test User",
          role: "INVESTOR",
          isAdmin: false
        }
      });
      expect(result.role).toBe("INVESTOR");
    });

    it("should link email-existing user when new clerkId in dev mode", async () => {
      const existingByEmail = {
        id: "user_123",
        clerkId: "old_clerk_456",
        email: "test@example.com",
        name: "Test User",
        role: null,
        avatarUrl: null,
        location: null,
        investorProfile: null,
        visionaryProfile: null
      };
      const linkedUser = {
        ...existingByEmail,
        clerkId: "user_clerk_123",
        role: "INVESTOR" as const
      };
      const origNodeEnv = process.env.NODE_ENV;
      (process.env as { NODE_ENV?: string }).NODE_ENV = "development";

      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(existingByEmail as unknown as User)
        .mockResolvedValueOnce(linkedUser as unknown as User);
      vi.mocked(prisma.user.update)
        .mockResolvedValueOnce(linkedUser as unknown as User)
        .mockResolvedValueOnce(linkedUser as unknown as User);

      const caller = createCaller(mockCtx);
      const result = await caller.setRole({ role: "INVESTOR" });

      expect(prisma.user.update).toHaveBeenNthCalledWith(1, {
        where: { email: "test@example.com" },
        data: { clerkId: "user_clerk_123" }
      });
      expect(prisma.user.update).toHaveBeenNthCalledWith(2, {
        where: { clerkId: "user_clerk_123" },
        data: { role: "INVESTOR" }
      });
      expect(result.role).toBe("INVESTOR");

      (process.env as { NODE_ENV?: string }).NODE_ENV = origNodeEnv;
    });

    it("should throw CONFLICT when email exists and different clerkId (not dev)", async () => {
      const existingByEmail = {
        id: "user_123",
        clerkId: "old_clerk_456",
        email: "test@example.com",
        name: "Test User",
        role: null,
        avatarUrl: null,
        location: null,
        investorProfile: null,
        visionaryProfile: null
      };
      const origNodeEnv = process.env.NODE_ENV;
      (process.env as { NODE_ENV?: string }).NODE_ENV = "production";

      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(existingByEmail as unknown as User);

      const caller = createCaller(mockCtx);

      await expect(caller.setRole({ role: "INVESTOR" })).rejects.toThrow(
        "An account with this email already exists"
      );

      (process.env as { NODE_ENV?: string }).NODE_ENV = origNodeEnv;
    });

    it("should succeed on P2002 email conflict via find-by-email linking (dev)", async () => {
      const existingByEmail = {
        id: "user_123",
        clerkId: "old_clerk_456",
        email: "test@example.com",
        name: "Test User",
        role: null,
        avatarUrl: null,
        location: null,
        investorProfile: null,
        visionaryProfile: null
      };
      const linkedUser = {
        ...existingByEmail,
        clerkId: "user_clerk_123",
        role: "INVESTOR" as const
      };
      const prismaError = new Error("Unique constraint failed on the fields: (`email`)");
      (prismaError as { code?: string; meta?: { target?: string[] } }).code = "P2002";
      (prismaError as { code?: string; meta?: { target?: string[] } }).meta = { target: ["email"] };

      const origNodeEnv = process.env.NODE_ENV;
      (process.env as { NODE_ENV?: string }).NODE_ENV = "development";

      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(existingByEmail as unknown as User)
        .mockResolvedValueOnce(linkedUser as unknown as User);
      vi.mocked(prisma.user.create).mockRejectedValue(prismaError);
      vi.mocked(prisma.user.update)
        .mockResolvedValueOnce(linkedUser as unknown as User)
        .mockResolvedValueOnce(linkedUser as unknown as User);

      const caller = createCaller(mockCtx);
      const result = await caller.setRole({ role: "INVESTOR" });

      expect(prisma.user.update).toHaveBeenNthCalledWith(1, {
        where: { email: "test@example.com" },
        data: { clerkId: "user_clerk_123" }
      });
      expect(result.role).toBe("INVESTOR");

      (process.env as { NODE_ENV?: string }).NODE_ENV = origNodeEnv;
    });

    it("should throw error when user does not exist and Clerk fails", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      const clerkWithFailingGetUser = createMockClerkClient({
        users: {
          getUser: async () => {
            throw new Error("Clerk unavailable");
          }
        }
      } as unknown as Partial<Context["clerk"]>);
      const ctx = { ...mockCtx, clerk: clerkWithFailingGetUser };
      const caller = createCaller(ctx);

      await expect(caller.setRole({ role: "INVESTOR" })).rejects.toThrow(
        TRPCError
      );
      await expect(caller.setRole({ role: "INVESTOR" })).rejects.toThrow(
        "User lookup failed"
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

      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce(existingUser as unknown as User)
        .mockResolvedValueOnce(updatedUser as unknown as User);
      vi.mocked(prisma.user.update).mockResolvedValue(updatedUser as unknown as User);

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
          geoFocus: "US",
          onboardingComplete: true
        }
      };

      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce(existingUser as unknown as User)
        .mockResolvedValueOnce(updatedUser as unknown as User);
      vi.mocked(prisma.user.update).mockResolvedValue(updatedUser as unknown as User);

      const caller = createCaller(mockCtx);
      const result = await caller.setRole({ role: "INVESTOR" });

      expect(result.onboardingComplete).toBe(true);
    });
  });
});

