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
      const { userId } = await auth();
      const authHeader = req.headers.get("Authorization");
      const authToken =
        authHeader?.startsWith("Bearer ")
          ? authHeader.slice(7).trim()
          : authHeader?.trim() || null;

      if (process.env.NODE_ENV !== "production") {
        console.log(
          `   🔑 tRPC: authHeader=${authToken ? "present" : "missing"}, userId from cookies=${userId ?? "null"}`
        );
      }

      return createContext({
        userId: userId ?? null,
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

  return response;
};

export const GET = handler;
export const POST = handler;
