import { describe, it, expect } from "vitest";
import { rootRouter } from "./root";
import { createMockClerkClient } from "./testUtils/mockClerk";

describe("rootRouter", () => {
  const mockCtx = {
    userId: "user_123",
    clerk: createMockClerkClient()
  };

  it("should have auth router", async () => {
    const caller = rootRouter.createCaller(mockCtx);
    const result = await caller.auth.ping();

    expect(result.message).toBe("pong");
  });

  it("should have user router", async () => {
    // This will fail if user doesn't exist, but we're just checking the router structure
    const caller = rootRouter.createCaller(mockCtx);
    
    // Check that user router exists
    expect(caller.user).toBeDefined();
  });

  it("should have matchmaking router", async () => {
    const caller = rootRouter.createCaller(mockCtx);
    
    // Check that matchmaking router exists
    expect(caller.matchmaking).toBeDefined();
  });
});

