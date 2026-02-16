import { createClerkClient } from "@clerk/backend";
import type { inferAsyncReturnType } from "@trpc/server";
import { decodeJwt } from "jose";

import { verifyClerkJwt } from "./auth/verifyClerkJwt";

export interface CreateContextOptions {
  userId?: string | null;
  authToken?: string | null;
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

// Clerk client for API calls (users.getUser etc.) - uses CLERK_SECRET_KEY
// JWT verification uses JWKS only, NOT secret key
const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY
});

export async function createContext(opts: CreateContextOptions = {}) {
  let userId: string | null = opts.userId ?? null;
  let auth: { iss?: string; aud?: unknown } | null = null;

  // Only verify token when we have a token and no userId (e.g. web passes userId from auth())
  if (opts.authToken && opts.authToken.length > 0 && !userId) {
    const token = opts.authToken;

    // Dev: log decoded iss/aud (unverified)
    if (process.env.NODE_ENV !== "production") {
      try {
        const decoded = decodeJwt(token);
        // eslint-disable-next-line no-console
        console.log(
          "   🔑 createContext: decoded iss=",
          decoded.iss ?? "n/a",
          "aud=",
          decoded.aud ?? "n/a"
        );
      } catch {
        // decodeJwt can throw on malformed; ignore
      }
    }

    try {
      const result = await verifyClerkJwt(token);
      userId = result.userId;
      auth = { iss: result.iss, aud: result.aud };
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.log("   🔑 createContext: verified userId=", userId);
      }
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        const reason = getVerifyFailureReason(error);
        // eslint-disable-next-line no-console
        console.warn(
          "   🔑 createContext: verify failed -",
          reason,
          "|",
          error instanceof Error ? error.message : "Unknown error"
        );
      }
      // Never throw; context sets userId=null on auth failure
    }
  }

  return {
    userId,
    auth,
    clerk
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;
