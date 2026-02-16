/**
 * Verify Clerk JWTs using JWKS (no secret key).
 * Uses jose + createRemoteJWKSet for issuer-based verification.
 */
import {
  createRemoteJWKSet,
  jwtVerify,
  decodeJwt,
  type JWTVerifyResult
} from "jose";

function getAudience(): string {
  return process.env.CLERK_JWT_AUDIENCE ?? "ummati-api";
}

// Cache JWKS per issuer (jose createRemoteJWKSet handles its own internal caching)
const jwksCache = new Map<
  string,
  ReturnType<typeof createRemoteJWKSet>
>();

function getJwks(iss: string): ReturnType<typeof createRemoteJWKSet> {
  let jwks = jwksCache.get(iss);
  if (!jwks) {
    const jwksUrl = `${iss.replace(/\/$/, "")}/.well-known/jwks.json`;
    jwks = createRemoteJWKSet(new URL(jwksUrl));
    jwksCache.set(iss, jwks);
  }
  return jwks;
}

/** Check if audience claim includes expected audience (aud can be string or string[]) */
function audIncludes(aud: unknown, expected: string): boolean {
  if (typeof aud === "string") return aud === expected;
  if (Array.isArray(aud)) return aud.includes(expected);
  return false;
}

export interface VerifyResult {
  userId: string;
  iss?: string;
  aud?: unknown;
}

/**
 * Verify a Clerk JWT using remote JWKS.
 * - Decodes (unverified) to read iss/aud
 * - Requires aud includes CLERK_JWT_AUDIENCE (default "ummati-api")
 * - Optionally enforces CLERK_ISSUER if set
 * - Verifies signature via JWKS
 * @returns { userId, iss, aud } on success
 * @throws on verification failure (context catches and sets userId=null)
 */
export async function verifyClerkJwt(token: string): Promise<VerifyResult> {
  const audience = getAudience();
  const optionalIssuer = process.env.CLERK_ISSUER ?? undefined;

  // Decode (unverified) to get iss for JWKS URL
  const unverified = decodeJwt(token);
  const iss = unverified.iss;
  const aud = unverified.aud;

  if (!iss || typeof iss !== "string") {
    throw new Error("JWT missing iss claim");
  }

  // Require aud includes expected audience
  if (!audIncludes(aud, audience)) {
    throw new Error(
      `audience mismatch: expected "${audience}", got ${JSON.stringify(aud)}`
    );
  }

  // If CLERK_ISSUER is set, enforce match
  if (optionalIssuer && iss !== optionalIssuer) {
    throw new Error(
      `issuer mismatch: expected "${optionalIssuer}", got "${iss}"`
    );
  }

  const jwks = getJwks(iss);
  const result: JWTVerifyResult = await jwtVerify(token, jwks, {
    issuer: iss,
    audience
  });

  const sub = result.payload.sub;
  if (!sub || typeof sub !== "string") {
    throw new Error("JWT missing sub claim");
  }

  return {
    userId: sub,
    iss,
    aud: result.payload.aud
  };
}
