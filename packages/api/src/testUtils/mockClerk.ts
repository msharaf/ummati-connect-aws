import type { Context } from "../context";

/**
 * Creates a minimal mock ClerkClient for tests.
 * Satisfies TypeScript's Context["clerk"] type without full runtime implementation.
 */
export function createMockClerkClient(overrides?: Partial<Context["clerk"]>): Context["clerk"] {
  return {
    telemetry: {},
    users: {
      getUser: async () => ({
        id: "user_clerk_123",
        emailAddresses: [{ emailAddress: "test@example.com" }],
        firstName: "Test",
        lastName: "User"
      })
    },
    ...overrides
  } as unknown as Context["clerk"];
}
