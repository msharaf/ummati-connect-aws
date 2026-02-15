"use client";

import { useOAuth } from "@clerk/clerk-expo";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useState, useCallback, useEffect } from "react";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { LinearGradient as ExpoLinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { trpc } from "../../src/lib/trpc";
import { getPendingRole, setPendingRole, clearPendingRole, type PendingRole } from "../../src/lib/pendingRole";

WebBrowser.maybeCompleteAuthSession();

const LinearGradient = ExpoLinearGradient as unknown as React.ComponentType<{
  colors: string[];
  style?: object;
  children?: React.ReactNode;
}>;

export default function WelcomeScreen() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [selectedRole, setSelectedRole] = useState<PendingRole | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const { startOAuthFlow: startGoogleOAuth } = useOAuth({ strategy: "oauth_google" });
  const { startOAuthFlow: startAppleOAuth } = useOAuth({ strategy: "oauth_apple" });
  const setRoleMutation = trpc.user.setRole.useMutation({
    onSuccess: (data) => {
      utils.user.me.invalidate();
      utils.user.getMe.invalidate();
      clearPendingRole();
      if (data.role === "INVESTOR") {
        router.replace("/(tabs)/investor");
      } else if (data.role === "VISIONARY") {
        router.replace("/(tabs)/visionary/dashboard");
      }
    },
    onError: () => {
      router.replace("/(auth)/choose-role");
    },
  });

  useEffect(() => {
    getPendingRole().then(setSelectedRole);
  }, []);

  const onRolePress = useCallback(async (role: PendingRole) => {
    setSelectedRole(role);
    await setPendingRole(role);
  }, []);

  const runOAuth = useCallback(
    async (strategy: "oauth_google" | "oauth_apple") => {
      const startFlow = strategy === "oauth_google" ? startGoogleOAuth : startAppleOAuth;
      const label = strategy === "oauth_google" ? "Google" : "Apple";

      setLoading(strategy);
      setError("");

      try {
        const { createdSessionId, setActive: setOAuthActive } = await startFlow({
          redirectUrl: Linking.createURL("/")
        });

        if (createdSessionId && setOAuthActive) {
          await setOAuthActive({ session: createdSessionId });

          const pendingRole = await getPendingRole();
          if (pendingRole) {
            setRoleMutation.mutate({ role: pendingRole });
            return;
          }
          router.replace("/(auth)/choose-role");
        }
      } catch (err: unknown) {
        const code = err && typeof err === "object" && "code" in err
          ? (err as { code?: string }).code
          : null;
        if (code === "ERR_REQUEST_CANCELED" || code === "user_cancelled") {
          return;
        }
        const message = err && typeof err === "object" && "errors" in err
          ? (err as { errors?: Array<{ message?: string }> }).errors?.[0]?.message
          : null;
        setError(message ?? `${label} sign in failed`);
      } finally {
        setLoading(null);
      }
    },
    [startGoogleOAuth, startAppleOAuth, router, setRoleMutation]
  );

  const onGoogleSignIn = useCallback(() => runOAuth("oauth_google"), [runOAuth]);
  const onAppleSignIn = useCallback(() => runOAuth("oauth_apple"), [runOAuth]);

  const isOAuthLoading = !!loading;
  const isSettingRole = setRoleMutation.isPending;

  return (
    <LinearGradient
      colors={["#0f172a", "#1e293b", "#0f172a"]}
      style={{ flex: 1 }}
    >
      <SafeAreaView className="flex-1 justify-center px-6">
        {/* Subtle star dots */}
        <View className="absolute inset-0 opacity-40">
          {[...Array(20)].map((_, i) => (
            <View
              key={i}
              className="absolute w-1 h-1 rounded-full bg-white"
              style={{
                left: `${(i * 17) % 100}%`,
                top: `${(i * 23) % 100}%`,
              }}
            />
          ))}
        </View>

        <View className="items-center">
          <Text className="text-4xl text-white font-bold mb-2">🌙 Ummati</Text>
          <Text className="text-xl font-bold text-white text-center mb-2">
            Swipe. Match. Build the Future of the Ummah.
          </Text>
          <Text className="text-gray-400 text-center text-sm mb-8">
            Connecting Muslim visionaries, founders, creatives, and investors worldwide.
          </Text>

          {/* Role pills */}
          <View className="flex-row gap-3 mb-8">
            <TouchableOpacity
              onPress={() => onRolePress("VISIONARY")}
              className={`px-5 py-3 rounded-full border ${
                selectedRole === "VISIONARY"
                  ? "bg-emerald-600/30 border-emerald-500"
                  : "bg-white/10 border-white/30"
              }`}
            >
              <Text
                className={`font-medium ${
                  selectedRole === "VISIONARY" ? "text-emerald-400" : "text-gray-300"
                }`}
              >
                Visionary
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onRolePress("INVESTOR")}
              className={`px-5 py-3 rounded-full border ${
                selectedRole === "INVESTOR"
                  ? "bg-emerald-600/30 border-emerald-500"
                  : "bg-white/10 border-white/30"
              }`}
            >
              <Text
                className={`font-medium ${
                  selectedRole === "INVESTOR" ? "text-emerald-400" : "text-gray-300"
                }`}
              >
                Investor
              </Text>
            </TouchableOpacity>
          </View>

          {error ? (
            <Text className="text-red-400 text-center text-sm mb-4">{error}</Text>
          ) : null}

          <TouchableOpacity
            className="w-full bg-white rounded-xl py-4 mb-3"
            onPress={onGoogleSignIn}
            disabled={isOAuthLoading || isSettingRole}
          >
            {loading === "oauth_google" ? (
              <ActivityIndicator color="#0f172a" />
            ) : (
              <Text className="text-gray-900 text-center font-semibold text-base">
                Continue with Google
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className="w-full bg-black rounded-xl py-4 border border-white/30"
            onPress={onAppleSignIn}
            disabled={isOAuthLoading || isSettingRole}
          >
            {loading === "oauth_apple" ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center font-semibold text-base">
                Continue with Apple
              </Text>
            )}
          </TouchableOpacity>

          {isSettingRole ? (
            <Text className="text-gray-400 text-sm mt-4">Setting up your account...</Text>
          ) : null}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
