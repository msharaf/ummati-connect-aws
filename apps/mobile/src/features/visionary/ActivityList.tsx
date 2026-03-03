"use client";

import { View, Text, FlatList, ActivityIndicator } from "react-native";
import { formatDistanceToNow } from "date-fns";
import { trpc } from "../../lib/trpc";

interface ActivityItem {
  id: string;
  type: "profile_view" | "shortlist";
  investor: { id: string; name: string | null; avatarUrl: string | null };
  createdAt: Date;
  message: string;
}

function ActivityItemComponent({ item }: { item: ActivityItem }) {
  const getActivityConfig = () => {
    switch (item.type) {
      case "profile_view":
        return {
          icon: "👁️",
          text: item.message,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200"
        };
      case "shortlist":
        return {
          icon: "⭐",
          text: item.message,
          color: "text-amber-600",
          bgColor: "bg-amber-50",
          borderColor: "border-amber-200"
        };
      default:
        return {
          icon: "📌",
          text: item.message,
          color: "text-gray-600",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200"
        };
    }
  };

  const config = getActivityConfig();
  const createdAtDate =
    item.createdAt instanceof Date
      ? item.createdAt
      : new Date(item.createdAt);
  const timeAgo = formatDistanceToNow(createdAtDate, { addSuffix: true });

  const content = (
    <View
      className={`flex-row items-start gap-3 p-3 rounded-lg border ${config.borderColor} ${config.bgColor}`}
    >
      <View className={`${config.bgColor} p-2 rounded-lg`}>
        <Text className="text-lg">{config.icon}</Text>
      </View>
      <View className="flex-1 min-w-0">
        <Text className={`font-medium text-sm ${config.color}`}>{config.text}</Text>
        <Text className="text-xs text-gray-500 mt-1">{timeAgo}</Text>
      </View>
    </View>
  );

  return content;
}

export function ActivityList() {
  const { data: activities, isLoading, error } =
    trpc.visionaryDashboard.getRecentActivity.useQuery();

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
        <Text className="font-semibold text-red-700">Error loading activity</Text>
        <Text className="text-sm text-red-600 mt-1">{error.message}</Text>
      </View>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <View className="bg-white rounded-lg shadow-sm p-6 border border-emerald-100">
        <Text className="text-center text-gray-500 mb-2">No activity yet</Text>
        <Text className="text-center text-xs text-gray-400">
          Complete your profile and start connecting with investors
        </Text>
      </View>
    );
  }

  return (
    <View className="bg-white rounded-lg shadow-sm p-4 border border-emerald-100">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-lg font-semibold text-gray-900">Recent Activity</Text>
        <Text className="text-xs text-gray-500">
          {activities.length} {activities.length === 1 ? "event" : "events"}
        </Text>
      </View>
      <FlatList
        data={activities}
        keyExtractor={(item, index) =>
          `${item.type}-${(item.createdAt as Date).getTime?.() ?? new Date(item.createdAt).getTime()}-${index}`
        }
        renderItem={({ item }) => <ActivityItemComponent item={item} />}
        ItemSeparatorComponent={() => <View className="h-2" />}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

