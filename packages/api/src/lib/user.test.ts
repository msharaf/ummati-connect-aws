import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCurrentUserProfile } from "./user";
import { prisma } from "@ummati/db";

// Mock Prisma
vi.mock("@ummati/db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn()
    }
  }
}));

describe("getCurrentUserProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return null when clerkId is null", async () => {
    const result = await getCurrentUserProfile(null);
    expect(result).toBeNull();
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("should return null when user does not exist", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const result = await getCurrentUserProfile("user_clerk_123");
    expect(result).toBeNull();
  });

  it("should return user profile with onboardingComplete true for INVESTOR with profile", async () => {
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
        preferredSectors: ["Tech"],
        geoFocus: "US"
      },
      visionaryProfile: null
    };

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

    const result = await getCurrentUserProfile("user_clerk_123");

    expect(result).not.toBeNull();
    expect(result?.onboardingComplete).toBe(true);
    expect(result?.role).toBe("INVESTOR");
    expect(result?.investorProfile).toBeDefined();
  });

  it("should return onboardingComplete false when INVESTOR has no profile", async () => {
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

    const result = await getCurrentUserProfile("user_clerk_123");

    expect(result?.onboardingComplete).toBe(false);
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
        tagline: "Innovative",
        startupStage: "SEED",
        sector: "Tech",
        description: "A startup",
        isApproved: false
      }
    };

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

    const result = await getCurrentUserProfile("user_clerk_123");

    expect(result?.onboardingComplete).toBe(true);
    expect(result?.role).toBe("VISIONARY");
    expect(result?.visionaryProfile).toBeDefined();
  });

  it("should handle errors gracefully", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(prisma.user.findUnique).mockRejectedValue(new Error("Database error"));

    const result = await getCurrentUserProfile("user_clerk_123");

    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});

