/**
 * InvestorOnboardingGuard
 *
 * Hard gate: investors cannot access protected screens until HalalFocus + profile setup complete.
 * Two-step redirect: 1) halalfocus if !halalFocusVerified, 2) setup if !onboardingComplete.
 */

import { useEffect, ReactNode } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { trpc } from "../lib/trpc";

interface InvestorOnboardingGuardProps {
  children: ReactNode;
}

export function InvestorOnboardingGuard({ children }: InvestorOnboardingGuardProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const { data: userData, isLoading } = trpc.user.me.useQuery();

  const isInvestor = userData?.role === "INVESTOR";
  const halalFocusVerified = userData?.halalFocusVerified ?? false;
  const onboardingComplete = userData?.onboardingComplete ?? false;
  const isOnHalalFocus = pathname.includes("halalfocus");
  const isOnInvestorSetup = pathname.includes("investor/setup");

  useEffect(() => {
    if (!isLoading && isInvestor) {
      if (!halalFocusVerified && !isOnHalalFocus) {
        queueMicrotask(() => router.replace("/(tabs)/investor/halalfocus"));
        return;
      }
      if (!onboardingComplete && !isOnInvestorSetup) {
        queueMicrotask(() => router.replace("/(tabs)/investor/setup"));
      }
    }
  }, [isLoading, isInvestor, halalFocusVerified, onboardingComplete, isOnHalalFocus, isOnInvestorSetup, router]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-emerald-50">
        <ActivityIndicator size="large" color="#047857" />
        <Text className="mt-4 text-gray-600">Loading...</Text>
      </View>
    );
  }

  if (isInvestor && (!halalFocusVerified || !onboardingComplete) && !isOnHalalFocus && !isOnInvestorSetup) {
    return (
      <View className="flex-1 items-center justify-center bg-emerald-50">
        <ActivityIndicator size="large" color="#047857" />
        <Text className="mt-4 text-gray-600">Redirecting...</Text>
      </View>
    );
  }

  return <>{children}</>;
}
