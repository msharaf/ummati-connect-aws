"use client";

import { useEffect } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { trpc } from "../../src/lib/trpc";

export default function ChooseRoleScreen() {
  const router = useRouter();
  const utils = trpc.useUtils();

  // Get current user
  const { data: userData, isLoading: isLoadingUser } = trpc.user.me.useQuery();

  // Set role mutation (TODO: This endpoint needs to be created)
  // For now, we'll just invalidate and redirect
  const setRole = trpc.user.me.useQuery(undefined, {
    enabled: false
  });

  // If user already completed onboarding, redirect to their dashboard
  useEffect(() => {
    if (userData?.onboardingComplete && userData?.role) {
      if (userData.role === "INVESTOR") {
        router.replace("/(tabs)/investor");
      } else if (userData.role === "VISIONARY") {
        router.replace("/(tabs)/visionary/dashboard");
      }
    }
  }, [userData, router]);

  const handleRoleSelect = async (role: "INVESTOR" | "VISIONARY") => {
    // TODO: Implement setRole mutation in API
    // For now, show alert that this needs to be implemented
    alert(`Role selection (${role}) - API endpoint needs to be implemented`);
    // After implementing the API endpoint, uncomment:
    // setRole.mutate({ role });
  };

  // Show loading state
  if (isLoadingUser) {
    return (
      <View className="flex-1 items-center justify-center bg-emerald-50">
        <ActivityIndicator size="large" color="#047857" />
        <Text className="mt-4 text-gray-600">Loading...</Text>
      </View>
    );
  }

  // If user has completed onboarding, show loading while redirecting
  if (userData?.onboardingComplete) {
    return (
      <View className="flex-1 items-center justify-center bg-emerald-50">
        <ActivityIndicator size="large" color="#047857" />
        <Text className="mt-4 text-gray-600">Redirecting...</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={["#ecfdf5", "#d1fae5", "#a7f3d0"]}
      style={{ flex: 1 }}
    >
      <View className="flex-1 items-center justify-center p-6">
        {/* Header */}
        <View className="items-center mb-12">
          <Text className="text-4xl font-bold text-gray-900 mb-4 text-center">
            Welcome to Ummati
          </Text>
          <Text className="text-xl text-gray-700 mb-2 text-center">
            Choose your role to get started
          </Text>
          <Text className="text-base text-gray-600 text-center">
            Connect with like-minded investors and visionary founders
          </Text>
        </View>

        {/* Role Selection Buttons */}
        <View className="w-full max-w-md space-y-4">
          {/* Investor Button */}
          <TouchableOpacity
            onPress={() => handleRoleSelect("INVESTOR")}
            disabled={setRole.isPending}
            activeOpacity={0.8}
            className="bg-white rounded-2xl shadow-lg p-6 border-2 border-emerald-200"
          >
            <View className="items-center">
              <LinearGradient
                colors={["#10b981", "#047857"]}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16
                }}
              >
                <Text className="text-4xl">💼</Text>
              </LinearGradient>
              <Text className="text-2xl font-bold text-gray-900 mb-2">
                I am an Investor
              </Text>
              <Text className="text-gray-600 text-center mb-4">
                Discover and invest in halal-aligned startups that match your values
              </Text>
              {setRole.isPending ? (
                <View className="flex-row items-center gap-2">
                  <ActivityIndicator size="small" color="#047857" />
                  <Text className="text-emerald-600 font-semibold">Setting...</Text>
                </View>
              ) : (
                <View className="flex-row items-center gap-2">
                  <Text className="text-emerald-600 font-semibold">Get Started</Text>
                  <Text className="text-emerald-600">→</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          {/* Visionary Button */}
          <TouchableOpacity
            onPress={() => handleRoleSelect("VISIONARY")}
            disabled={setRole.isPending}
            activeOpacity={0.8}
            className="bg-white rounded-2xl shadow-lg p-6 border-2 border-emerald-200"
          >
            <View className="items-center">
              <LinearGradient
                colors={["#f59e0b", "#d97706"]}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16
                }}
              >
                <Text className="text-4xl">✨</Text>
              </LinearGradient>
              <Text className="text-2xl font-bold text-gray-900 mb-2">
                I am a Visionary
              </Text>
              <Text className="text-gray-600 text-center mb-4">
                Showcase your startup and connect with investors who share your vision
              </Text>
              {setRole.isPending ? (
                <View className="flex-row items-center gap-2">
                  <ActivityIndicator size="small" color="#047857" />
                  <Text className="text-emerald-600 font-semibold">Setting...</Text>
                </View>
              ) : (
                <View className="flex-row items-center gap-2">
                  <Text className="text-emerald-600 font-semibold">Get Started</Text>
                  <Text className="text-emerald-600">→</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Footer Note */}
        <View className="mt-8">
          <Text className="text-sm text-gray-500 text-center">
            You can change your role later in your profile settings
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

