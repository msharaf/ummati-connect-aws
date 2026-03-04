import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import type { NextRequest } from "next/server";
import { rootRouter, createContext } from "@ummati/api";

const handler = async (req: NextRequest) => {
  const response = await fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: rootRouter,
    createContext: async () => {
      const authHeader = req.headers.get("Authorization");
      const authToken =
        authHeader?.startsWith("Bearer ")
          ? authHeader.slice(7).trim()
          : authHeader?.trim() || null;
      return createContext({ authToken });
    },
    onError:
      process.env.NODE_ENV === "development"
        ? ({ path, error }: { path?: string; error: Error }) => {
            console.error(
              `❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`
            );
          }
        : undefined
  });

  return response;
};

export const GET = handler;
export const POST = handler;
