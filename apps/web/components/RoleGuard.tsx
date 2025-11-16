"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { trpc } from "../src/lib/trpc";

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRole?: "INVESTOR" | "VISIONARY";
}

export function RoleGuard({ children, requiredRole }: RoleGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user, isLoading } = trpc.user.getMe.useQuery();

  useEffect(() => {
    if (isLoading) return;

    // If user has no role, redirect to onboarding
    if (!user?.role) {
      // Only redirect if not already on onboarding page
      if (!pathname.startsWith("/onboarding")) {
        router.push("/onboarding/choose-role");
      }
      return;
    }

    // If role is required and doesn't match, redirect
    if (requiredRole && user.role !== requiredRole) {
      // Redirect to appropriate dashboard
      if (user.role === "INVESTOR") {
        router.push("/investor/dashboard");
      } else if (user.role === "VISIONARY") {
        router.push("/visionary/dashboard");
      }
      return;
    }
  }, [user, isLoading, requiredRole, router, pathname]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user has no role, show loading while redirecting
  if (!user?.role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to role selection...</p>
        </div>
      </div>
    );
  }

  // If role doesn't match required role, show loading while redirecting
  if (requiredRole && user.role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

