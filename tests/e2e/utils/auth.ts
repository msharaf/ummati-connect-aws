import { sign } from "jsonwebtoken";

/**
 * Mock Clerk JWT token for testing
 */
export function createMockClerkToken(userId: string, email: string): string {
  const secret = process.env.CLERK_SECRET_KEY || "test-secret-key";
  
  const payload = {
    sub: userId,
    email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
  };

  return sign(payload, secret);
}

/**
 * Get authorization header with mock token
 */
export function getAuthHeader(userId: string, email: string): string {
  const token = createMockClerkToken(userId, email);
  return `Bearer ${token}`;
}

/**
 * Test user fixtures
 */
export const TEST_USERS = {
  founder: {
    clerkId: "user_test_founder_123",
    email: "founder@test.com",
    name: "Test Founder",
    role: "VISIONARY" as const,
  },
  investor: {
    clerkId: "user_test_investor_456",
    email: "investor@test.com",
    name: "Test Investor",
    role: "INVESTOR" as const,
  },
  admin: {
    clerkId: "user_test_admin_789",
    email: "admin@test.com",
    name: "Test Admin",
    role: null,
    isAdmin: true,
  },
};

