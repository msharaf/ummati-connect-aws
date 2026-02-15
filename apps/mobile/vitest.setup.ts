import { vi } from "vitest";

// Mock @clerk/clerk-expo (react-native is mocked per-test to avoid Flow parse errors)
vi.mock("@clerk/clerk-expo", () => ({
  useClerk: vi.fn(() => ({
    signOut: vi.fn().mockResolvedValue(undefined),
  })),
  useAuth: vi.fn(() => ({
    isSignedIn: false,
    isLoaded: true,
    userId: null,
  })),
}));
