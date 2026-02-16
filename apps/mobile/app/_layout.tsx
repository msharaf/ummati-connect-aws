import { Slot, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { BackHandler, Platform } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { ClerkProvider, publishableKey, tokenCache } from "../src/lib/clerk";
import { TRPCProvider, queryClient } from "../src/lib/trpc";
import { ApiReachabilityGate } from "../src/components/ApiReachabilityGate";
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
    const inTabsGroup = segments[0] === "(tabs)";
    const isWelcomeScreen = segments?.[1] === "welcome";

    // Unauthenticated: prevent back into authenticated screens
    if (!isLoaded) return false;
    if (!isSignedIn) {
      if (!isWelcomeScreen) router.replace("/(auth)/welcome");
      return true; // Always prevent - avoids returning to authenticated stack
    }

    // Authenticated: handle back within app
    if (router.canGoBack()) {
      router.back();
      return true;
    }
    if (inTabsGroup && segments?.[1] !== "swipe") {
      router.replace("/(tabs)/swipe");
      return true;
    }
    return false;
  });

  // AUTH GATE (single source of truth) - controls navigation based on auth state
  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === "(auth)";
    const isWelcomeScreen = segments?.[1] === "welcome";
    const isChooseRole = segments?.[1] === "choose-role";

    // NOT signed in: only auth stack; force welcome
    if (!isSignedIn) {
      if (!isWelcomeScreen) {
        router.replace("/(auth)/welcome");
      }
      return;
    }

    // Signed in: wait for user data before routing
    if (isLoadingUser) return;

    // Signed in, no role / onboarding incomplete -> select-mode (choose-role)
    if (!userData?.onboardingComplete) {
      if (!isChooseRole) {
        router.replace("/(auth)/choose-role");
      }
      return;
    }

    // Signed in, onboarding complete: redirect away from auth screens to app
    if (inAuthGroup && !isChooseRole) {
      if (userData.role === "INVESTOR") {
        router.replace("/(tabs)/investor");
      } else if (userData.role === "VISIONARY") {
        router.replace("/(tabs)/visionary/dashboard");
      } else {
        router.replace("/(tabs)/swipe");
      }
    }
  }, [isSignedIn, isLoaded, segments, userData, isLoadingUser, router]);

  return (
    <>
      <PushTokenRegistrar />
      <ApiReachabilityGate>
        <SafeAreaView className="flex-1 bg-emerald-50">
          <StatusBar style="light" />
          <Slot />
        </SafeAreaView>
      </ApiReachabilityGate>
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

