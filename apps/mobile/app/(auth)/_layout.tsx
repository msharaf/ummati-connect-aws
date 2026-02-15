"use client";

import { Stack } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { LogoutButton } from "../../src/components/LogoutButton";

export default function AuthLayout() {
  const { isSignedIn } = useAuth();

  return (
    <Stack
      screenOptions={{
        headerShown: Boolean(isSignedIn),
        headerRight: isSignedIn ? () => <LogoutButton /> : undefined,
        headerTitle: "",
        headerShadowVisible: false,
        headerStyle: { backgroundColor: "#ecfdf5" },
        headerTintColor: "#047857",
      }}
    >
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="choose-role" />
    </Stack>
  );
}
