/**
 * E2E tests for user router
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestClient, trpcRequest } from "../utils/api-client";
import { getTestPrismaClient, initTestDatabase, cleanTestDatabase, closeTestDatabase } from "../utils/db";
import { TEST_USERS } from "../utils/auth";
import { createTestFounder, createTestInvestor } from "../fixtures/users";

describe("User Router E2E", () => {
  const client = createTestClient();
  const prisma = getTestPrismaClient();

  beforeAll(async () => {
    await initTestDatabase();
  });

  afterAll(async () => {
    await cleanTestDatabase();
    await closeTestDatabase();
  });

  describe("user.me", () => {
    it("should return user profile for authenticated user", async () => {
      const user = await createTestFounder(prisma);

      const response = await trpcRequest(
        client,
        TEST_USERS.founder.clerkId,
        TEST_USERS.founder.email,
        "user.me",
        {}
      );

      expect(response.status).toBe(200);
      expect(response.body.result.data).toMatchObject({
        role: "VISIONARY",
        profile: {
          email: TEST_USERS.founder.email,
          name: TEST_USERS.founder.name,
        },
      });
    });

    it("should return onboarding status correctly", async () => {
      const user = await createTestFounder(prisma);

      const response = await trpcRequest(
        client,
        TEST_USERS.founder.clerkId,
        TEST_USERS.founder.email,
        "user.me",
        {}
      );

      // Without profile, onboarding should be incomplete
      expect(response.body.result.data.onboardingComplete).toBe(false);
    });
  });

  describe("user.setRole", () => {
    it("should set user role", async () => {
      const user = await createTestFounder(prisma);

      const response = await trpcRequest(
        client,
        TEST_USERS.founder.clerkId,
        TEST_USERS.founder.email,
        "user.setRole",
        { role: "INVESTOR" }
      );

      expect(response.status).toBe(200);
      expect(response.body.result.data.role).toBe("INVESTOR");

      // Verify in database
      const updatedUser = await prisma.user.findUnique({
        where: { clerkId: TEST_USERS.founder.clerkId },
      });

      expect(updatedUser?.role).toBe("INVESTOR");
    });

    it("should reject invalid role", async () => {
      const user = await createTestFounder(prisma);

      const response = await trpcRequest(
        client,
        TEST_USERS.founder.clerkId,
        TEST_USERS.founder.email,
        "user.setRole",
        { role: "INVALID" }
      );

      expect(response.status).toBe(400);
    });
  });
});

