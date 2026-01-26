import { useSignUp, useOAuth } from "@clerk/clerk-expo";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { useState, useCallback } from "react";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";

WebBrowser.maybeCompleteAuthSession();

export default function SignUpScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");

  const { startOAuthFlow: startGoogleOAuth } = useOAuth({ strategy: "oauth_google" });

  const onSignUp = useCallback(async () => {
    if (!isLoaded) return;

    setLoading(true);
    setError("");

    try {
      await signUp.create({
        emailAddress: email,
        password
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Sign up failed");
    } finally {
      setLoading(false);
    }
  }, [isLoaded, signUp, email, password]);

  const onVerify = useCallback(async () => {
    if (!isLoaded) return;

    setLoading(true);
    setError("");

    try {
      const result = await signUp.attemptEmailAddressVerification({ code });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  }, [isLoaded, signUp, code, setActive]);

  const onGoogleSignUp = useCallback(async () => {
    try {
      const { createdSessionId, setActive: setOAuthActive } = await startGoogleOAuth({
        redirectUrl: Linking.createURL("/")
      });

      if (createdSessionId && setOAuthActive) {
        await setOAuthActive({ session: createdSessionId });
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Google sign up failed");
    }
  }, [startGoogleOAuth]);

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-emerald-50">
        <ActivityIndicator size="large" color="#047857" />
      </View>
    );
  }

  if (pendingVerification) {
    return (
      <View className="flex-1 bg-emerald-50 p-6 justify-center">
        <Text className="text-2xl font-bold text-emerald-800 text-center mb-4">
          Verify your email
        </Text>
        <Text className="text-gray-600 text-center mb-6">
          We sent a verification code to {email}
        </Text>

        {error ? (
          <Text className="text-red-500 text-center mb-4">{error}</Text>
        ) : null}

        <TextInput
          className="bg-white border border-gray-300 rounded-lg p-4 mb-6 text-center text-2xl"
          placeholder="Enter code"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
        />

        <TouchableOpacity
          className="bg-emerald-600 rounded-lg p-4"
          onPress={onVerify}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center font-semibold text-lg">
              Verify
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-emerald-50 p-6 justify-center">
      <Text className="text-3xl font-bold text-emerald-800 text-center mb-8">
        Create Account
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
        onPress={onSignUp}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white text-center font-semibold text-lg">
            Sign Up
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        className="bg-white border border-gray-300 rounded-lg p-4 mb-6"
        onPress={onGoogleSignUp}
      >
        <Text className="text-gray-700 text-center font-semibold text-lg">
          Continue with Google
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/(auth)/sign-in")}>
        <Text className="text-emerald-600 text-center">
          Already have an account? Sign in
        </Text>
      </TouchableOpacity>
    </View>
  );
}
