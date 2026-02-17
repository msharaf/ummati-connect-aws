"use client";

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { trpc } from "../../../src/lib/trpc";
import { MetricsGrid } from "../../../src/features/visionary/MetricsGrid";
import { ActivityList } from "../../../src/features/visionary/ActivityList";
import { ProfileCompletionCard } from "../../../src/features/visionary/ProfileCompletionCard";

export default function VisionaryDashboardScreen() {
  const router = useRouter();

  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log("[Visionary] Dashboard screen rendered");
  }

  // Fetch profile for startup name
  const { data: profile, isLoading: isLoadingProfile } =
    trpc.visionary.getMyProfile.useQuery();

  // Fetch stats for completeness
  const { data: stats, isLoading: isLoadingStats, refetch: refetchStats } =
    trpc.visionaryDashboard.getOverviewStats.useQuery();

  const { refetch: refetchActivity } =
    trpc.visionaryDashboard.getRecentActivity.useQuery();

  const { refetch: refetchCompleteness } =
    trpc.visionaryDashboard.getProfileCompleteness.useQuery();

  const handleRefresh = () => {
    refetchStats();
    refetchActivity();
    refetchCompleteness();
  };

  const startupName = profile?.startupName || "Your Startup";
  const completeness = stats?.profileCompleteness || 0;

  return (
    <ScrollView
      className="flex-1 bg-emerald-50"
      refreshControl={
        <RefreshControl
          refreshing={isLoadingStats || isLoadingProfile}
          onRefresh={handleRefresh}
          tintColor="#047857"
        />
      }
    >
      {/* Header Banner */}
      <LinearGradient
        colors={["#047857", "#059669"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="px-4 py-6 mb-4"
      >
        <View className="flex-row items-start justify-between mb-4">
          <View className="flex-1">
            <Text className="text-2xl font-bold text-white mb-1">✅ VISIONARY HOME LOADED</Text>
            <Text className="text-sm font-semibold text-yellow-300 mb-1">{startupName}</Text>
            <Text className="text-emerald-100 text-xs">
              Track your startup&apos;s journey and investor interest
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/visionary/setup")}
            className="bg-white px-4 py-2 rounded-lg"
            activeOpacity={0.8}
          >
            <Text className="text-emerald-700 font-semibold text-sm">Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Completeness Progress */}
        <View>
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sm font-medium text-emerald-100">
              Profile Completeness
            </Text>
            <Text className="text-base font-bold text-white">
              {isLoadingStats ? "..." : `${completeness}%`}
            </Text>
          </View>
          <View className="w-full bg-emerald-800/50 rounded-full h-2 overflow-hidden">
            <View
              className="bg-yellow-400 h-full rounded-full"
              style={{ width: `${completeness}%` }}
            />
          </View>
          {completeness < 100 && (
            <Text className="text-xs text-emerald-200 mt-2">
              Complete your profile to increase visibility
            </Text>
          )}
        </View>
      </LinearGradient>

      {/* Content */}
      <View className="px-4 pb-6">
        {/* Key Metrics */}
        <View className="mb-6">
          <Text className="text-xl font-bold text-gray-900 mb-3">Key Metrics</Text>
          <MetricsGrid />
        </View>

        {/* Recent Activity */}
        <View className="mb-6">
          <ActivityList />
        </View>

        {/* Profile Completeness Checklist */}
        <View className="mb-6">
          <ProfileCompletionCard />
        </View>
      </View>
    </ScrollView>
  );
}

