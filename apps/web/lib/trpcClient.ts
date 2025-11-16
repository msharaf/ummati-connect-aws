import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink, loggerLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "@ummati/api";
import { useAuthStore } from "../store/useAuthStore";

const getBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:2023";

export const trpc = createTRPCReact<AppRouter>();

export const transformer = superjson;

export const createLinks = () => [
  loggerLink({
    enabled: (opts) =>
      process.env.NODE_ENV === "development" ||
      (opts.direction === "down" && opts.result instanceof Error)
  }),
  httpBatchLink({
    url: `${getBaseUrl()}/trpc`,
    headers() {
      const { user } = useAuthStore.getState();
      return {
        ...(user?.id ? { "x-user-id": user.id } : {}),
        ...(user?.role ? { "x-user-role": user.role } : {})
      };
    }
  })
];

export const getTrpcClientConfig = () => ({
  transformer,
  links: createLinks()
});

