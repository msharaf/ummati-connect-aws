import { describe, it, expect, vi, beforeEach } from "vitest";
import { createContext } from "./context";
import { verifyClerkJwt } from "./auth/verifyClerkJwt";

vi.mock("./auth/verifyClerkJwt");
vi.mock("@clerk/backend", () => ({
  createClerkClient: vi.fn(() => ({}))
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
    const mockVerify = vi.mocked(verifyClerkJwt);
    mockVerify.mockResolvedValue({
      userId: "user_456",
      iss: "https://example.clerk.accounts.dev",
      aud: "ummati-api"
    });

    const opts = { authToken: "valid_token_here" };
    const context = await createContext(opts);

    expect(mockVerify).toHaveBeenCalledWith("valid_token_here");
    expect(context.userId).toBe("user_456");
  });

  it("should handle invalid token gracefully", async () => {
    const mockVerify = vi.mocked(verifyClerkJwt);
    mockVerify.mockRejectedValue(new Error("Invalid token"));

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const opts = { authToken: "invalid_token" };
    const context = await createContext(opts);

    expect(context.userId).toBeNull();
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it("should prefer userId over authToken when both are provided", async () => {
    const mockVerify = vi.mocked(verifyClerkJwt);

    const opts = {
      userId: "user_789",
      authToken: "token_here"
    };
    const context = await createContext(opts);

    expect(context.userId).toBe("user_789");
    expect(mockVerify).not.toHaveBeenCalled();
  });
});
