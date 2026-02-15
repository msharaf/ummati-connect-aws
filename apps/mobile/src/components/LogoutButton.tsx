"use client";

import React, { useState, useCallback } from "react";
import { TouchableOpacity, Text, ActivityIndicator } from "react-native";
import { useClerk } from "@clerk/clerk-expo";

/**
 * Reusable LogoutButton for mobile app.
 * Calls Clerk signOut(), clears session, and lets auth redirect handle navigation.
 * Disabled during execution to prevent rapid taps.
 */
export function LogoutButton() {
  const { signOut } = useClerk();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleLogout = useCallback(async () => {
    if (isSigningOut) return;

    setIsSigningOut(true);
    try {
      await signOut();
      // Root layout useEffect will redirect to sign-in when isSignedIn becomes false
    } catch (error) {
      console.error("Logout failed:", error);
      // Still clear local state so user can retry
    } finally {
      setIsSigningOut(false);
    }
  }, [signOut, isSigningOut]);

  return (
    <TouchableOpacity
      onPress={handleLogout}
      disabled={!!isSigningOut}
      activeOpacity={0.7}
      className="px-3 py-2"
      accessibilityRole="button"
      accessibilityLabel="Log out"
      accessibilityState={{ disabled: !!isSigningOut }}
    >
      {isSigningOut ? (
        <ActivityIndicator size="small" color="#047857" />
      ) : (
        <Text className="text-emerald-700 font-medium text-sm">Log Out</Text>
      )}
    </TouchableOpacity>
  );
}
