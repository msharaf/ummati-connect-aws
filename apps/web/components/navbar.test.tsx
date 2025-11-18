import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Navbar } from "./navbar";
import { useUser } from "@clerk/nextjs";

// Mock is already in vitest.setup.ts, but we override useUser here

describe("Navbar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show loading state when auth is not loaded", () => {
    vi.mocked(useUser).mockReturnValue({
      isSignedIn: false,
      isLoaded: false,
      user: null
    } as any);

    render(<Navbar />);

    // Should show loading placeholder
    const loadingElement = document.querySelector(".animate-pulse");
    expect(loadingElement).toBeInTheDocument();
  });

  it("should show Login button when not signed in", () => {
    vi.mocked(useUser).mockReturnValue({
      isSignedIn: false,
      isLoaded: true,
      user: null
    } as any);

    render(<Navbar />);

    expect(screen.getByText("Login")).toBeInTheDocument();
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
    expect(screen.queryByText("Logout")).not.toBeInTheDocument();
  });

  it("should show Dashboard and Logout buttons when signed in", () => {
    vi.mocked(useUser).mockReturnValue({
      isSignedIn: true,
      isLoaded: true,
      user: { id: "user_123", emailAddresses: [{ emailAddress: "test@example.com" }] }
    } as any);

    render(<Navbar />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Logout")).toBeInTheDocument();
    expect(screen.queryByText("Login")).not.toBeInTheDocument();
  });

  it("should render navigation links", () => {
    vi.mocked(useUser).mockReturnValue({
      isSignedIn: false,
      isLoaded: true,
      user: null
    } as any);

    render(<Navbar />);

    expect(screen.getByText("Features")).toBeInTheDocument();
    expect(screen.getByText("Barakah Score")).toBeInTheDocument();
    expect(screen.getByText("Matching")).toBeInTheDocument();
  });

  it("should render Ummati logo", () => {
    vi.mocked(useUser).mockReturnValue({
      isSignedIn: false,
      isLoaded: true,
      user: null
    } as any);

    render(<Navbar />);

    expect(screen.getByText("Ummati")).toBeInTheDocument();
  });
});

