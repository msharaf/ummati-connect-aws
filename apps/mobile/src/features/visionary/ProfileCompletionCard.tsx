"use client";

import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { trpc } from "../../lib/trpc";
import { ActivityIndicator } from "react-native";

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
  description: "Add a short description",
  pitch: "Add a detailed pitch",
  location: "Add your location",
  fundingAsk: "Specify your funding requirements",
  websiteUrl: "Add your website URL",
  barakahScore: "Set your Barakah score (1-10)"
};

export function ProfileCompletionCard() {
  const router = useRouter();
  const { data: completeness, isLoading } =
    trpc.visionaryDashboard.getProfileCompleteness.useQuery();

  if (isLoading) {
    return (
      <View className="flex-row justify-center py-4">
        <ActivityIndicator size="small" color="#047857" />
      </View>
    );
  }

  if (!completeness) {
    return null;
  }

  const isComplete = completeness.completeness === 100;
  const missingFields = completeness.missingFields || [];

  return (
    <View className="bg-white rounded-lg shadow-sm p-4 border border-emerald-100">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-lg font-semibold text-gray-900">Profile Completeness</Text>
        <Text
          className={`text-xl font-bold ${
            isComplete ? "text-emerald-600" : "text-amber-600"
          }`}
        >
          {completeness.completeness}%
        </Text>
      </View>

      {/* Progress Bar */}
      <View className="mb-4">
        <View className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <View
            className="bg-emerald-600 h-full rounded-full"
            style={{ width: `${completeness.completeness}%` }}
          />
        </View>
      </View>

      {isComplete ? (
        <View className="items-center py-4">
          <Text className="text-3xl mb-2">🎉</Text>
          <Text className="text-base font-semibold text-emerald-600 mb-1">
            Profile Complete!
          </Text>
          <Text className="text-xs text-gray-600 text-center">
            Your profile is fully set up and ready to attract investors
          </Text>
        </View>
      ) : (
        <>
          <Text className="text-sm text-gray-600 mb-3">
            Complete these fields to improve your profile visibility:
          </Text>
          <View className="mb-4">
            {missingFields.slice(0, 3).map((field, index) => (
              <View
                key={field}
                className={`flex-row items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200 ${
                  index < missingFields.slice(0, 3).length - 1 ? "mb-2" : ""
                }`}
              >
                <View className="w-4 h-4 rounded-full border-2 border-gray-300 flex items-center justify-center">
                  <View className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                </View>
                <View className="flex-1">
                  <Text className="font-medium text-sm text-gray-900">
                    {fieldLabels[field] || field}
                  </Text>
                  <Text className="text-xs text-gray-500">
                    {fieldDescriptions[field] || "Add this field"}
                  </Text>
                </View>
              </View>
            ))}
            {missingFields.length > 3 && (
              <Text className="text-xs text-gray-500 text-center">
                +{missingFields.length - 3} more fields
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/visionary/setup")}
            className="bg-emerald-600 text-white px-4 py-3 rounded-lg"
            activeOpacity={0.8}
          >
            <Text className="text-white text-center font-semibold">
              Complete Profile →
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

