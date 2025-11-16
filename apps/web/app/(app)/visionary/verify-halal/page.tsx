"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { HalalVerificationForm } from "../../../../components/visionary/HalalVerificationForm";
import { trpc } from "../../../../src/lib/trpc";

export default function VerifyHalalPage() {
  const router = useRouter();
  const [verificationStatus, setVerificationStatus] = useState<
    "approved" | "flagged" | "rejected" | null
  >(null);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);

  // Check if user already has a profile with verification
  const { data: profile } = trpc.visionary.getMyProfile.useQuery();

  useEffect(() => {
    if (profile) {
      if (profile.isApproved) {
        // Already approved, redirect to setup
        router.push("/visionary/setup");
      } else if (profile.riskCategory === "HARAM") {
        // Already rejected
        setVerificationStatus("rejected");
        setRejectionReason(profile.rejectionReason || "Industry is universally prohibited");
      } else if (profile.isFlagged) {
        // Already flagged
        setVerificationStatus("flagged");
      }
    }
  }, [profile, router]);


  // If already approved, show redirecting message
  if (profile?.isApproved) {
    return (
      <div className="min-h-screen bg-emerald-50 py-8">
        <div className="max-w-3xl mx-auto p-6">
          <div className="bg-white rounded-xl shadow-sm p-8 border border-emerald-100 text-center">
            <div className="text-4xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Verification Complete
            </h1>
            <p className="text-gray-600 mb-4">Redirecting to profile setup...</p>
          </div>
        </div>
      </div>
    );
  }

  // If rejected, show rejection message
  if (verificationStatus === "rejected") {
    return (
      <div className="min-h-screen bg-emerald-50 py-8">
        <div className="max-w-3xl mx-auto p-6">
          <div className="bg-white rounded-xl shadow-sm p-8 border border-red-200">
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">❌</div>
              <h1 className="text-2xl font-bold text-red-700 mb-2">
                Verification Rejected
              </h1>
              <p className="text-gray-600">
                Unfortunately, your startup does not meet our halal compliance requirements.
              </p>
            </div>

            {rejectionReason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-red-800 mb-2">Reason:</h3>
                <p className="text-sm text-red-700">{rejectionReason}</p>
              </div>
            )}

            <div className="text-center">
              <button
                onClick={() => router.push("/visionary/dashboard")}
                className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If flagged, show pending review message
  if (verificationStatus === "flagged") {
    return (
      <div className="min-h-screen bg-emerald-50 py-8">
        <div className="max-w-3xl mx-auto p-6">
          <div className="bg-white rounded-xl shadow-sm p-8 border border-amber-200">
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">⏳</div>
              <h1 className="text-2xl font-bold text-amber-700 mb-2">
                Pending Review
              </h1>
              <p className="text-gray-600">
                Your startup is pending manual review by our halal compliance team.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-amber-800">
                Your profile has been flagged for additional review. Our team will review your
                application and notify you once a decision has been made. This process typically
                takes 1-3 business days.
              </p>
            </div>

            <div className="text-center">
              <button
                onClick={() => router.push("/visionary/dashboard")}
                className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show the verification form
  return (
    <div className="min-h-screen bg-emerald-50 py-8">
      <div className="max-w-3xl mx-auto space-y-6 p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Halal Compliance Verification
          </h1>
          <p className="text-gray-600">
            Complete this questionnaire to verify your startup&apos;s halal compliance
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl shadow-lg p-6 text-white">
          <h2 className="text-xl font-semibold mb-2">Why This Matters</h2>
          <p className="text-emerald-100 text-sm">
            Ummati is committed to connecting investors with halal-compliant startups. This
            verification ensures that all startups on our platform align with Islamic principles
            and values. Your responses will be reviewed to determine your startup&apos;s
            compliance status.
          </p>
        </div>

        {/* Form */}
        <HalalVerificationForm />
      </div>
    </div>
  );
}

