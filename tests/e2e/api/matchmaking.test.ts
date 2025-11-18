/**
 * E2E tests for matchmaking router
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestClient, trpcRequest } from "../utils/api-client";
import { getTestPrismaClient, initTestDatabase, cleanTestDatabase, closeTestDatabase } from "../utils/db";
import { TEST_USERS } from "../utils/auth";
import { createTestFounderWithProfile, createTestInvestorWithProfile } from "../fixtures/users";
import { createMatch } from "../fixtures/matches";

describe("Matchmaking Router E2E", () => {
  const client = createTestClient();
  const prisma = getTestPrismaClient();

  beforeAll(async () => {
    await initTestDatabase();
  });

  afterAll(async () => {
    await cleanTestDatabase();
    await closeTestDatabase();
  });

  describe("matchmaking.getRecommendations", () => {
    it("should return recommendations for investor", async () => {
      const { user: investor } = await createTestInvestorWithProfile(prisma);
      const { user: founder1 } = await createTestFounderWithProfile(prisma);

      const response = await trpcRequest(
        client,
        TEST_USERS.investor.clerkId,
        TEST_USERS.investor.email,
        "matchmaking.getRecommendations",
        {}
      );

      expect(response.status).toBe(200);
      expect(response.body.result.data).toHaveProperty("recommendations");
    });
  });

  describe("matchmaking.getMatches", () => {
    it("should return matches for user", async () => {
      const { user: founder } = await createTestFounderWithProfile(prisma);
      const { user: investor } = await createTestInvestorWithProfile(prisma);
      
      // Create a match
      await createMatch(prisma, founder.id, investor.id);

      const response = await trpcRequest(
        client,
        TEST_USERS.founder.clerkId,
        TEST_USERS.founder.email,
        "matchmaking.getMatches",
        {}
      );

      expect(response.status).toBe(200);
      expect(response.body.result.data).toHaveProperty("matches");
    });

    it("should return empty matches for user with no matches", async () => {
      const { user: founder } = await createTestFounderWithProfile(prisma);

      const response = await trpcRequest(
        client,
        TEST_USERS.founder.clerkId,
        TEST_USERS.founder.email,
        "matchmaking.getMatches",
        {}
      );

      expect(response.status).toBe(200);
      expect(response.body.result.data.matches).toEqual([]);
    });
  });
});

