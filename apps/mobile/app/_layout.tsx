import { Slot, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { BackHandler, Platform } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { ClerkProvider, publishableKey, tokenCache } from "../src/lib/clerk";
import { TRPCProvider, queryClient } from "../src/lib/trpc";
import { trpc } from "../src/lib/trpc";
import { usePushToken } from "../hooks/usePushToken";
import { useBackHandler } from "../src/hooks/useBackHandler";

function PushTokenRegistrar() {
  usePushToken();
  return null;
}

function RootLayoutNavInner() {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments() as string[];
  const router = useRouter();

  // Get user profile (only if signed in)
  const { data: userData, isLoading: isLoadingUser } = trpc.user.me.useQuery(
    undefined,
    {
      enabled: isSignedIn && isLoaded,
      retry: false
    }
  );

  // Handle Android hardware back button globally
  useBackHandler(() => {
    // Only handle back if we're not on the root screens (sign-in, landing)
    const inAuthGroup = segments[0] === "(auth)";
    const inTabsGroup = segments[0] === "(tabs)";
    const isSignIn = segments?.[1] === "sign-in";
    
    // Don't prevent default on sign-in or root screens
    if (!isLoaded || (!isSignedIn && !isSignIn)) {
      return false; // Allow default back behavior (exit app or go to previous route)
    }
    
    // For authenticated screens, try to go back
    if (router.canGoBack()) {
      router.back();
      return true; // Prevent default (we handled it)
    }
    
    // If no history, redirect to home
    if (inTabsGroup) {
      // Already in tabs, stay here or go to swipe
      if (segments?.[1] !== "swipe") {
        router.replace("/(tabs)/swipe");
        return true;
      }
    }
    
    // Default: allow back button to work normally
    return false;
  });

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inTabsGroup = segments[0] === "(tabs)";
    const isChooseRole = segments?.[1] === "choose-role";

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
    <>
      <PushTokenRegistrar />
      <SafeAreaView className="flex-1 bg-emerald-50">
        <StatusBar style="dark" />
        <Slot />
      </SafeAreaView>
    </>
  );
}

function RootLayoutNav() {
  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider>
        <RootLayoutNavInner />
      </TRPCProvider>
    </QueryClientProvider>
  );
}

export default function RootLayout() {
  const router = useRouter();

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      tokenCache={tokenCache}
      routerPush={(to: string) => router.push(to)}
      routerReplace={(to: string) => router.replace(to)}
    >
      <RootLayoutNav />
    </ClerkProvider>
  );
}

