import { Slot, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { BackHandler, Platform, View, ActivityIndicator, Text } from "react-native";
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

/**
 * Loading splash - shown while Clerk auth is initializing.
 * tRPC client will NOT exist until this screen is gone.
 */
function AuthLoadingSplash() {
  return (
    <SafeAreaView className="flex-1 bg-emerald-50">
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#047857" />
        <Text className="mt-4 text-gray-600">Loading...</Text>
      </View>
    </SafeAreaView>
  );
}

/**
 * Inner component with tRPC access - only rendered when auth is ready.
 */
function AuthenticatedApp() {
  const { isSignedIn } = useAuth();
  const segments = useSegments() as string[];
  const router = useRouter();

  // Get user profile (only if signed in)
  // This is safe now because TRPCProvider is guaranteed to be mounted
  const { data: userData, isLoading: isLoadingUser } = trpc.user.me.useQuery(
    undefined,
    {
      enabled: isSignedIn,
      retry: false
    }
  );

  // Handle Android hardware back button globally
  useBackHandler(() => {
    const inTabsGroup = segments[0] === "(tabs)";
    const isWelcomeScreen = segments?.[1] === "welcome";

    // Unauthenticated: prevent back into authenticated screens
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

    // Signed in, NO ROLE → force choose-role
    if (!userData?.role) {
      if (!isChooseRole) {
        router.replace("/(auth)/choose-role");
      }
      return;
    }

    // Signed in, HAS ROLE: redirect away from auth screens to app
    // Allow access even if onboarding not complete (they can finish profile setup later)
    if (inAuthGroup) {
      if (userData.role === "INVESTOR") {
        router.replace("/(tabs)/investor");
      } else if (userData.role === "VISIONARY") {
        router.replace("/(tabs)/visionary/dashboard");
      } else {
        router.replace("/(tabs)/swipe");
      }
    }
  }, [isSignedIn, segments, userData, isLoadingUser, router]);

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

/**
 * Auth gate wrapper - conditionally mounts tRPC based on Clerk auth state.
 * tRPC client is ONLY created when auth is fully ready.
 */
function RootLayoutNav() {
  const { isLoaded, isSignedIn } = useAuth();

  // BLOCKING: Wait for Clerk to initialize
  if (!isLoaded) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log("[Auth] Clerk not loaded yet - showing splash");
    }
    return <AuthLoadingSplash />;
  }

  // BLOCKING: Wait for user to sign in
  // For unsigned users, we still need tRPC for the auth flow screens,
  // so we mount TRPCProvider but the client won't have a valid token
  // until the user signs in.
  
  // Mount tRPC ONLY after Clerk is loaded
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log("[Auth] Clerk loaded, mounting tRPC provider", { isSignedIn });
  }

  return (
    <TRPCProvider>
      <AuthenticatedApp />
    </TRPCProvider>
  );
}

function RootLayoutWithQuery() {
  return (
    <QueryClientProvider client={queryClient}>
      <RootLayoutNav />
    </QueryClientProvider>
  );
}

/**
 * Root layout: ClerkProvider wraps entire app.
 * All useAuth/useClerk calls must be inside this tree.
 * Auth-dependent providers (TRPCProvider, etc.) are below ClerkProvider and ONLY mounted after Clerk is loaded.
 */
export default function RootLayout() {
  const router = useRouter();

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      tokenCache={tokenCache}
      routerPush={(to: string) => router.push(to)}
      routerReplace={(to: string) => router.replace(to)}
    >
      <RootLayoutWithQuery />
    </ClerkProvider>
  );
}

