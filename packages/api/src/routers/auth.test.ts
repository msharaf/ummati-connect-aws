import { describe, it, expect, vi, beforeEach } from "vitest";
import { authRouter } from "./auth";

describe("authRouter", () => {
  const mockCtx = {
    userId: "user_123",
    clerk: {}
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("ping query", () => {
    it("should return pong message", async () => {
      const caller = authRouter.createCaller(mockCtx);
      const result = await caller.ping();

      expect(result.message).toBe("pong");
    });
  });

  describe("me query", () => {
    it("should return user info when authenticated", async () => {
      const caller = authRouter.createCaller(mockCtx);
      const result = await caller.me();

      expect(result.userId).toBe("user_123");
      expect(result.message).toBe("User authenticated");
    });
  });
});

