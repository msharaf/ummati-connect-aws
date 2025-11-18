/**
 * E2E tests for investor router
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestClient, trpcRequest } from "../utils/api-client";
import { getTestPrismaClient, initTestDatabase, cleanTestDatabase, closeTestDatabase } from "../utils/db";
import { TEST_USERS } from "../utils/auth";
import { createTestInvestor, createTestInvestorWithProfile, createTestFounderWithProfile } from "../fixtures/users";

describe("Investor Router E2E", () => {
  const client = createTestClient();
  const prisma = getTestPrismaClient();

  beforeAll(async () => {
    await initTestDatabase();
  });

  afterAll(async () => {
    await cleanTestDatabase();
    await closeTestDatabase();
  });

  describe("investor.getMyProfile", () => {
    it("should return investor profile", async () => {
      const { user, profile } = await createTestInvestorWithProfile(prisma);

      const response = await trpcRequest(
        client,
        TEST_USERS.investor.clerkId,
        TEST_USERS.investor.email,
        "investor.getMyProfile",
        {}
      );

      expect(response.status).toBe(200);
      expect(response.body.result.data).toMatchObject({
        hasAcceptedHalalTerms: true,
        minTicketSize: 10000,
        maxTicketSize: 100000,
      });
    });

    it("should return null for non-investor users", async () => {
      const { user } = await createTestFounderWithProfile(prisma);

      const response = await trpcRequest(
        client,
        TEST_USERS.founder.clerkId,
        TEST_USERS.founder.email,
        "investor.getMyProfile",
        {}
      );

      expect(response.status).toBe(404);
    });
  });

  describe("investor.browseVisionaries", () => {
    it("should return list of visionaries", async () => {
      const { user: investor } = await createTestInvestorWithProfile(prisma);
      const { user: founder1 } = await createTestFounderWithProfile(prisma);
      
      // Create another founder
      const founder2 = await prisma.user.create({
        data: {
          clerkId: "user_founder_2",
          email: "founder2@test.com",
          name: "Founder 2",
          role: "VISIONARY",
          visionaryProfile: {
            create: {
              startupName: "Startup 2",
              startupStage: "TRACTION",
              sector: "Fintech",
              isApproved: true,
            },
          },
        },
      });

      const response = await trpcRequest(
        client,
        TEST_USERS.investor.clerkId,
        TEST_USERS.investor.email,
        "investor.browseVisionaries",
        {
          limit: 20,
        }
      );

      expect(response.status).toBe(200);
      expect(response.body.result.data.profiles.length).toBeGreaterThan(0);
    });

    it("should filter visionaries by sector", async () => {
      const { user: investor } = await createTestInvestorWithProfile(prisma);
      
      // Create founders in different sectors
      await prisma.user.create({
        data: {
          clerkId: "user_founder_tech",
          email: "tech@test.com",
          name: "Tech Founder",
          role: "VISIONARY",
          visionaryProfile: {
            create: {
              startupName: "Tech Startup",
              startupStage: "MVP",
              sector: "Technology",
              isApproved: true,
            },
          },
        },
      });

      await prisma.user.create({
        data: {
          clerkId: "user_founder_fintech",
          email: "fintech@test.com",
          name: "Fintech Founder",
          role: "VISIONARY",
          visionaryProfile: {
            create: {
              startupName: "Fintech Startup",
              startupStage: "MVP",
              sector: "Fintech",
              isApproved: true,
            },
          },
        },
      });

      const response = await trpcRequest(
        client,
        TEST_USERS.investor.clerkId,
        TEST_USERS.investor.email,
        "investor.browseVisionaries",
        {
          sector: "Technology",
          limit: 20,
        }
      );

      expect(response.status).toBe(200);
      const profiles = response.body.result.data.profiles;
      expect(profiles.every((p: any) => p.visionaryProfile?.sector === "Technology")).toBe(true);
    });
  });

  describe("investor.acceptHalalTerms", () => {
    it("should accept halal terms", async () => {
      const { user } = await createTestInvestor(prisma);

      const response = await trpcRequest(
        client,
        TEST_USERS.investor.clerkId,
        TEST_USERS.investor.email,
        "investor.acceptHalalTerms",
        {}
      );

      expect(response.status).toBe(200);
      expect(response.body.result.data.success).toBe(true);

      // Verify in database
      const profile = await prisma.investorProfile.findUnique({
        where: { userId: user.id },
      });

      expect(profile?.hasAcceptedHalalTerms).toBe(true);
    });
  });
});

