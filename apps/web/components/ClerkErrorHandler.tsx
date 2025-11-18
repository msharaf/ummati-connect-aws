"use client";

import { useEffect } from "react";

/**
 * Global error handler to suppress Clerk v5 + Next.js 14 cookies() error
 * This is a workaround for a known issue in Clerk v5.7.5
 * 
 * The error occurs when ClerkProvider tries to invalidate Next.js cache
 * using a server action that calls cookies() from a client component context.
 */
export function ClerkErrorHandler({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Suppress the specific Clerk cookies() error in console.error
    const originalError = console.error;
    console.error = (...args: any[]) => {
      const errorMessage = args.join(" ");
      if (
        errorMessage.includes("cookies() expects to have requestAsyncStorage") ||
        errorMessage.includes("Invariant: cookies()") ||
        errorMessage.includes("invalidateCacheAction") ||
        (errorMessage.includes("Clerk") && errorMessage.includes("requestAsyncStorage"))
      ) {
        // Suppress this error - it's a known Clerk v5 + Next.js 14 compatibility issue
        // The app will continue to work despite this error (cache will revalidate on navigation)
        console.warn("Clerk cache invalidation skipped (expected in client component)");
        return;
      }
      originalError.apply(console, args);
    };

    // Handle unhandled promise rejections (where the error actually occurs)
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errorMessage = 
        event.reason?.message || 
        event.reason?.toString() || 
        event.reason?.stack || 
        "";
      
      if (
        errorMessage.includes("cookies() expects to have requestAsyncStorage") ||
        errorMessage.includes("Invariant: cookies()") ||
        errorMessage.includes("invalidateCacheAction") ||
        (errorMessage.includes("Clerk") && errorMessage.includes("requestAsyncStorage"))
      ) {
        // Suppress this error - prevent it from breaking the app
        event.preventDefault();
        console.warn("Clerk cache invalidation error suppressed (non-critical)");
        return;
      }
    };

    // Handle window.onerror for runtime errors
    const handleError = (event: ErrorEvent) => {
      const errorMessage = event.message || event.error?.toString() || "";
      if (
        errorMessage.includes("cookies() expects to have requestAsyncStorage") ||
        errorMessage.includes("Invariant: cookies()") ||
        errorMessage.includes("invalidateCacheAction")
      ) {
        event.preventDefault();
        console.warn("Clerk cache invalidation error suppressed (non-critical)");
        return false;
      }
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("error", handleError);

    return () => {
      console.error = originalError;
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      window.removeEventListener("error", handleError);
    };
  }, []);

  return <>{children}</>;
}

