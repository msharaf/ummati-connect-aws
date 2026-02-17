"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
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

type Role = "INVESTOR" | "VISIONARY";

export default function ChooseRoleScreen() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { isLoaded, isSignedIn } = useAuth();
  const [pendingRole, setPendingRole] = useState<Role | null>(null);
  const submittingRef = useRef(false);

  const { data: userData, isLoading: isLoadingUser, error: userError } = trpc.user.me.useQuery(
    undefined,
    { retry: false, enabled: isLoaded && isSignedIn }
  );

  const setRole = trpc.user.setRole.useMutation({
    onSuccess: (data) => {
      // Only invalidate user.me (not user.getMe) to avoid duplicate refetches
      utils.user.me.invalidate();
      if (data.role === "INVESTOR") {
        router.replace("/(tabs)/investor");
      } else if (data.role === "VISIONARY") {
        router.replace("/(tabs)/visionary/dashboard");
      }
    },
    onError: (error) => {
      const is401 = (error as { data?: { code?: string } }).data?.code === "UNAUTHORIZED";
      if (!is401) {
        Alert.alert("Error", `Failed to set role: ${error.message}`);
      }
    },
    onSettled: () => {
      submittingRef.current = false;
      setPendingRole(null);
    }
  });

  useEffect(() => {
    if (userData?.onboardingComplete && userData?.role) {
      if (userData.role === "INVESTOR") {
        router.replace("/(tabs)/investor");
      } else if (userData.role === "VISIONARY") {
        router.replace("/(tabs)/visionary/dashboard");
      }
    }
  }, [userData, router]);

  const handleRoleSelect = useCallback(
    (role: Role) => {
      if (submittingRef.current || pendingRole !== null) return;
      submittingRef.current = true;
      setPendingRole(role);
      setRole.mutate({ role });
    },
    [pendingRole, setRole]
  );

  const isPending = pendingRole !== null;

  if (isLoadingUser) {
    return (
      <View className="flex-1 items-center justify-center bg-emerald-50">
        <ActivityIndicator size="large" color="#047857" />
        <Text className="mt-4 text-gray-600">Loading...</Text>
      </View>
    );
  }

  if (userError) {
    const is401 =
      (userError as { data?: { code?: string } }).data?.code === "UNAUTHORIZED";
    return (
      <View className="flex-1 items-center justify-center bg-emerald-50 p-6">
        <Text className="text-red-600 text-center">
          {is401 ? "Please sign in again." : userError.message ?? "Failed to load"}
        </Text>
        <Text className="text-gray-500 text-center mt-2 text-sm">
          {is401 ? "Redirecting to sign in..." : ""}
        </Text>
      </View>
    );
  }

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
            disabled={isPending}
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
              {pendingRole === "INVESTOR" ? (
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
            disabled={isPending}
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
              {pendingRole === "VISIONARY" ? (
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

