"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "../../../../src/lib/trpc";

export default function InvestorHalalPledgePage() {
  const router = useRouter();
  const utils = trpc.useUtils();

  // Check if investor already accepted terms
  const { data: profile, isLoading } = trpc.investor.getMyProfile.useQuery();

  const [declarationAccepted, setDeclarationAccepted] = useState(false);

  const mutation = trpc.investor.acceptHalalTerms.useMutation({
    onSuccess: () => {
      utils.investor.getMyProfile.invalidate();
      // Redirect to investor setup
      router.push("/investor/setup");
    },
    onError: (error) => {
      console.error("Error accepting halal terms:", error);
      alert(`Error: ${error.message}`);
    }
  });

  useEffect(() => {
    // If already accepted, redirect to setup
    if (profile?.hasAcceptedHalalTerms) {
      router.push("/investor/setup");
    }
  }, [profile, router]);

  const handleAccept = () => {
    if (!declarationAccepted) {
      alert("Please accept the halal compliance pledge to continue");
      return;
    }

    mutation.mutate();
  };

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

  // If already accepted, show redirecting message
  if (profile?.hasAcceptedHalalTerms) {
    return (
      <div className="min-h-screen bg-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">✅</div>
          <p className="text-gray-600">Redirecting to setup...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-emerald-50 py-8">
      <div className="max-w-3xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Halal Compliance Pledge
          </h1>
          <p className="text-gray-600">
            As an investor on Ummati, we ask you to commit to ethical investment practices
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-emerald-100">
          {/* Icon */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full mb-4">
              <span className="text-4xl">🤲</span>
            </div>
          </div>

          {/* Pledge Text */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg p-6 border border-emerald-200">
              <p className="text-lg text-gray-800 leading-relaxed text-center">
                I affirm that I will not pressure founders into non-halal revenue paths,
                riba/usury-based models, gambling-based monetization, or unethical growth
                practices.
              </p>
            </div>
          </div>

          {/* Additional Context */}
          <div className="mb-8 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              What This Means
            </h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <span className="text-emerald-600 mt-1">✓</span>
                <span>
                  You commit to supporting founders in building halal-compliant businesses
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-600 mt-1">✓</span>
                <span>
                  You will not encourage or require interest-based (riba) revenue models
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-600 mt-1">✓</span>
                <span>
                  You will not pressure startups into gambling, adult content, or other
                  prohibited monetization strategies
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-600 mt-1">✓</span>
                <span>
                  You will respect Islamic principles in all investment discussions and
                  decisions
                </span>
              </li>
            </ul>
          </div>

          {/* Declaration Checkbox */}
          <div className="mb-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={declarationAccepted}
                onChange={(e) => setDeclarationAccepted(e.target.checked)}
                className="mt-1 w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-700">
                  I understand and agree to the Halal Compliance Pledge
                  <span className="text-red-500 ml-1">*</span>
                </span>
              </div>
            </label>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              onClick={handleAccept}
              disabled={mutation.isPending || !declarationAccepted}
              className="flex-1 bg-emerald-600 text-white px-6 py-4 rounded-lg font-semibold text-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {mutation.isPending ? "Processing..." : "I Agree, Continue"}
            </button>
          </div>

          {/* Footer Note */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              By continuing, you acknowledge that you have read and understood the Halal
              Compliance Pledge
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

