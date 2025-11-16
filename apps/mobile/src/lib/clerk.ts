import { ClerkProvider as ClerkProviderExpo } from "@clerk/clerk-expo";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";

const publishableKey =
  Constants.expoConfig?.extra?.clerkPublishableKey ??
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ??
  "";

if (!publishableKey) {
  throw new Error(
    "Missing Clerk Publishable Key. Set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your environment variables."
  );
}

const tokenCache = {
  async getToken(key: string) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (err) {
      console.error("Error saving token:", err);
    }
  }
};

export { ClerkProviderExpo as ClerkProvider, publishableKey, tokenCache };

