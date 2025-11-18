"use client";

import { ProfileSetupForm } from "../../../../components/visionary/ProfileSetupForm";
import { trpc } from "../../../../src/lib/trpc";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { BackButtonWeb } from "../../../../components/BackButtonWeb";

export default function VisionarySetupPage() {
  const router = useRouter();
  
  // Check if profile is approved (halal verification passed)
  const { data: profile, isLoading } = trpc.visionary.getMyProfile.useQuery();

  useEffect(() => {
    if (profile && !profile.isApproved && profile.riskCategory !== "HALAL") {
      // If not approved, redirect to halal verification
      if (profile.riskCategory === "HARAM") {
        router.push("/visionary/verify-halal");
      } else if (profile.isFlagged) {
        router.push("/visionary/verify-halal");
      } else if (!profile.riskCategory) {
        // No verification yet
        router.push("/visionary/verify-halal");
      }
    }
  }, [profile, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-emerald-50 py-8 relative">
      {/* Back Button */}
      <div className="absolute top-4 left-4 z-10">
        <BackButtonWeb fallbackRoute="/visionary/dashboard" />
      </div>
      
      <div className="max-w-3xl mx-auto space-y-6 p-6">
        {/* Header */}
        <div className="text-center mb-8 mt-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {profile ? "Update Your Profile" : "Create Your Visionary Profile"}
          </h1>
          <p className="text-gray-600">
            Share your startup story and connect with investors who share your values
          </p>
        </div>

        {/* Form */}
        <ProfileSetupForm />
      </div>
    </div>
  );
}

