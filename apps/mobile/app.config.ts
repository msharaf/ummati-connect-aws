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
    // Set EXPO_PUBLIC_API_URL in apps/mobile/.env. Examples:
    // Physical device: EXPO_PUBLIC_API_URL=http://192.168.1.100:3001
    // Simulator/emulator: EXPO_PUBLIC_API_URL=http://localhost:3001
    // Next.js web: EXPO_PUBLIC_API_URL=http://localhost:3000
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001",
    clerkPublishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? ""
  },
  plugins: [
    "expo-router",
    "expo-web-browser"
  ]
});

