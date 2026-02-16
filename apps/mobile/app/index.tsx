import { Redirect } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";

export default function Index() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return <Redirect href="/(auth)/welcome" />;
  }

  // Signed in: redirect to select-mode (choose-role); auth gate in _layout will redirect to tabs if onboarding complete
  return <Redirect href="/(auth)/choose-role" />;
}

