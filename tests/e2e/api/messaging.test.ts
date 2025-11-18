/**
 * E2E tests for messaging functionality
 * Note: This tests the API layer. Full messaging E2E would test web/mobile UI
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getTestPrismaClient, initTestDatabase, cleanTestDatabase, closeTestDatabase } from "../utils/db";
import { createTestFounderWithProfile, createTestInvestorWithProfile } from "../fixtures/users";
import { createMatch, createMessage } from "../fixtures/matches";

describe("Messaging E2E", () => {
  const prisma = getTestPrismaClient();

  beforeAll(async () => {
    await initTestDatabase();
  });

  afterAll(async () => {
    await cleanTestDatabase();
    await closeTestDatabase();
  });

  describe("Message creation", () => {
    it("should create message in match", async () => {
      const { user: founder } = await createTestFounderWithProfile(prisma);
      const { user: investor } = await createTestInvestorWithProfile(prisma);
      
      const match = await createMatch(prisma, founder.id, investor.id);

      const message = await createMessage(
        prisma,
        match.id,
        founder.id,
        "Hello, I'm interested in your startup!"
      );

      expect(message).toBeDefined();
      expect(message.text).toBe("Hello, I'm interested in your startup!");
      expect(message.senderId).toBe(founder.id);
      expect(message.matchId).toBe(match.id);
    });

    it("should retrieve messages for a match", async () => {
      const { user: founder } = await createTestFounderWithProfile(prisma);
      const { user: investor } = await createTestInvestorWithProfile(prisma);
      
      const match = await createMatch(prisma, founder.id, investor.id);

      // Create multiple messages
      await createMessage(prisma, match.id, founder.id, "Message 1");
      await createMessage(prisma, match.id, investor.id, "Message 2");
      await createMessage(prisma, match.id, founder.id, "Message 3");

      // Retrieve messages
      const messages = await prisma.message.findMany({
        where: { matchId: match.id },
        orderBy: { createdAt: "asc" },
      });

      expect(messages.length).toBe(3);
      expect(messages[0].text).toBe("Message 1");
      expect(messages[1].text).toBe("Message 2");
      expect(messages[2].text).toBe("Message 3");
    });
  });
});

