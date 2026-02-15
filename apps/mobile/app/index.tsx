import { Redirect } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";

export default function Index() {
  const { isSignedIn, isLoaded } = useAuth();

  // Show loading while checking auth
  if (!isLoaded) {
    return null; // Or a loading screen
  }

  // If not signed in, redirect to sign-in
  if (!isSignedIn) {
    return <Redirect href="/(auth)/welcome" />;
  }

  // If signed in, the layout will handle redirects based on onboarding status
  // Default to swipe screen
  return <Redirect href="/(tabs)/swipe" />;
}

