import { createClerkClient, verifyToken } from "@clerk/backend";
import type { inferAsyncReturnType } from "@trpc/server";

export interface CreateContextOptions {
  userId?: string | null;
  authToken?: string | null;
}

// Create a singleton Clerk client
const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY
});

export async function createContext(opts: CreateContextOptions = {}) {
  let userId = opts.userId || null;

  // If we have an auth token but no userId, verify it with Clerk
  if (opts.authToken && !userId) {
    try {
      const payload = await verifyToken(opts.authToken, {
        secretKey: process.env.CLERK_SECRET_KEY
      });
      userId = payload.sub;
    } catch (error) {
      // Token invalid, userId remains null
      // Log error without exposing token details
      console.error("Failed to verify auth token:", error instanceof Error ? error.message : "Unknown error");
    }
  }

  return {
    userId,
    clerk
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;

