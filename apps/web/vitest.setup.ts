import { vi } from "vitest";
import React from "react";
import "@testing-library/jest-dom";

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    pathname: "/",
    query: {},
    asPath: "/"
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams()
}));

// Mock Next.js Link
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => {
    // eslint-disable-next-line react/jsx-no-target-blank
    return React.createElement("a", { href }, children);
  }
}));

// Mock Clerk
vi.mock("@clerk/nextjs", () => ({
  useUser: vi.fn(() => ({
    isSignedIn: false,
    isLoaded: true,
    user: null
  })),
  useAuth: vi.fn(() => ({
    isSignedIn: false,
    isLoaded: true,
    userId: null
  })),
  SignOutButton: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ClerkProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

// Mock tRPC
vi.mock("../src/lib/trpc", () => ({
  trpc: {
    user: {
      me: {
        useQuery: vi.fn(() => ({
          data: null,
          isLoading: false,
          error: null
        }))
      }
    },
    useUtils: vi.fn(() => ({
      user: {
        me: {
          invalidate: vi.fn()
        }
      }
    }))
  },
  TRPCProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

