"use client";

import { View, Text, ActivityIndicator } from "react-native";
import { trpc } from "../../lib/trpc";

interface MetricCardProps {
  icon: string;
  label: string;
  value: number | string;
  color: string;
  bgColor: string;
}

function MetricCard({ icon, label, value, color, bgColor }: MetricCardProps) {
  return (
    <View className={`bg-white rounded-lg shadow-sm p-4 border border-emerald-100 ${bgColor}`}>
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-xs text-gray-600">{label}</Text>
        <View className="bg-emerald-50 p-2 rounded-lg">
          <Text className="text-lg">{icon}</Text>
        </View>
      </View>
      <Text className={`text-2xl font-bold ${color}`}>{value}</Text>
    </View>
  );
}

export function MetricsGrid() {
  const { data: stats, isLoading, error } =
    trpc.visionaryDashboard.getOverviewStats.useQuery();

  if (isLoading) {
    return (
      <View className="flex-row justify-center py-4">
        <ActivityIndicator size="small" color="#047857" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="bg-red-50 border border-red-200 rounded-lg p-4">
        <Text className="font-semibold text-red-700">Error loading metrics</Text>
        <Text className="text-sm text-red-600 mt-1">{error.message}</Text>
      </View>
    );
  }

  if (!stats) {
    return (
      <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <Text className="text-yellow-700">
          No metrics available. Complete your profile to start tracking analytics.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-row flex-wrap" style={{ gap: 12 }}>
      <View style={{ flex: 1, minWidth: "45%" }}>
        <MetricCard
          icon="👁️"
          label="Profile Views"
          value={stats.totalViews}
          color="text-emerald-600"
          bgColor=""
        />
      </View>
      <View style={{ flex: 1, minWidth: "45%" }}>
        <MetricCard
          icon="⭐"
          label="Shortlists"
          value={stats.totalShortlists}
          color="text-emerald-600"
          bgColor=""
        />
      </View>
      <View style={{ flex: 1, minWidth: "45%" }}>
        <MetricCard
          icon="✨"
          label="Matches"
          value={stats.totalMatches}
          color="text-amber-600"
          bgColor=""
        />
      </View>
      <View style={{ flex: 1, minWidth: "45%" }}>
        <MetricCard
          icon="💬"
          label="Messages"
          value={stats.totalMessages}
          color="text-emerald-600"
          bgColor=""
        />
      </View>
    </View>
  );
}

