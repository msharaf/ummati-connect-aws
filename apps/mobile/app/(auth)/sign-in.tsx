import { useSignIn, useOAuth } from "@clerk/clerk-expo";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { useState, useCallback } from "react";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { startOAuthFlow: startGoogleOAuth } = useOAuth({ strategy: "oauth_google" });

  const onSignIn = useCallback(async () => {
    if (!isLoaded) return;

    setLoading(true);
    setError("");

    try {
      const result = await signIn.create({
        identifier: email,
        password
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  }, [isLoaded, signIn, email, password, setActive]);

  const onGoogleSignIn = useCallback(async () => {
    try {
      const { createdSessionId, setActive: setOAuthActive } = await startGoogleOAuth({
        redirectUrl: Linking.createURL("/")
      });

      if (createdSessionId && setOAuthActive) {
        await setOAuthActive({ session: createdSessionId });
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Google sign in failed");
    }
  }, [startGoogleOAuth]);

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-emerald-50">
        <ActivityIndicator size="large" color="#047857" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-emerald-50 p-6 justify-center">
      <Text className="text-3xl font-bold text-emerald-800 text-center mb-8">
        Welcome to Ummati
      </Text>

      {error ? (
        <Text className="text-red-500 text-center mb-4">{error}</Text>
      ) : null}

      <TextInput
        className="bg-white border border-gray-300 rounded-lg p-4 mb-4"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        className="bg-white border border-gray-300 rounded-lg p-4 mb-6"
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        className="bg-emerald-600 rounded-lg p-4 mb-4"
        onPress={onSignIn}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white text-center font-semibold text-lg">
            Sign In
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        className="bg-white border border-gray-300 rounded-lg p-4 mb-6"
        onPress={onGoogleSignIn}
      >
        <Text className="text-gray-700 text-center font-semibold text-lg">
          Continue with Google
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/(auth)/sign-up")}>
        <Text className="text-emerald-600 text-center">
          Don't have an account? Sign up
        </Text>
      </TouchableOpacity>
    </View>
  );
}
