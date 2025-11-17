import { Slot, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAuth } from "@clerk/clerk-expo";
import { ClerkProvider, tokenCache } from "../src/lib/clerk";
import { TRPCProvider, queryClient } from "../src/lib/trpc";
import { trpc } from "../src/lib/trpc";
import { usePushToken } from "../hooks/usePushToken";

function RootLayoutNav() {
  // Register push token
  usePushToken();
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Get user profile (only if signed in)
  const { data: userData, isLoading: isLoadingUser } = trpc.user.me.useQuery(
    undefined,
    {
      enabled: isSignedIn && isLoaded,
      retry: false
    }
  );

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inTabsGroup = segments[0] === "(tabs)";
    const isChooseRole = segments[1] === "choose-role";

    if (!isSignedIn) {
      // Not signed in - redirect to sign-in (unless already in auth group)
      if (!inAuthGroup) {
        router.replace("/(auth)/sign-in");
      }
      return;
    }

    // User is signed in - check onboarding status
    if (isLoadingUser) {
      // Still loading user data, wait
      return;
    }

    // User is signed in and data is loaded
    if (!userData?.onboardingComplete) {
      // Onboarding not complete - redirect to choose-role (unless already there)
      if (!isChooseRole) {
        router.replace("/(auth)/choose-role");
      }
      return;
    }

    // User has completed onboarding
    if (inAuthGroup && !isChooseRole) {
      // User is in auth group but onboarding is complete - redirect to appropriate dashboard
      if (userData.role === "INVESTOR") {
        router.replace("/(tabs)/investor");
      } else if (userData.role === "VISIONARY") {
        router.replace("/(tabs)/visionary/dashboard");
      } else {
        // Default to swipe screen
        router.replace("/(tabs)/swipe");
      }
    }
  }, [isSignedIn, isLoaded, segments, userData, isLoadingUser, router]);

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider>
        <SafeAreaView className="flex-1 bg-emerald-50">
          <StatusBar style="dark" />
          <Slot />
        </SafeAreaView>
      </TRPCProvider>
    </QueryClientProvider>
  );
}

export default function RootLayout() {
  return (
    <ClerkProvider tokenCache={tokenCache}>
      <RootLayoutNav />
    </ClerkProvider>
  );
}

