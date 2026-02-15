import { describe, it, expect, vi, beforeEach } from "vitest";
import { matchmakingRouter } from "./matchmaking";
import { createMockClerkClient } from "../testUtils/mockClerk";

describe("matchmakingRouter", () => {
  const mockCtx = {
    userId: "user_123",
    clerk: createMockClerkClient()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getRecommendations query", () => {
    it("should return recommendations structure", async () => {
      const caller = matchmakingRouter.createCaller(mockCtx);
      const result = await caller.getRecommendations();

      expect(result).toHaveProperty("recommendations");
      expect(Array.isArray(result.recommendations)).toBe(true);
    });
  });

  describe("getMatches query", () => {
    it("should return matches structure", async () => {
      const caller = matchmakingRouter.createCaller(mockCtx);
      const result = await caller.getMatches();

      expect(Array.isArray(result)).toBe(true);
    });
  });
});

