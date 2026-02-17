import { httpBatchLink, loggerLink } from "@trpc/client";
import React, { useMemo, useRef, useEffect } from "react";
import { useAuth, useClerk } from "@clerk/clerk-expo";
import { createTRPCReact } from "@trpc/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Alert } from "react-native";
import Constants from "expo-constants";
import { Platform } from "react-native";
import superjson from "superjson";
import type { AppRouter } from "@ummati/api/types";
import { UMMATI_API_TOKEN_TEMPLATE } from "@ummati/api/constants";
import { jwtDecode } from "jwt-decode";

export const trpc = createTRPCReact<AppRouter>();

function is401Error(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { data?: { code?: string; httpStatus?: number }; meta?: { response?: { status?: number } } };
  return (
    e.data?.code === "UNAUTHORIZED" ||
    e.data?.httpStatus === 401 ||
    e.meta?.response?.status === 401
  );
}

const LOCALHOST_PATTERN = /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?/i;

function isValidBaseUrl(url: string): boolean {
  try {
    const parsed = new URL(url.startsWith("http") ? url : `http://${url}`);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isLocalhostUrl(url: string): boolean {
  try {
    const parsed = new URL(url.startsWith("http") ? url : `http://${url}`);
    return (
      parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1"
    );
  } catch {
    return LOCALHOST_PATTERN.test(url);
  }
}

/**
 * Get the base URL for tRPC requests.
 * Native: uses ONLY EXPO_PUBLIC_API_URL (no heuristic guessing).
 * Web: relative URL (empty string).
 */
export const getBaseUrl = (): string => {
  if (Platform.OS === "web") {
    return typeof window !== "undefined" ? "" : "http://localhost:3000";
  }
  const url =
    process.env.EXPO_PUBLIC_API_URL ??
    Constants.expoConfig?.extra?.apiUrl ??
    "http://localhost:3001";

  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log("[tRPC] Resolved baseUrl:", url);
    if (!isValidBaseUrl(url)) {
      // eslint-disable-next-line no-console
      console.warn(
        "[tRPC] EXPO_PUBLIC_API_URL must include http:// or https:// and a host. " +
          "Fix: Set EXPO_PUBLIC_API_URL=http://<LAN_IP>:3001 in apps/mobile/.env"
      );
    }
    if (isLocalhostUrl(url)) {
      // eslint-disable-next-line no-console
      console.warn(
        "[tRPC] EXPO_PUBLIC_API_URL is localhost. On a physical device this will fail. " +
          "Fix: Set EXPO_PUBLIC_API_URL=http://<LAN_IP>:3001 in apps/mobile/.env (run ipconfig for LAN IP)"
      );
    }
  }
  return url;
};

/**
 * Get the tRPC URL path. Standalone API (port 3001) uses /trpc; Next.js (port 3000) uses /api/trpc.
 */
function getTrpcPath(baseUrl: string): string {
  return baseUrl.includes(":3000") ? "/api/trpc" : "/trpc";
}

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
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const router = useRouter();
  const handling401Ref = useRef(false);
  const getTokenRef = useRef(getToken);
  const lastRequestHadTokenRef = useRef(false);
  const authStateRef = useRef<{ isLoaded: boolean | undefined; isSignedIn: boolean | undefined }>({ 
    isLoaded: false, 
    isSignedIn: false 
  });
  authStateRef.current = { isLoaded, isSignedIn };
  
  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  useEffect(() => {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log("[tRPC] Provider mounted with auth state:", { isLoaded, isSignedIn });
    }
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    const handle401 = async () => {
      if (handling401Ref.current) return;
      const { isLoaded: loaded, isSignedIn: signedIn } = authStateRef.current;
      if (!loaded || !signedIn || !lastRequestHadTokenRef.current) {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.log(
            "[tRPC] 401 ignored: auth not ready or no token sent",
            { loaded, signedIn, hadToken: lastRequestHadTokenRef.current }
          );
        }
        return;
      }
      handling401Ref.current = true;
      try {
        await signOut();
        router.replace("/(auth)/welcome");
        Alert.alert("Session expired", "Please sign in again.");
      } catch (e) {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.warn("[tRPC] 401 signOut failed:", e);
        }
        router.replace("/(auth)/welcome");
      } finally {
        handling401Ref.current = false;
      }
    };

    const unsubQuery = queryClient.getQueryCache().subscribe((event) => {
      if (event?.type === "updated" && event.query.state.status === "error") {
        const err = event.query.state.error;
        if (is401Error(err)) handle401();
      }
    });
    const unsubMutation = queryClient.getMutationCache().subscribe((event) => {
      if (event?.type === "updated" && event.mutation.state.status === "error") {
        const err = event.mutation.state.error;
        if (is401Error(err)) handle401();
      }
    });
    return () => {
      unsubQuery();
      unsubMutation();
    };
  }, [signOut, router]);

  const trpcClient = useMemo(() => {
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}${getTrpcPath(baseUrl)}`;
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log(
        "[tRPC] ✅ Client created",
        { baseUrl, url }
      );
    }
    return trpc.createClient({
      transformer: superjson,
      links: [
        loggerLink({
          enabled: (opts) =>
            __DEV__ ||
            (opts.direction === "down" && opts.result instanceof Error)
        }),
        httpBatchLink({
          url,
          fetch: (fetchUrl, options) => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);
            return fetch(fetchUrl, {
              ...options,
              signal: controller.signal
            }).finally(() => clearTimeout(timeoutId));
          },
          async headers() {
            lastRequestHadTokenRef.current = false;
            try {
              const token = await getTokenRef.current({
                template: UMMATI_API_TOKEN_TEMPLATE
              });
              const tokenPresent = !!(
                token && typeof token === "string" && token.length > 0
              );
              lastRequestHadTokenRef.current = tokenPresent;
              const headers: Record<string, string> = {};
              if (tokenPresent) {
                headers.Authorization = `Bearer ${token}`;
              }
              if (__DEV__) {
                let decoded: { aud?: unknown; iss?: unknown } | null = null;
                try {
                  if (token) {
                    decoded = jwtDecode<{ aud?: unknown; iss?: unknown }>(token);
                  }
                } catch {
                  /* decode failed, use n/a */
                }
                // eslint-disable-next-line no-console
                console.log(
                  "[tRPC] JWT token present=",
                  tokenPresent,
                  "length=",
                  tokenPresent ? (token as string).length : 0,
                  "aud:",
                  decoded?.aud ?? "n/a",
                  "iss:",
                  decoded?.iss ?? "n/a"
                );
              }
              return headers;
            } catch (e) {
              if (__DEV__) {
                // eslint-disable-next-line no-console
                console.warn(
                  "[tRPC] getToken failed:",
                  e instanceof Error ? e.message : e
                );
              }
              return {};
            }
          }
        })
      ]
    });
  }, []); // Stable: baseUrl from env, getToken via ref

  return React.createElement(
    trpc.Provider,
    { client: trpcClient, queryClient, children }
  );
}
