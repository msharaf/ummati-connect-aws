/**
 * E2E tests for authentication flows
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestClient, trpcRequest } from "../utils/api-client";
import { getTestPrismaClient, initTestDatabase, cleanTestDatabase, closeTestDatabase } from "../utils/db";
import { TEST_USERS } from "../utils/auth";
import { createTestFounder, createTestInvestor } from "../fixtures/users";

describe("Authentication E2E", () => {
  const client = createTestClient();
  const prisma = getTestPrismaClient();

  beforeAll(async () => {
    await initTestDatabase();
  });

  afterAll(async () => {
    await cleanTestDatabase();
    await closeTestDatabase();
  });

  describe("Unauthenticated requests", () => {
    it("should reject protected queries without auth", async () => {
      // Try to access protected endpoint without auth
      const response = await client
        .post("/trpc/user.me")
        .send({ json: {} });

      expect(response.status).toBe(401);
    });

    it("should allow public queries without auth", async () => {
      const response = await client
        .post("/trpc/auth.ping")
        .send({ json: {} });

      expect(response.status).toBe(200);
      expect(response.body.result.data).toEqual({ message: "pong" });
    });
  });

  describe("Authenticated requests", () => {
    it("should allow authenticated user to access protected endpoints", async () => {
      // Create test user in DB
      const user = await createTestFounder(prisma);

      const response = await trpcRequest(
        client,
        TEST_USERS.founder.clerkId,
        TEST_USERS.founder.email,
        "user.me",
        {}
      );

      expect(response.status).toBe(200);
      expect(response.body.result.data.role).toBe("VISIONARY");
    });

    it("should return correct user profile", async () => {
      const user = await createTestInvestor(prisma);

      const response = await trpcRequest(
        client,
        TEST_USERS.investor.clerkId,
        TEST_USERS.investor.email,
        "user.me",
        {}
      );

      expect(response.status).toBe(200);
      expect(response.body.result.data).toMatchObject({
        role: "INVESTOR",
        onboardingComplete: false,
      });
    });
  });

  describe("JWT token validation", () => {
    it("should reject invalid tokens", async () => {
      const response = await client
        .post("/trpc/user.me")
        .set("Authorization", "Bearer invalid-token")
        .send({ json: {} });

      expect(response.status).toBe(401);
    });

    it("should accept valid mock tokens", async () => {
      const user = await createTestFounder(prisma);

      const response = await trpcRequest(
        client,
        TEST_USERS.founder.clerkId,
        TEST_USERS.founder.email,
        "user.me",
        {}
      );

      expect(response.status).toBe(200);
    });
  });
});

