"use client";

import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Image } from "react-native";
import { useRouter } from "expo-router";
import { trpc } from "../../lib/trpc";
import type { StartupStage } from "@ummati/db/types";

export type HalalCategoryFilter = "halal" | "grey" | "forbidden" | null;

interface VisionaryListProps {
  filters: {
    sector: string | null;
    location: string | null;
    halalCategory: HalalCategoryFilter;
    minBarakah: number;
    stage: StartupStage | null;
    search: string | null;
  };
}

export function VisionaryList({ filters }: VisionaryListProps) {
  const router = useRouter();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = trpc.investor.browseVisionaries.useInfiniteQuery(
    {
      sector: filters.sector,
      location: filters.location,
      halalCategory: filters.halalCategory ?? undefined,
      minBarakah: filters.minBarakah,
      stage: filters.stage,
      search: filters.search,
      limit: 20
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined
    }
  );

  const profiles = data?.pages.flatMap((page) => page.profiles) ?? [];

  const handleSelectProfile = (profileId: string) => {
    router.push(`/(modals)/visionary/${profileId}`);
  };

  const renderProfile = ({ item }: { item: any }) => {
    const displayName = item.name || "Unknown Founder";

    return (
      <TouchableOpacity
        onPress={() => handleSelectProfile(item.id)}
        className="bg-white border-b border-gray-200 p-4 active:bg-gray-50"
      >
        <View className="flex-row items-start gap-3">
          {/* Avatar */}
          <View className="w-16 h-16 rounded-full overflow-hidden bg-emerald-200 flex-shrink-0">
            {item.avatarUrl ? (
              <Image
                source={{ uri: item.avatarUrl }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-full flex items-center justify-center bg-emerald-300">
                <Text className="text-emerald-700 font-semibold text-xl">
                  {displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          {/* Content */}
          <View className="flex-1 min-w-0">
            <Text className="font-semibold text-gray-900 text-lg mb-1" numberOfLines={1}>
              {item.startupName}
            </Text>
            <Text className="text-sm text-gray-600 mb-2" numberOfLines={1}>
              {displayName}
            </Text>

            {/* Badges */}
            <View className="flex-row flex-wrap gap-2 mb-2">
              <View className="bg-emerald-100 px-2 py-1 rounded-full">
                <Text className="text-xs text-emerald-700 font-medium">{item.sector}</Text>
              </View>
              <View className="bg-emerald-50 px-2 py-1 rounded-full">
                <Text className="text-xs text-emerald-600 font-medium">{item.stage}</Text>
              </View>
              {item.barakahScore && (
                <View className="bg-yellow-100 px-2 py-1 rounded-full">
                  <Text className="text-xs text-yellow-700 font-medium">
                    Barakah: {item.barakahScore}/10
                  </Text>
                </View>
              )}
            </View>

            {/* Description */}
            <Text className="text-sm text-gray-600 mb-2" numberOfLines={2}>
              {item.description}
            </Text>

            {/* Footer */}
            <View className="flex-row items-center justify-between">
              <Text className="text-xs text-gray-500">
                {item.location || "Location not specified"}
              </Text>
              {item.fundingAsk && (
                <Text className="text-xs font-medium text-emerald-600">
                  ${(item.fundingAsk / 1000).toFixed(0)}k ask
                </Text>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center py-8">
        <ActivityIndicator size="large" color="#047857" />
        <Text className="mt-4 text-gray-600">Loading visionaries...</Text>
      </View>
    );
  }

  if (profiles.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-8 px-4">
        <Text className="text-lg font-semibold text-gray-900 mb-2">
          No visionaries found
        </Text>
        <Text className="text-sm text-gray-600 text-center">
          Try adjusting your filters or check back later
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={profiles}
      renderItem={renderProfile}
      keyExtractor={(item) => item.id}
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      }}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        isFetchingNextPage ? (
          <View className="py-4">
            <ActivityIndicator size="small" color="#047857" />
          </View>
        ) : null
      }
      contentContainerStyle={{ paddingBottom: 16 }}
    />
  );
}

