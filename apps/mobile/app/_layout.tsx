import { Slot, useRouter, useSegments, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { BackHandler, Platform, View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { ClerkProvider, publishableKey, tokenCache } from "../src/lib/clerk";
import { TRPCProvider, queryClient } from "../src/lib/trpc";
import { ApiReachabilityGate } from "../src/components/ApiReachabilityGate";
import { trpc } from "../src/lib/trpc";
import { usePushToken } from "../hooks/usePushToken";
import { useBackHandler } from "../src/hooks/useBackHandler";

function normalizeHref(to: string): string {
  return to.startsWith("/") ? to : `/${to}`;
}

function PushTokenRegistrar() {
  usePushToken();
  return null;
}

const splashStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ecfdf5" },
  content: { flex: 1, alignItems: "center", justifyContent: "center" },
  text: { marginTop: 16, color: "#4b5563", fontSize: 16 }
});

/**
 * Loading splash - shown while Clerk auth is initializing.
 * tRPC client will NOT exist until this screen is gone.
 * Uses StyleSheet (not className) to avoid NativeWind styled-component useMemo during Clerk init.
 */
function AuthLoadingSplash() {
  return (
    <SafeAreaView style={splashStyles.container}>
      <View style={splashStyles.content}>
        <ActivityIndicator size="large" color="#047857" />
        <Text style={splashStyles.text}>Loading...</Text>
      </View>
    </SafeAreaView>
  );
}

/**
 * Inner component with tRPC access - only rendered when auth is ready.
 */
function AuthenticatedApp() {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments() as string[];
  const pathname = usePathname();
  const router = useRouter();
  const redirectingRef = useRef(false);
  const routerRef = useRef(router);
  routerRef.current = router;

  // Get user profile - only when Clerk loaded AND signed in (avoids flicker)
  const { data: userData, isLoading: isLoadingUser } = trpc.user.me.useQuery(
    undefined,
    {
      enabled: isLoaded && isSignedIn,
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
    const path = pathname ?? "";
    const isOnHalalFocus = path.includes("halalfocus");
    const isOnInvestorSetup = path.includes("investor/setup");
    const inTabsGroup = segments[0] === "(tabs)";
    const isOnInvestorIndex = inTabsGroup && path.includes("investor") && !path.includes("investor/setup") && !path.includes("investor/halalfocus");

    // Reset redirect guard when we've arrived (prevents infinite loop)
    if (inTabsGroup || isOnHalalFocus || isOnInvestorSetup) {
      redirectingRef.current = false;
    }
    if (redirectingRef.current) return;

    const inAuthGroup = segments[0] === "(auth)";
    const isWelcomeScreen = segments?.[1] === "welcome";
    const isChooseRole = segments?.[1] === "choose-role";

    // NOT signed in: only auth stack; force welcome
    if (!isSignedIn) {
      if (!isWelcomeScreen) {
        redirectingRef.current = true;
        queueMicrotask(() => routerRef.current.replace("/(auth)/welcome"));
      }
      return;
    }

    // Signed in: wait for user data before routing
    if (isLoadingUser) return;

    // Signed in, NO ROLE → force choose-role
    if (!userData?.role) {
      if (!isChooseRole) {
        redirectingRef.current = true;
        queueMicrotask(() => routerRef.current.replace("/(auth)/choose-role"));
      }
      return;
    }

    // investorOnboardingComplete = user.me.onboardingComplete (INVESTOR only)
    // halalFocusVerified = user.me.halalFocusVerified (from halalCategory or hasAcceptedHalalTerms)
    const investorOnboardingComplete = userData.onboardingComplete ?? false;
    const halalFocusVerified = userData.halalFocusVerified ?? false;
    const isInvestor = userData.role === "INVESTOR";
    const isVisionary = userData.role === "VISIONARY";

    // INVESTOR GATE: 1) HalalFocus first, 2) then profile setup (prevent redirect loops)
    if (isInvestor) {
      if (!halalFocusVerified && !isOnHalalFocus) {
        redirectingRef.current = true;
        queueMicrotask(() => routerRef.current.replace("/(tabs)/investor/halalfocus"));
        return;
      }
      if (!investorOnboardingComplete && !isOnInvestorSetup) {
        // Skip when on investor index or choose-role - investor index handles redirect to setup
        if (isOnInvestorIndex || isChooseRole) return;
        // Redirect to investor index; it will redirect to setup (avoids root REPLACE to nested tab)
        redirectingRef.current = true;
        queueMicrotask(() => routerRef.current.replace("/(tabs)/investor"));
        return;
      }
    }

    // Redirect away from auth screens to app (only after gates pass)
    if (inAuthGroup) {
      redirectingRef.current = true;
      const target =
        isInvestor
          ? "/(tabs)/swipe"
          : isVisionary
            ? "/(tabs)/visionary/dashboard"
            : "/(tabs)/swipe";
      queueMicrotask(() => routerRef.current.replace(target));
    }
  }, [isSignedIn, segments, pathname, userData, isLoadingUser]);

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
      routerPush={(to: string) => router.push(normalizeHref(to))}
      routerReplace={(to: string) => router.replace(normalizeHref(to))}
    >
      <RootLayoutWithQuery />
    </ClerkProvider>
  );
}

