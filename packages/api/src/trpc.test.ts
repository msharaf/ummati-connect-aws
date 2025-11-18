import { describe, it, expect } from "vitest";
import { router, publicProcedure, protectedProcedure } from "./trpc";
import { TRPCError } from "@trpc/server";

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

    const caller = testRouter.createCaller({ userId: null, clerk: {} });

    const result = await caller.public();
    expect(result.message).toBe("public");
  });

  it("should protect protected procedures", async () => {
    const testRouter = router({
      protected: protectedProcedure.query(() => ({ message: "protected" }))
    });

    // Should work with userId
    const callerWithAuth = testRouter.createCaller({ userId: "user_123", clerk: {} });
    const result = await callerWithAuth.protected();
    expect(result.message).toBe("protected");

    // Should throw error without userId
    const callerWithoutAuth = testRouter.createCaller({ userId: null, clerk: {} });
    await expect(callerWithoutAuth.protected()).rejects.toThrow(TRPCError);
    await expect(callerWithoutAuth.protected()).rejects.toThrow("UNAUTHORIZED");
  });
});

