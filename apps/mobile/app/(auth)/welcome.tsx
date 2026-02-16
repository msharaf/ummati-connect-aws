"use client";

import { useOAuth } from "@clerk/clerk-expo";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useState, useCallback } from "react";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { LinearGradient as ExpoLinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

WebBrowser.maybeCompleteAuthSession();

const LinearGradient = ExpoLinearGradient as unknown as React.ComponentType<{
  colors: string[];
  style?: object;
  children?: React.ReactNode;
}>;

export default function WelcomeScreen() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const { startOAuthFlow: startGoogleOAuth } = useOAuth({ strategy: "oauth_google" });
  const { startOAuthFlow: startAppleOAuth } = useOAuth({ strategy: "oauth_apple" });

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
          // Auth gate in root _layout.tsx handles redirect to choose-role (select-mode)
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
    [startGoogleOAuth, startAppleOAuth]
  );

  const onGoogleSignIn = useCallback(() => runOAuth("oauth_google"), [runOAuth]);
  const onAppleSignIn = useCallback(() => runOAuth("oauth_apple"), [runOAuth]);

  return (
    <LinearGradient
      colors={["#0f172a", "#1e293b", "#0f172a"]}
      style={{ flex: 1 }}
    >
      <SafeAreaView className="flex-1 justify-center px-6">
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

          {error ? (
            <Text className="text-red-400 text-center text-sm mb-4">{error}</Text>
          ) : null}

          <TouchableOpacity
            className="w-full bg-white rounded-xl py-4 mb-3"
            onPress={onGoogleSignIn}
            disabled={!!loading}
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
            disabled={!!loading}
          >
            {loading === "oauth_apple" ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center font-semibold text-base">
                Continue with Apple
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
