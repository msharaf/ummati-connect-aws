import type { Context } from "../context";

/**
 * Creates a minimal mock ClerkClient for tests.
 * Satisfies TypeScript's Context["clerk"] type without full runtime implementation.
 */
export function createMockClerkClient(): Context["clerk"] {
  return { telemetry: {} } as unknown as Context["clerk"];
}
