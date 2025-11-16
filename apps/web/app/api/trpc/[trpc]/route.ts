import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import type { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { rootRouter } from "@ummati/api";
import { createContext } from "@ummati/api";

const handler = (req: NextRequest) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: rootRouter,
    createContext: async () => {
      // Get Clerk user ID from Next.js server-side auth
      const { userId } = await auth();

      // Also check for Authorization header (for mobile clients)
      const authHeader = req.headers.get("Authorization");
      const authToken = authHeader?.replace("Bearer ", "") || null;

      return createContext({
        userId: userId || null,
        authToken: authToken || null
      });
    },
    onError:
      process.env.NODE_ENV === "development"
        ? ({ path, error }) => {
            console.error(
              `❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`
            );
          }
        : undefined
  });
};

export const GET = handler;
export const POST = handler;
