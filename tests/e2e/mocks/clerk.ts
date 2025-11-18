import { createMockClerkToken } from "../utils/auth";

/**
 * Mock Clerk authentication for tests
 * This replaces Clerk's actual authentication with test tokens
 */

export interface MockClerkUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
}

/**
 * Generate mock Clerk JWT token
 */
export function generateMockClerkToken(user: MockClerkUser): string {
  return createMockClerkToken(user.id, user.email);
}

/**
 * Mock Clerk session data
 */
export function createMockClerkSession(user: MockClerkUser) {
  return {
    id: `sess_${user.id}`,
    userId: user.id,
    status: "active" as const,
    lastActiveAt: Date.now(),
    expireAt: Date.now() + 3600000, // 1 hour
    user: {
      id: user.id,
      emailAddresses: [{ emailAddress: user.email, id: `ea_${user.id}` }],
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
    },
  };
}

/**
 * Default test users for Clerk mocks
 */
export const MOCK_CLERK_USERS = {
  founder: {
    id: "user_test_founder_123",
    email: "founder@test.com",
    firstName: "Test",
    lastName: "Founder",
  },
  investor: {
    id: "user_test_investor_456",
    email: "investor@test.com",
    firstName: "Test",
    lastName: "Investor",
  },
  admin: {
    id: "user_test_admin_789",
    email: "admin@test.com",
    firstName: "Test",
    lastName: "Admin",
  },
};

