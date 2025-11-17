import { describe, it, expect, vi, beforeEach } from "vitest";
import { createContext } from "./context";
import { verifyToken } from "@clerk/backend";

// Mock @clerk/backend
vi.mock("@clerk/backend", () => ({
  createClerkClient: vi.fn(() => ({})),
  verifyToken: vi.fn()
}));

describe("createContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return context with userId when provided", async () => {
    const opts = { userId: "user_123" };
    const context = await createContext(opts);

    expect(context.userId).toBe("user_123");
    expect(context.clerk).toBeDefined();
  });

  it("should return context with null userId when not provided", async () => {
    const context = await createContext();

    expect(context.userId).toBeNull();
    expect(context.clerk).toBeDefined();
  });

  it("should verify token and set userId when authToken is provided", async () => {
    const mockVerifyToken = vi.mocked(verifyToken);
    mockVerifyToken.mockResolvedValue({ sub: "user_456" });

    const opts = { authToken: "valid_token_here" };
    const context = await createContext(opts);

    expect(mockVerifyToken).toHaveBeenCalledWith("valid_token_here");
    expect(context.userId).toBe("user_456");
  });

  it("should handle invalid token gracefully", async () => {
    const mockVerifyToken = vi.mocked(verifyToken);
    mockVerifyToken.mockRejectedValue(new Error("Invalid token"));

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const opts = { authToken: "invalid_token" };
    const context = await createContext(opts);

    expect(context.userId).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("should prefer userId over authToken when both are provided", async () => {
    const mockVerifyToken = vi.mocked(verifyToken);

    const opts = {
      userId: "user_789",
      authToken: "token_here"
    };
    const context = await createContext(opts);

    expect(context.userId).toBe("user_789");
    expect(mockVerifyToken).not.toHaveBeenCalled();
  });
});

