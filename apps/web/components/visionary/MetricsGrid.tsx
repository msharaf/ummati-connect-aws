"use client";

import { trpc } from "../../src/lib/trpc";

interface MetricCardProps {
  icon: string;
  label: string;
  value: number | string;
  color: string;
  bgColor: string;
}

function MetricCard({ icon, label, value, color, bgColor }: MetricCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-emerald-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
        </div>
        <div className={`${bgColor} p-3 rounded-lg`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );
}

export function MetricsGrid() {
  const { data: stats, isLoading, error } =
    trpc.visionaryDashboard.getOverviewStats.useQuery();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl shadow-sm p-6 border border-emerald-100 animate-pulse"
          >
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
        <p className="font-semibold">Error loading metrics</p>
        <p className="text-sm mt-1">{error.message}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-700">
        <p>No metrics available. Complete your profile to start tracking analytics.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        icon="👁️"
        label="Total Profile Views"
        value={stats.totalViews}
        color="text-emerald-600"
        bgColor="bg-emerald-50"
      />
      <MetricCard
        icon="⭐"
        label="Shortlists"
        value={stats.totalShortlists}
        color="text-amber-600"
        bgColor="bg-amber-50"
      />
      <MetricCard
        icon="✨"
        label="Total Matches"
        value={stats.totalMatches}
        color="text-amber-600"
        bgColor="bg-amber-50"
      />
      <MetricCard
        icon="💬"
        label="Total Messages"
        value={stats.totalMessages}
        color="text-gray-600"
        bgColor="bg-gray-50"
      />
    </div>
  );
}

