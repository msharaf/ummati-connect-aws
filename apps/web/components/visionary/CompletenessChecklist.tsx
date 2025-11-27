"use client";

import Link from "next/link";
import { trpc } from "../../src/lib/trpc";

const fieldLabels: Record<string, string> = {
  startupName: "Startup Name",
  sector: "Sector",
  startupStage: "Startup Stage",
  description: "Description",
  pitch: "Pitch",
  location: "Location",
  fundingAsk: "Funding Ask",
  websiteUrl: "Website URL",
  barakahScore: "Barakah Score"
};

const fieldDescriptions: Record<string, string> = {
  startupName: "Add your startup name",
  sector: "Select your industry sector",
  startupStage: "Choose your current stage",
  description: "Add a short description (max 500 characters)",
  pitch: "Add a detailed pitch (max 2000 characters)",
  location: "Add your location",
  fundingAsk: "Specify your funding requirements",
  websiteUrl: "Add your website URL",
  barakahScore: "Set your Barakah score (1-10)"
};

export function CompletenessChecklist() {
  const { data: completeness, isLoading } =
    trpc.visionaryDashboard.getProfileCompleteness.useQuery();

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-emerald-100 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!completeness) {
    return null;
  }

  const isComplete = completeness.completeness === 100;
  const missingFields = completeness.missingFields || [];

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-emerald-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-charcoal">Profile Completeness</h2>
        <span
          className={`text-2xl font-bold ${
            isComplete ? "text-emerald-600" : "text-amber-600"
          }`}
        >
          {completeness.completeness}%
        </span>
      </div>

      {isComplete ? (
        <div className="text-center py-6">
          <div className="text-4xl mb-2">🎉</div>
          <p className="text-lg font-semibold text-emerald-600 mb-1">
            Profile Complete!
          </p>
          <p className="text-sm text-gray-600">
            Your profile is fully set up and ready to attract investors
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-600 mb-4">
            Complete these fields to improve your profile visibility:
          </p>
          <div className="space-y-2 mb-4">
            {missingFields.map((field) => (
              <div
                key={field}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {fieldLabels[field] || field}
                  </p>
                  <p className="text-xs text-gray-500">
                    {fieldDescriptions[field] || "Add this field"}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <Link
            href="/visionary/setup"
            className="block w-full text-center bg-emerald-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
          >
            Complete Profile →
          </Link>
        </>
      )}
    </div>
  );
}

