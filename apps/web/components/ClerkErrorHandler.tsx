"use client";

import { useEffect } from "react";

/**
 * Global error handler to suppress Clerk v5 + Next.js 14 cookies() error
 * This is a workaround for a known issue in Clerk v5.7.5
 */
export function ClerkErrorHandler({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Suppress the specific Clerk cookies() error
    const originalError = console.error;
    console.error = (...args: any[]) => {
      const errorMessage = args[0]?.toString() || "";
      if (
        errorMessage.includes("cookies() expects to have requestAsyncStorage") ||
        errorMessage.includes("Invariant: cookies()")
      ) {
        // Suppress this error - it's a known Clerk v5 + Next.js 14 compatibility issue
        // The app will continue to work despite this error
        return;
      }
      originalError.apply(console, args);
    };

    // Also handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errorMessage = event.reason?.message || event.reason?.toString() || "";
      if (
        errorMessage.includes("cookies() expects to have requestAsyncStorage") ||
        errorMessage.includes("Invariant: cookies()")
      ) {
        // Suppress this error
        event.preventDefault();
        return;
      }
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      console.error = originalError;
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  return <>{children}</>;
}

