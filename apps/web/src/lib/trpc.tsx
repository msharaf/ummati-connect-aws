"use client";

import React, { useMemo, useRef, useEffect } from "react";
import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink, loggerLink } from "@trpc/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import superjson from "superjson";
import type { AppRouter } from "@ummati/api";
import { UMMATI_API_TOKEN_TEMPLATE } from "@ummati/api";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  if (typeof window !== "undefined") return "";
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
};

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 1000
          }
        }
      })
  );

  const trpcClient = useMemo(
    () =>
      trpc.createClient({
        transformer: superjson,
        links: [
          loggerLink({
            enabled: (opts) =>
              process.env.NODE_ENV === "development" ||
              (opts.direction === "down" && opts.result instanceof Error)
          }),
          httpBatchLink({
            url: `${getBaseUrl()}/api/trpc`,
            fetch(url, options) {
              return fetch(url, {
                ...options,
                credentials: "include"
              });
            },
            async headers() {
              let token: string | null = null;
              try {
                token = await getTokenRef.current({
                  template: UMMATI_API_TOKEN_TEMPLATE
                });
              } catch {
                token = await getTokenRef.current();
              }
              const headers: Record<string, string> = {};
              if (token) {
                headers.Authorization = `Bearer ${token}`;
              }
              return headers;
            }
          })
        ]
      }),
    []
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}

