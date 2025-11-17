"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "../../../src/lib/trpc";

export default function ChooseRolePage() {
  const router = useRouter();
  const utils = trpc.useUtils();

  // Get current user
  const { data: user, isLoading: isLoadingUser } = trpc.user.me.useQuery();

  // Set role mutation
  const setRole = trpc.user.setRole.useMutation({
    onSuccess: (updatedUser) => {
      // Invalidate queries
      utils.user.me.invalidate();

      // Redirect based on role and onboarding status
      if (updatedUser.onboardingComplete) {
        if (updatedUser.role === "INVESTOR") {
          router.push("/investor/dashboard");
        } else if (updatedUser.role === "VISIONARY") {
          router.push("/visionary/dashboard");
        } else {
          router.push("/dashboard");
        }
      } else {
        // If onboarding not complete, redirect to appropriate setup page
        if (updatedUser.role === "INVESTOR") {
          router.push("/investor/setup");
        } else if (updatedUser.role === "VISIONARY") {
          router.push("/visionary/setup");
        }
      }
    },
    onError: (error) => {
      console.error("Error setting role:", error);
      alert(`Error: ${error.message}`);
    }
  });

  // If user already has a role and onboarding is complete, redirect to their dashboard
  useEffect(() => {
    if (user?.onboardingComplete && user?.role) {
      if (user.role === "INVESTOR") {
        router.push("/investor/dashboard");
      } else if (user.role === "VISIONARY") {
        router.push("/visionary/dashboard");
      } else {
        router.push("/dashboard");
      }
    } else if (user?.role && !user.onboardingComplete) {
      // User has role but onboarding not complete - redirect to setup
      if (user.role === "INVESTOR") {
        router.push("/investor/setup");
      } else if (user.role === "VISIONARY") {
        router.push("/visionary/setup");
      }
    }
  }, [user, router]);

  const handleRoleSelect = (role: "INVESTOR" | "VISIONARY") => {
    setRole.mutate({ role });
  };

  // Show loading state
  if (isLoadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user has role, show loading while redirecting
  if (user?.role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-emerald-100 to-emerald-200 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Welcome to Ummati
          </h1>
          <p className="text-xl text-gray-700 mb-2">
            Choose your role to get started
          </p>
          <p className="text-gray-600">
            Connect with like-minded investors and visionary founders
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Investor Card */}
          <button
            onClick={() => handleRoleSelect("INVESTOR")}
            disabled={setRole.isPending}
            className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border-2 border-emerald-200 hover:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="text-center">
              <div className="mb-6">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-full flex items-center justify-center text-4xl shadow-lg">
                  💼
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                I am an Investor
              </h2>
              <p className="text-gray-600 mb-4">
                Discover and invest in halal-aligned startups that match your values
              </p>
              <div className="flex items-center justify-center gap-2 text-emerald-600 font-semibold">
                {setRole.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
                    <span>Setting...</span>
                  </>
                ) : (
                  <>
                    <span>Get Started</span>
                    <svg
                      className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </>
                )}
              </div>
            </div>
          </button>

          {/* Visionary Card */}
          <button
            onClick={() => handleRoleSelect("VISIONARY")}
            disabled={setRole.isPending}
            className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border-2 border-emerald-200 hover:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="text-center">
              <div className="mb-6">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-amber-500 to-amber-700 rounded-full flex items-center justify-center text-4xl shadow-lg">
                  ✨
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                I am a Visionary
              </h2>
              <p className="text-gray-600 mb-4">
                Showcase your startup and connect with investors who share your vision
              </p>
              <div className="flex items-center justify-center gap-2 text-emerald-600 font-semibold">
                {setRole.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
                    <span>Setting...</span>
                  </>
                ) : (
                  <>
                    <span>Get Started</span>
                    <svg
                      className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </>
                )}
              </div>
            </div>
          </button>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            You can change your role later in your profile settings
          </p>
        </div>
      </div>
    </div>
  );
}

