import { describe, it, expect, vi, beforeEach } from "vitest";
import { matchmakingRouter } from "./matchmaking";
import { createCallerFactory } from "@trpc/server";

const createCaller = createCallerFactory(matchmakingRouter);

describe("matchmakingRouter", () => {
  const mockCtx = {
    userId: "user_123",
    clerk: {}
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getRecommendations query", () => {
    it("should return recommendations structure", async () => {
      const caller = createCaller(mockCtx);
      const result = await caller.getRecommendations();

      expect(result).toHaveProperty("recommendations");
      expect(result).toHaveProperty("message");
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.message).toBe("Recommendations feature coming soon");
    });
  });

  describe("getMatches query", () => {
    it("should return matches structure", async () => {
      const caller = createCaller(mockCtx);
      const result = await caller.getMatches();

      expect(result).toHaveProperty("matches");
      expect(result).toHaveProperty("message");
      expect(Array.isArray(result.matches)).toBe(true);
      expect(result.message).toBe("Matches feature coming soon");
    });
  });
});

