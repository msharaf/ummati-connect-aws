/**
 * Standalone server for development/testing
 * In production, the API is used via Next.js API routes
 */

import { createServer } from "http";
import { URL } from "url";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { rootRouter } from "./root";
import { createContext } from "./context";

const PORT = process.env.PORT || 3001;

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
    const protocol = req.socket.encrypted ? "https:" : "http:";
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
    
    const response = await fetchRequestHandler({
      endpoint: "/trpc",
      req: fetchReq,
      router: rootRouter,
      createContext: async () => {
        // Extract auth token from headers
        const authHeader = req.headers.authorization;
        const authToken = authHeader?.replace("Bearer ", "") || null;
        
        return createContext({
          userId: null,
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

server.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
  console.log(`   tRPC endpoint: http://localhost:${PORT}/trpc`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
});

