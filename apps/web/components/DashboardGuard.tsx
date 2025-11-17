"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { trpc } from "../src/lib/trpc";

/**
 * Dashboard Guard Component
 * - Redirects to /sign-in if not logged in
 * - Redirects to /onboarding if onboarding not complete
 */
export function DashboardGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();
  const { data: userData, isLoading } = trpc.user.me.useQuery(undefined, {
    enabled: isSignedIn && isLoaded
  });

  useEffect(() => {
    if (!isLoaded) return;

    // If not signed in, redirect to sign-in
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }

    // If user data is loaded and onboarding is not complete, redirect to onboarding
    if (!isLoading && userData && !userData.onboardingComplete) {
      router.push("/onboarding/choose-role");
      return;
    }
  }, [isSignedIn, isLoaded, isLoading, userData, router]);

  // Show loading state while checking auth
  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not signed in or onboarding not complete, show nothing (redirecting)
  if (!isSignedIn || (userData && !userData.onboardingComplete)) {
    return null;
  }

  return <>{children}</>;
}

