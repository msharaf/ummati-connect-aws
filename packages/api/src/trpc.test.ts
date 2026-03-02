import { describe, it, expect } from "vitest";
import { router, publicProcedure, protectedProcedure, createCallerFactory } from "./trpc";
import { TRPCError } from "@trpc/server";
import { createMockClerkClient } from "./testUtils/mockClerk";

describe("tRPC setup", () => {
  it("should create a router", () => {
    const testRouter = router({
      test: publicProcedure.query(() => ({ message: "test" }))
    });

    expect(testRouter).toBeDefined();
  });

  it("should allow public procedures", async () => {
    const testRouter = router({
      public: publicProcedure.query(() => ({ message: "public" }))
    });
    const createCaller = createCallerFactory(testRouter);
    const caller = createCaller({ userId: null, auth: null, clerk: createMockClerkClient() });

    const result = await caller.public();
    expect(result.message).toBe("public");
  });

  it("should protect protected procedures", async () => {
    const testRouter = router({
      protected: protectedProcedure.query(() => ({ message: "protected" }))
    });
    const createCaller = createCallerFactory(testRouter);
    // Should work with userId
    const callerWithAuth = createCaller({ userId: "user_123", auth: null, clerk: createMockClerkClient() });
    const result = await callerWithAuth.protected();
    expect(result.message).toBe("protected");

    // Should throw error without userId
    const callerWithoutAuth = createCaller({ userId: null, auth: null, clerk: createMockClerkClient() });
    await expect(callerWithoutAuth.protected()).rejects.toThrow(TRPCError);
    await expect(callerWithoutAuth.protected()).rejects.toThrow("UNAUTHORIZED");
  });
});

