import { useOAuth } from "@clerk/clerk-expo";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useState, useCallback } from "react";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
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
        if (message) {
          setError(message);
        } else {
          setError(`${label} sign in failed`);
        }
      } finally {
        setLoading(null);
      }
    },
    [startGoogleOAuth, startAppleOAuth]
  );

  const onGoogleSignIn = useCallback(() => runOAuth("oauth_google"), [runOAuth]);
  const onAppleSignIn = useCallback(() => runOAuth("oauth_apple"), [runOAuth]);

  return (
    <View className="flex-1 bg-emerald-50 p-6 justify-center">
      <Text className="text-3xl font-bold text-emerald-800 text-center mb-8">
        Welcome to Ummati
      </Text>

      {error ? (
        <Text className="text-red-500 text-center mb-4">{error}</Text>
      ) : null}

      <TouchableOpacity
        className="bg-white border border-gray-300 rounded-lg p-4 mb-4"
        onPress={onGoogleSignIn}
        disabled={!!loading}
      >
        {loading === "oauth_google" ? (
          <ActivityIndicator color="#047857" />
        ) : (
          <Text className="text-gray-700 text-center font-semibold text-lg">
            Continue with Google
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        className="bg-black rounded-lg p-4 mb-6"
        onPress={onAppleSignIn}
        disabled={!!loading}
      >
        {loading === "oauth_apple" ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white text-center font-semibold text-lg">
            Continue with Apple
          </Text>
        )}
      </TouchableOpacity>

      <Text className="text-gray-600 text-center text-sm">
        New here? Continue with Apple or Google to create your account.
      </Text>
    </View>
  );
}
