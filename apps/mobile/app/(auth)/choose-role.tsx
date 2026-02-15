"use client";

import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient as ExpoLinearGradient } from "expo-linear-gradient";

// Type cast to fix TypeScript error with expo-linear-gradient
const LinearGradient = ExpoLinearGradient as unknown as React.ComponentType<{
  colors: string[];
  style?: object;
  children?: React.ReactNode;
}>;
import { SafeAreaView } from "react-native-safe-area-context";
import { trpc } from "../../src/lib/trpc";
import { BackButton } from "../../src/components/BackButton";

export default function ChooseRoleScreen() {
  const router = useRouter();
  const utils = trpc.useUtils();

  // Get current user
  const { data: userData, isLoading: isLoadingUser } = trpc.user.me.useQuery();

  // Set role mutation
  const setRole = trpc.user.setRole.useMutation({
    onSuccess: (data) => {
      // Invalidate user queries to refetch updated data
      utils.user.me.invalidate();
      utils.user.getMe.invalidate();
      
      // Redirect based on role
      if (data.role === "INVESTOR") {
        router.replace("/(tabs)/investor");
      } else if (data.role === "VISIONARY") {
        router.replace("/(tabs)/visionary/dashboard");
      }
    },
    onError: (error) => {
      alert(`Failed to set role: ${error.message}`);
    }
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
    setRole.mutate({ role });
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
      <SafeAreaView className="flex-1">
        {/* Back Button */}
        <View className="absolute top-0 left-0 z-10 p-4">
          <BackButton fallbackRoute="/(auth)/welcome" />
        </View>
        
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
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                  backgroundColor: "#10b981"
                }}
              >
                <Text className="text-4xl">💼</Text>
              </View>
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
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                  backgroundColor: "#f59e0b"
                }}
              >
                <Text className="text-4xl">✨</Text>
              </View>
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
      </SafeAreaView>
    </LinearGradient>
  );
}

