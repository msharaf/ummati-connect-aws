"use client";

import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Linking
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { trpc } from "../../../src/lib/trpc";

export default function VisionaryDetailModal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [isShortlisting, setIsShortlisting] = useState(false);
  const utils = trpc.useUtils();

  const { data: profile, isLoading } = trpc.investor.getVisionaryDetails.useQuery(
    { visionaryId: id! },
    { enabled: Boolean(id) }
  );

  const shortlist = trpc.investor.shortlistVisionary.useMutation({
    onSuccess: () => {
      utils.investor.getShortlist.invalidate();
      utils.investor.getVisionaryDetails.invalidate({ visionaryId: id! });
      utils.investor.browseVisionaries.invalidate();
    },
    onSettled: () => {
      setIsShortlisting(false);
    }
  });

  const handleShortlist = () => {
    if (!id) return;
    setIsShortlisting(true);
    shortlist.mutate({ visionaryId: id });
  };

  const handleGoToSwipe = () => {
    router.push("/(tabs)/swipe");
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#047857" />
        <Text className="mt-4 text-gray-600">Loading profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-4">
        <Text className="text-lg font-semibold text-gray-900 mb-2">Profile not found</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-emerald-600 font-semibold">Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const displayName = profile.name || "Unknown Founder";

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-emerald-600 px-4 py-3 flex-row items-center justify-between">
        <Text className="text-xl font-bold text-white">Profile Details</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-white text-lg font-semibold">✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-4">
          {/* Avatar and Name */}
          <View className="items-center mb-6">
            <View className="w-24 h-24 rounded-full overflow-hidden bg-emerald-200 mb-3">
              {profile.avatarUrl ? (
                <Image
                  source={{ uri: profile.avatarUrl }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              ) : (
                <View className="w-full h-full flex items-center justify-center bg-emerald-300">
                  <Text className="text-emerald-700 font-semibold text-3xl">
                    {displayName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <Text className="text-2xl font-bold text-gray-900 mb-1">
              {profile.startupName}
            </Text>
            <Text className="text-gray-600">{displayName}</Text>
          </View>

          {/* Badges */}
          <View className="flex-row flex-wrap gap-2 mb-6 justify-center">
            <View className="bg-emerald-100 px-3 py-1.5 rounded-full">
              <Text className="text-sm text-emerald-700 font-medium">{profile.sector}</Text>
            </View>
            <View className="bg-emerald-50 px-3 py-1.5 rounded-full">
              <Text className="text-sm text-emerald-600 font-medium">
                {profile.startupStage}
              </Text>
            </View>
            {profile.halalCategory && (
              <View className="bg-yellow-50 px-3 py-1.5 rounded-full">
                <Text className="text-sm text-yellow-700 font-medium">
                  {profile.halalCategory}
                </Text>
              </View>
            )}
            {profile.barakahScore && (
              <View className="bg-yellow-100 px-3 py-1.5 rounded-full">
                <Text className="text-sm text-yellow-700 font-medium">
                  Barakah: {profile.barakahScore}/10
                </Text>
              </View>
            )}
          </View>

          {/* Description */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-2">About</Text>
            <Text className="text-gray-700 leading-6">{profile.description}</Text>
          </View>

          {/* Details Grid */}
          <View className="bg-gray-50 rounded-xl p-4 mb-6">
            {profile.location && (
              <View className="mb-4">
                <Text className="text-sm text-gray-600 mb-1">Location</Text>
                <Text className="text-gray-900 font-medium">{profile.location}</Text>
              </View>
            )}
            {profile.fundingAsk && (
              <View className="mb-4">
                <Text className="text-sm text-gray-600 mb-1">Funding Ask</Text>
                <Text className="text-gray-900 font-medium">
                  ${profile.fundingAsk.toLocaleString()}
                </Text>
              </View>
            )}
            {profile.websiteUrl && (
              <View>
                <Text className="text-sm text-gray-600 mb-1">Website</Text>
                <TouchableOpacity
                  onPress={() => Linking.openURL(profile.websiteUrl!)}
                  className="flex-row items-center"
                >
                  <Text className="text-emerald-600 font-medium underline">
                    {profile.websiteUrl}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Barakah Score Details */}
          {profile.barakahScore && (
            <View className="bg-yellow-50 rounded-xl p-4 mb-6 border border-yellow-200">
              <Text className="text-lg font-semibold text-yellow-800 mb-2">
                Barakah Score: {profile.barakahScore}/10
              </Text>
              {profile.barakahNotes && (
                <Text className="text-yellow-700 text-sm">{profile.barakahNotes}</Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Actions */}
      <View className="border-t border-gray-200 p-4 bg-white">
        <TouchableOpacity
          onPress={handleShortlist}
          disabled={isShortlisting}
          className={`mb-3 px-4 py-3 rounded-lg font-semibold ${
            profile.isShortlisted
              ? "bg-yellow-100"
              : "bg-emerald-50"
          } disabled:opacity-50`}
        >
          <Text
            className={`text-center ${
              profile.isShortlisted ? "text-yellow-700" : "text-emerald-700"
            }`}
          >
            {isShortlisting
              ? "Loading..."
              : profile.isShortlisted
              ? "⭐ Shortlisted"
              : "⭐ Add to Shortlist"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleGoToSwipe}
          className="bg-emerald-600 px-4 py-3 rounded-lg"
        >
          <Text className="text-white font-semibold text-center">Go to Swipe Mode</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

