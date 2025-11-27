"use client";

import Link from "next/link";
import { trpc } from "../../src/lib/trpc";

export function OverviewHeader() {
  const { data: profile, isLoading: isLoadingProfile } =
    trpc.visionary.getMyProfile.useQuery();
  const { data: stats, isLoading: isLoadingStats } =
    trpc.visionaryDashboard.getOverviewStats.useQuery();

  if (isLoadingProfile || isLoadingStats) {
    return (
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl shadow-lg p-6 animate-pulse">
        <div className="h-8 bg-emerald-500/30 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-emerald-500/30 rounded w-1/2 mb-4"></div>
        <div className="h-2 bg-emerald-500/30 rounded"></div>
      </div>
    );
  }

  const startupName = profile?.startupName || "Your Startup";
  const completeness = stats?.profileCompleteness || 0;

  return (
    <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl shadow-lg p-6 text-white">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2">{startupName}</h1>
          <p className="text-emerald-100 text-sm">
            Track your startup&apos;s journey and investor interest
          </p>
        </div>
        <Link
          href="/visionary/setup"
          className="bg-white text-emerald-700 px-4 py-2 rounded-lg font-semibold hover:bg-emerald-50 transition-colors shadow-md"
        >
          Edit Profile
        </Link>
      </div>

      {/* Profile Completeness */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-emerald-100">
            Profile Completeness
          </span>
          <span className="text-lg font-bold">{completeness}%</span>
        </div>
        <div className="w-full bg-emerald-800/50 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${completeness}%` }}
          />
        </div>
        {completeness < 100 && (
          <p className="text-xs text-emerald-200 mt-2">
            Complete your profile to increase visibility and attract more investors
          </p>
        )}
      </div>
    </div>
  );
}

