import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Ummati",
  slug: "ummati",
  version: "0.1.0",
  orientation: "portrait",
  scheme: "ummati",
  userInterfaceStyle: "light",
  updates: {
    fallbackToCacheTimeout: 0
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true
  },
  android: {
    permissions: []
  },
  extra: {
    // For development on physical device, set your LAN IP:
    // EXPO_PUBLIC_API_URL=http://192.168.1.100:3000
    // For iOS simulator or Android emulator, use localhost:
    // EXPO_PUBLIC_API_URL=http://localhost:3000
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000",
    clerkPublishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? ""
  },
  plugins: [
    "expo-router",
    "expo-web-browser"
  ]
});

