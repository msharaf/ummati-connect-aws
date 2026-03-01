/**
 * InvestorOnboardingGuard
 * 
 * Hard gate that ensures investors cannot access protected screens until onboarding is complete.
 * Redirects to investor setup if:
 * - User is an investor AND
 * - Onboarding is not complete
 * 
 * This component enforces the halal investor onboarding requirement with zero exceptions.
 */

import { useEffect, ReactNode } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useRouter, useSegments } from "expo-router";
import { trpc } from "../lib/trpc";

interface InvestorOnboardingGuardProps {
  children: ReactNode;
}

export function InvestorOnboardingGuard({ children }: InvestorOnboardingGuardProps) {
  const router = useRouter();
  const segments = useSegments() as string[];
  const { data: userData, isLoading } = trpc.user.me.useQuery();

  const isInvestor = userData?.role === "INVESTOR";
  const onboardingComplete = userData?.onboardingComplete ?? false;
  const isSetupScreen = segments.includes("setup");

  useEffect(() => {
    // Only enforce gate for investors
    if (!isLoading && isInvestor && !onboardingComplete && !isSetupScreen) {
      // HARD REDIRECT: Investor without complete onboarding cannot access protected screens
      router.replace("/(tabs)/investor/setup");
    }
  }, [isLoading, isInvestor, onboardingComplete, isSetupScreen, router]);

  // Show loading state while checking onboarding status
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-emerald-50">
        <ActivityIndicator size="large" color="#047857" />
        <Text className="mt-4 text-gray-600">Loading...</Text>
      </View>
    );
  }

  // Block render if investor hasn't completed onboarding
  // (This prevents any queries or UI from executing before redirect)
  if (isInvestor && !onboardingComplete && !isSetupScreen) {
    return (
      <View className="flex-1 items-center justify-center bg-emerald-50">
        <ActivityIndicator size="large" color="#047857" />
        <Text className="mt-4 text-gray-600">Redirecting to setup...</Text>
      </View>
    );
  }

  // Allow access if:
  // - Not an investor (visionaries have their own flow)
  // - Investor with complete onboarding
  // - Currently on setup screen
  return <>{children}</>;
}
