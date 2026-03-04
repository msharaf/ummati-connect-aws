"use client";

import { Stack } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { LogoutButton } from "../../src/components/LogoutButton";

export default function OnboardingLayout() {
  const { isSignedIn } = useAuth();

  return (
    <Stack
      screenOptions={{
        headerShown: Boolean(isSignedIn),
        headerRight: isSignedIn ? () => <LogoutButton /> : undefined,
        headerTitle: "",
        headerShadowVisible: false,
        headerStyle: { backgroundColor: "#ecfdf5" },
        headerTintColor: "#047857"
      }}
    >
      <Stack.Screen name="investor-halalfocus" options={{ headerShown: false }} />
      <Stack.Screen name="investor-setup" options={{ headerShown: false }} />
    </Stack>
  );
}
