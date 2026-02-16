import { createClerkClient, verifyToken } from "@clerk/backend";
import type { inferAsyncReturnType } from "@trpc/server";

export interface CreateContextOptions {
  userId?: string | null;
  authToken?: string | null;
}

/** Decode JWT payload without verifying (for dev logging only). */
function decodeJwtPayloadUnsafe(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(base64, "base64").toString("utf8");
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Derive a short reason from verify error for dev logging. */
function getVerifyFailureReason(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  if (/issuer|iss/i.test(msg)) return "issuer mismatch";
  if (/audience|aud/i.test(msg)) return "audience mismatch";
  if (/signature|invalid signature/i.test(msg)) return "signature invalid";
  if (/jwks|fetch|network/i.test(msg)) return "jwks fetch failed";
  if (/expired|exp/i.test(msg)) return "token expired";
  if (/clock|skew/i.test(msg)) return "clock skew";
  return msg.slice(0, 80);
}

// Create a singleton Clerk client
const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY
});

export async function createContext(opts: CreateContextOptions = {}) {
  let userId = opts.userId || null;
  const hasAuthHeader = !!(opts.authToken && opts.authToken.length > 0);

  if (process.env.NODE_ENV !== "production") {
    const authPrefix = opts.authToken
      ? String(opts.authToken).slice(0, 30) + (opts.authToken.length > 30 ? "..." : "")
      : "none";
    // eslint-disable-next-line no-console
    console.log(
      "   🔑 createContext: hasAuthHeader=",
      hasAuthHeader,
      "authPrefix=",
      authPrefix
    );
    if (opts.authToken) {
      const payload = decodeJwtPayloadUnsafe(opts.authToken);
      if (payload) {
        // eslint-disable-next-line no-console
        console.log(
          "   🔑 createContext: decoded iss=",
          payload.iss ?? "n/a",
          "aud=",
          payload.aud ?? "n/a",
          "azp=",
          payload.azp ?? "n/a"
        );
      }
    }
  }

  // If we have an auth token but no userId, verify it with Clerk
  if (opts.authToken && !userId) {
    if (!process.env.CLERK_SECRET_KEY) {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.warn("⚠️  Skipping token verification - CLERK_SECRET_KEY not set");
      }
    } else {
      try {
        const verifyPromise = verifyToken(opts.authToken, {
          secretKey: process.env.CLERK_SECRET_KEY
        });
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("Token verification timeout")), 5000);
        });
        const payload = await Promise.race([verifyPromise, timeoutPromise]);
        userId = payload.sub ?? null;
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.log("   🔑 createContext: token verified, userId=", userId);
        }
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          const reason = getVerifyFailureReason(error);
          // eslint-disable-next-line no-console
          console.warn(
            "   🔑 createContext: verify failed -",
            reason,
            "| full:",
            error instanceof Error ? error.message : "Unknown error"
          );
        }
      }
    }
  }

  return {
    userId,
    clerk
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;

