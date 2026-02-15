import { httpBatchLink, loggerLink } from "@trpc/client";
import React from "react";
import { useAuth } from "@clerk/clerk-expo";
import { createTRPCReact } from "@trpc/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import Constants from "expo-constants";
import { Platform } from "react-native";
import superjson from "superjson";
import type { AppRouter } from "@ummati/api";
import { useAuthStore } from "../store/useAuthStore";

export const trpc = createTRPCReact<AppRouter>();

/**
 * Get the base URL for tRPC requests
 * - On web: Uses localhost or relative path
 * - On mobile: Uses LAN IP (set via EXPO_PUBLIC_API_URL) or localhost
 * - In production: Uses environment variable
 */
export const getBaseUrl = (): string => {
  // Check for explicit API URL in environment
  const envUrl =
    Constants.expoConfig?.extra?.apiUrl ??
    Constants.manifest?.extra?.apiUrl ??
    process.env.EXPO_PUBLIC_API_URL;

  if (envUrl) {
    return envUrl as string;
  }

  // On web platform, use relative path or localhost
  if (Platform.OS === "web") {
    return typeof window !== "undefined" ? "" : "http://localhost:3000";
  }

  // On native platforms (mobile)
  // For physical devices, set EXPO_PUBLIC_API_URL to your LAN IP:
  // Example: EXPO_PUBLIC_API_URL=http://192.168.1.100:3001
  // For iOS simulator or Android emulator, localhost works fine
  const lanIp = Constants.expoConfig?.hostUri?.split(":")[0];
  if (lanIp && lanIp !== "localhost" && lanIp !== "127.0.0.1") {
    return `http://${lanIp}:3001`;
  }

  // Fallback to localhost (works for iOS simulator and Android emulator)
  // Default to standalone API server on port 3001
  // If using Next.js web app, set EXPO_PUBLIC_API_URL=http://localhost:3000
  return "http://localhost:3001";
};

// Create a singleton QueryClient instance
let queryClientInstance: QueryClient | null = null;

export const getQueryClient = (): QueryClient => {
  if (!queryClientInstance) {
    queryClientInstance = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 1000,
          retry: 1,
          retryDelay: 1000,
          refetchOnWindowFocus: false,
          // Add timeout to prevent hanging queries
          networkMode: "online"
        }
      }
    });
  }
  return queryClientInstance;
};

// Export queryClient for direct access if needed
export const queryClient = getQueryClient();

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  const [trpcClient] = useState(() =>
    trpc.createClient({
      transformer: superjson,
      links: [
        loggerLink({
          enabled: (opts) =>
            __DEV__ ||
            (opts.direction === "down" && opts.result instanceof Error)
        }),
        httpBatchLink({
          url: (() => {
            const baseUrl = getBaseUrl();
            // If using Next.js (port 3000), use /api/trpc endpoint
            // If using standalone API server (port 3001), use /trpc endpoint
            if (baseUrl.includes(':3000')) {
              return `${baseUrl}/api/trpc`;
            }
            return `${baseUrl}/trpc`;
          })(),
          fetch: (url, options) => {
            // Add timeout to prevent hanging requests
            // 30 seconds for tunnel/slow connections
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);
            
            return fetch(url, {
              ...options,
              signal: controller.signal
            }).finally(() => {
              clearTimeout(timeoutId);
            });
          },
          async headers() {
            // Use ref to always get latest getToken (avoids stale closure after sign-in)
            const token = await getTokenRef.current();
            return {
              ...(token ? { Authorization: `Bearer ${token}` } : {})
            };
          }
        })
      ]
    })
  );

  return React.createElement(
    trpc.Provider,
    { client: trpcClient, queryClient, children }
  );
}
