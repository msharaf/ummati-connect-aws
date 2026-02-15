/**
 * Standalone server for development/testing
 * In production, the API is used via Next.js API routes
 */

// Load environment variables from .env file
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env") });

import { createServer } from "http";
import { URL } from "url";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { rootRouter } from "./root";
import { createContext } from "./context";

const PORT = Number(process.env.PORT ?? 3001);

// Check for required environment variables
if (!process.env.CLERK_SECRET_KEY) {
  console.warn("⚠️  CLERK_SECRET_KEY not set - authentication will fail!");
  console.warn("   Create packages/api/.env with CLERK_SECRET_KEY=sk_test_...");
}

// CORS headers for mobile app
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Helper to read request body
function getBody(req: any): Promise<string> {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk: Buffer) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      resolve(body);
    });
  });
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  
  // Set CORS headers for all responses
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }
  
  // Log incoming requests in development
  const requestStartTime = Date.now();
  if (process.env.NODE_ENV !== "production") {
    console.log(`📥 ${req.method} ${url.pathname} - ${new Date().toISOString()}`);
  }
  
  // Handle tRPC requests
  if (url.pathname.startsWith("/trpc")) {
    // If hitting /trpc directly, show available procedures
    if (url.pathname === "/trpc" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify(
          {
            message: "tRPC API Endpoint",
            info: "This is a tRPC server. Use specific procedure paths to make calls.",
            availableProcedures: {
              "auth.ping": {
                type: "query",
                public: true,
                description: "Health check endpoint"
              },
              "auth.me": {
                type: "query",
                public: false,
                description: "Get current authenticated user info"
              }
            },
            example: "Use /trpc/auth.ping to call the ping procedure",
            documentation: "https://trpc.io/docs"
          },
          null,
          2
        )
      );
      return;
    }
    
    // Read request body
    const body = await getBody(req);
    
    // Convert Node.js request to Fetch API Request
    const isTls = "encrypted" in req.socket && (req.socket as { encrypted?: boolean }).encrypted;
    const protocol = isTls ? "https:" : "http:";
    const host = req.headers.host || "localhost";
    const fullUrl = `${protocol}//${host}${req.url}`;
    
    // Convert Node.js headers to Headers object
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value) {
        if (Array.isArray(value)) {
          value.forEach((v) => headers.append(key, v));
        } else {
          headers.set(key, value);
        }
      }
    }
    
    const fetchReq = new Request(fullUrl, {
      method: req.method || "GET",
      headers,
      body: body || undefined
    });
    
    let response;
    try {
      const contextStartTime = Date.now();
      response = await fetchRequestHandler({
        endpoint: "/trpc",
        req: fetchReq,
        router: rootRouter,
        createContext: async () => {
          // Extract auth token from headers
          const authHeader = req.headers.authorization;
          const authToken = authHeader?.replace("Bearer ", "") || null;
          
          if (process.env.NODE_ENV !== "production") {
            console.log(`   🔑 Auth token: ${authToken ? "present" : "missing"}`);
          }
          
          const ctx = await createContext({
            userId: null,
            authToken
          });
          
          if (process.env.NODE_ENV !== "production") {
            const contextTime = Date.now() - contextStartTime;
            console.log(`   ✅ Context created (${contextTime}ms) - userId: ${ctx.userId || "null"}`);
          }
          
          return ctx;
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
      
      const totalTime = Date.now() - requestStartTime;
      if (process.env.NODE_ENV !== "production") {
        console.log(`   ✅ Response sent (${totalTime}ms) - Status: ${response.status}`);
      }
    } catch (error) {
      const totalTime = Date.now() - requestStartTime;
      console.error(`❌ Request failed after ${totalTime}ms:`, error instanceof Error ? error.message : "Unknown error");
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal server error" }));
      return;
    }

    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    res.statusCode = response.status;
    res.end(await response.text());
    return;
  }

  // Root endpoint - API information
  if (url.pathname === "/" || url.pathname === "") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify(
        {
          name: "Ummati API",
          version: "0.1.0",
          status: "running",
          endpoints: {
            trpc: "/trpc",
            health: "/health"
          },
          documentation: "This is a tRPC API server. Use the /trpc endpoint for API calls."
        },
        null,
        2
      )
    );
    return;
  }

  // Health check
  if (url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  // 404
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      error: "Not Found",
      message: `The endpoint ${url.pathname} does not exist.`,
      availableEndpoints: ["/", "/trpc", "/health"]
    })
  );
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 API server running on http://0.0.0.0:${PORT}`);
  console.log(`   Accessible at: http://localhost:${PORT} (local)`);
  console.log(`   tRPC endpoint: http://localhost:${PORT}/trpc`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  console.log(`   CLERK_SECRET_KEY: ${process.env.CLERK_SECRET_KEY ? "✅ Set" : "❌ Missing"}`);
  console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? "✅ Set" : "❌ Missing"}`);
});

