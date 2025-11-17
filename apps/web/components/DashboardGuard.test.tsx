import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { DashboardGuard } from "./DashboardGuard";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { trpc } from "../src/lib/trpc";

// These are already mocked in vitest.setup.ts, but we override them here for specific tests

describe("DashboardGuard", () => {
  const mockPush = vi.fn();
  const mockRouter = {
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue(mockRouter as any);
  });

  it("should show loading when auth is not loaded", () => {
    vi.mocked(useUser).mockReturnValue({
      isSignedIn: false,
      isLoaded: false,
      user: null
    } as any);

    vi.mocked(trpc.user.me.useQuery).mockReturnValue({
      data: null,
      isLoading: false,
      error: null
    } as any);

    render(
      <DashboardGuard>
        <div>Protected Content</div>
      </DashboardGuard>
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("should redirect to sign-in when not authenticated", async () => {
    vi.mocked(useUser).mockReturnValue({
      isSignedIn: false,
      isLoaded: true,
      user: null
    } as any);

    vi.mocked(trpc.user.me.useQuery).mockReturnValue({
      data: null,
      isLoading: false,
      error: null
    } as any);

    render(
      <DashboardGuard>
        <div>Protected Content</div>
      </DashboardGuard>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/sign-in");
    });

    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("should redirect to onboarding when onboarding not complete", async () => {
    vi.mocked(useUser).mockReturnValue({
      isSignedIn: true,
      isLoaded: true,
      user: { id: "user_123" }
    } as any);

    vi.mocked(trpc.user.me.useQuery).mockReturnValue({
      data: {
        role: "INVESTOR",
        onboardingComplete: false,
        profile: { id: "user_123" }
      },
      isLoading: false,
      error: null
    } as any);

    render(
      <DashboardGuard>
        <div>Protected Content</div>
      </DashboardGuard>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/onboarding/choose-role");
    });

    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("should render children when authenticated and onboarding complete", async () => {
    vi.mocked(useUser).mockReturnValue({
      isSignedIn: true,
      isLoaded: true,
      user: { id: "user_123" }
    } as any);

    vi.mocked(trpc.user.me.useQuery).mockReturnValue({
      data: {
        role: "INVESTOR",
        onboardingComplete: true,
        profile: { id: "user_123" }
      },
      isLoading: false,
      error: null
    } as any);

    render(
      <DashboardGuard>
        <div>Protected Content</div>
      </DashboardGuard>
    );

    await waitFor(() => {
      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("should show loading when user data is loading", () => {
    vi.mocked(useUser).mockReturnValue({
      isSignedIn: true,
      isLoaded: true,
      user: { id: "user_123" }
    } as any);

    vi.mocked(trpc.user.me.useQuery).mockReturnValue({
      data: null,
      isLoading: true,
      error: null
    } as any);

    render(
      <DashboardGuard>
        <div>Protected Content</div>
      </DashboardGuard>
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });
});

