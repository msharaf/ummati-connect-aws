/**
 * E2E tests for visionary router
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestClient, trpcRequest } from "../utils/api-client";
import { getTestPrismaClient, initTestDatabase, cleanTestDatabase, closeTestDatabase } from "../utils/db";
import { TEST_USERS } from "../utils/auth";
import { createTestFounder, createTestFounderWithProfile } from "../fixtures/users";

describe("Visionary Router E2E", () => {
  const client = createTestClient();
  const prisma = getTestPrismaClient();

  beforeAll(async () => {
    await initTestDatabase();
  });

  afterAll(async () => {
    await cleanTestDatabase();
    await closeTestDatabase();
  });

  describe("visionary.getMyProfile", () => {
    it("should return visionary profile", async () => {
      const { user, profile } = await createTestFounderWithProfile(prisma);

      const response = await trpcRequest(
        client,
        TEST_USERS.founder.clerkId,
        TEST_USERS.founder.email,
        "visionary.getMyProfile",
        {}
      );

      expect(response.status).toBe(200);
      expect(response.body.result.data).toMatchObject({
        startupName: "Test Startup",
        startupStage: "MVP",
        sector: "Technology",
      });
    });
  });

  describe("visionary.saveProfileDetails", () => {
    it("should save profile details", async () => {
      const { user } = await createTestFounder(prisma);

      const response = await trpcRequest(
        client,
        TEST_USERS.founder.clerkId,
        TEST_USERS.founder.email,
        "visionary.saveProfileDetails",
        {
          startupName: "New Startup",
          tagline: "Building the future",
          startupStage: "IDEA",
          sector: "Technology",
          description: "A test startup",
          fundingAsk: 50000,
        }
      );

      expect(response.status).toBe(200);
      expect(response.body.result.data.success).toBe(true);

      // Verify in database
      const profile = await prisma.visionaryProfile.findUnique({
        where: { userId: user.id },
      });

      expect(profile?.startupName).toBe("New Startup");
      expect(profile?.startupStage).toBe("IDEA");
    });
  });
});

