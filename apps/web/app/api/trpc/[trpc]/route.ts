import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import type { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { rootRouter } from "@ummati/api";
import { createContext } from "@ummati/api";

const handler = async (req: NextRequest) => {
  const response = await fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: rootRouter,
    createContext: async () => {
      // Get Clerk user ID from Next.js server-side auth
      // auth() automatically reads from cookies in the request
      const { userId } = await auth();

      // Also check for Authorization header (for mobile clients)
      const authHeader = req.headers.get("Authorization");
      const authToken = authHeader?.replace("Bearer ", "") || null;

      // Debug logging in development
      if (process.env.NODE_ENV === "development") {
        if (userId) {
          console.log("✅ tRPC context: User authenticated", userId);
        } else {
          console.warn("⚠️ tRPC context: No userId - user not authenticated");
        }
      }

      return createContext({
        userId: userId || null,
        authToken
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

  return response;
};

export const GET = handler;
export const POST = handler;
